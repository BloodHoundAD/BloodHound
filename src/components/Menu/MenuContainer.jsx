import React, { useEffect, useRef, useState } from 'react';
import { remote } from 'electron';
import { useAlert } from 'react-alert';
import MenuButton from './MenuButton';
import { isZipSync } from 'is-zip-file';
import sanitize from 'sanitize-filename';
import { pick } from 'stream-json/filters/Pick';
import { chain } from 'stream-chain';
import fs from 'fs';
import path from 'path';
import { parser } from 'stream-json';
import AdmZip from 'adm-zip';
import * as NewIngestion from '../../js/newingestion';
import { AzureLabels } from '../../js/newingestion';
import UploadStatusContainer from '../Float/UploadStatusContainer';
import { streamArray } from 'stream-json/streamers/StreamArray';

const { dialog, app } = remote;

const { batch } = require('stream-json/utils/Batch');

export const FileStatus = Object.freeze({
    ParseError: 0,
    InvalidVersion: 1,
    BadType: 2,
    Waiting: 3,
    Processing: 4,
    Done: 5,
    NoData: 6,
});

const IngestFuncMap = {
    computers: NewIngestion.buildComputerJsonNew,
    groups: NewIngestion.buildGroupJsonNew,
    users: NewIngestion.buildUserJsonNew,
    domains: NewIngestion.buildDomainJsonNew,
    ous: NewIngestion.buildOuJsonNew,
    gpos: NewIngestion.buildGpoJsonNew,
    containers: NewIngestion.buildContainerJsonNew,
    azure: NewIngestion.convertAzureData,
};

const MenuContainer = () => {
    const alert = useAlert();
    const fileId = useRef(0);
    const input = useRef(null);
    const [fileQueue, setFileQueue] = useState({});
    const [uploading, setUploading] = useState(false);
    const [uploadVisible, setUploadVisible] = useState(false);
    const [needsPostProcess, setNeedsPostProcess] = useState(false);
    const [postProcessRunning, setPostProcessRunning] = useState(false);
    const [postProcessStep, setPostProcessStep] = useState(0);
    const [postProcessVisible, setPostProcessVisible] = useState(false);

    const batchSize = 1000;

    useEffect(() => {
        emitter.on('cancelUpload', cancelUpload);
        emitter.on('filedrop', filesDropped);
        emitter.on('importShim', importClick);
        return () => {
            emitter.removeListener('cancelUpload', cancelUpload);
            emitter.removeListener('filedrop', filesDropped);
            emitter.removeListener('importShim', importClick);
        };
    }, []);

    const inputUsed = (e) => {
        let fileNames = [];
        $.each(e.target.files, function (_, file) {
            fileNames.push({ path: file.path, name: file.name });
        });
        unzipFiles(fileNames);
    };

    const filesDropped = (e) => {
        let fileNames = [];
        $.each(e.dataTransfer.files, function (_, file) {
            fileNames.push({ path: file.path, name: file.name });
        });
        unzipFiles(fileNames);
    };

    const unzipFiles = async (files) => {
        let finalFiles = [];
        const tempPath = app.getPath('temp');
        for (let file of files) {
            let fPath = file.path;
            let name = file.name;

            if (isZipSync(fPath)) {
                alert.info(`Unzipping file ${name}`);
                const zip = new AdmZip(fPath);
                const zipEntries = zip.getEntries();
                for (let entry of zipEntries) {
                    let sanitizedPath = sanitize(entry.entryName);
                    let output = path.join(tempPath, sanitizedPath);
                    zip.extractEntryTo(
                        entry.entryName,
                        tempPath,
                        false,
                        true,
                        false,
                        sanitizedPath
                    );

                    finalFiles.push({
                        path: output,
                        name: sanitizedPath,
                        zip_name: name,
                        delete: true,
                        id: fileId.current,
                    });
                    fileId.current += 1;
                }
            } else {
                finalFiles.push({
                    path: fPath,
                    name: name,
                    delete: false,
                    id: fileId.current,
                });
                fileId.current += 1;
            }
        }

        await checkFileValidity(finalFiles);
    };

    const getMetaTagQuick = async (file) => {
        let size = fs.statSync(file.path).size;
        let start = size - 300;
        if (start <= 0) {
            start = 0;
        }

        //Try end of file first
        let prom = new Promise((resolve, reject) => {
            fs.createReadStream(file.path, {
                encoding: 'utf8',
                start: start,
                end: size,
            }).on('data', (chunk) => {
                let type, version, count;
                try {
                    let search = [...chunk.matchAll(/"type.?:\s?"(\w*)"/g)];
                    type = search[search.length - 1][1];
                    search = [...chunk.matchAll(/"count.?:\s?(\d*)/g)];
                    count = parseInt(search[search.length - 1][1]);
                } catch (e) {
                    type = null;
                    count = null;
                }
                try {
                    let search = [...chunk.matchAll(/"version.?:\s?(\d*)/g)];
                    version = parseInt(search[search.length - 1][1]);
                } catch (e) {
                    version = null;
                }

                resolve({
                    count: count,
                    type: type,
                    version: version,
                });
            });
        });

        let meta = await prom;
        if (meta.type !== null && meta.count !== null) {
            return meta;
        }

        //Try the beginning of the file next
        prom = new Promise((resolve, reject) => {
            fs.createReadStream(file.path, {
                encoding: 'utf8',
                start: 0,
                end: 300,
            }).on('data', (chunk) => {
                let type, version, count;
                try {
                    type = /type.?:\s+"(\w*)"/g.exec(chunk)[1];
                    count = parseInt(/count.?:\s+(\d*)/g.exec(chunk)[1]);
                } catch (e) {
                    type = null;
                    count = null;
                }
                try {
                    version = parseInt(/version.?:\s+(\d*)/g.exec(chunk)[1]);
                } catch (e) {
                    version = null;
                }

                resolve({
                    count: count,
                    type: type,
                    version: version,
                });
            });
        });

        meta = await prom;
        return meta;
    };

    const checkFileValidity = async (files) => {
        let filteredFiles = {};
        for (let file of files) {
            let meta = await getMetaTagQuick(file);

            if (!('version' in meta) || meta.version < 4) {
                filteredFiles[file.id] = {
                    ...file,
                    status: FileStatus.InvalidVersion,
                };
                continue;
            }

            if (!Object.keys(IngestFuncMap).includes(meta.type)) {
                console.log(meta.type);
                filteredFiles[file.id] = {
                    ...file,
                    status: FileStatus.BadType,
                };
                continue;
            }

            filteredFiles[file.id] = {
                ...file,
                status: meta.count > 0 ? FileStatus.Waiting : FileStatus.NoData,
                count: meta.count,
                type: meta.type,
                progress: 0,
            };
        }
        setUploadVisible(true);
        setPostProcessStep(0);
        setPostProcessVisible(true);
        setFileQueue((state) => {
            return { ...state, ...filteredFiles };
        });
    };

    const processJson = async (file) => {
        file.status = FileStatus.Processing;
        setFileQueue((state) => {
            return { ...state, [file.id]: file };
        });
        console.log(`Processing ${file.name} with ${file.count} entries`);
        console.time('IngestTime');

        const pipeline = chain([
            fs.createReadStream(file.path, { encoding: 'utf8' }),
            parser(),
            pick({ filter: 'data' }),
            streamArray(),
            (data) => data.value,
            batch({ batchSize: 200 }),
        ]);

        let count = 0;
        let processor = IngestFuncMap[file.type];
        pipeline.on('data', async (data) => {
            try {
                pipeline.pause();
                count += data.length;

                let processedData = processor(data);

                if (file.type === 'azure') {
                    for (let value of Object.values(
                        processedData.AzurePropertyMaps
                    )) {
                        let props = value.Props;
                        if (props.length === 0) continue;
                        let chunked = props.chunk();
                        let statement = value.Statement;

                        for (let chunk of chunked) {
                            await uploadData(statement, chunk);
                        }
                    }

                    for (let item of Object.values(
                        processedData.OnPremPropertyMaps
                    )) {
                        let props = item.Props;
                        if (props.length === 0) continue;
                        let chunked = props.chunk();
                        let statement = item.Statement;

                        for (let chunk of chunked) {
                            await uploadData(statement, chunk);
                        }
                    }

                    for (let item of Object.values(
                        processedData.RelPropertyMaps
                    )) {
                        let props = item.Props;
                        if (props.length === 0) continue;
                        let chunked = props.chunk();
                        let statement = item.Statement;

                        for (let chunk of chunked) {
                            await uploadData(statement, chunk);
                        }
                    }
                } else {
                    for (let key in processedData) {
                        let props = processedData[key].props;
                        if (props.length === 0) continue;
                        let chunked = props.chunk();
                        let statement = processedData[key].statement;

                        for (let chunk of chunked) {
                            await uploadData(statement, chunk);
                        }
                    }
                }

                file.progress = count;
                setFileQueue((state) => {
                    return { ...state, [file.id]: file };
                });

                pipeline.resume();
            } catch (e) {
                console.error(e);
            }

            return null;
        });

        pipeline.on('end', () => {
            setUploading(false);
            file.status = FileStatus.Done;
            if (file.delete) {
                fs.unlinkSync(file.path);
            }
            setFileQueue((state) => {
                return { ...state, [file.id]: file };
            });

            console.timeEnd('IngestTime');
            emitter.emit('refreshDBData');

            return null;
        });
    };

    const sleep_test = (ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    const uploadData = async (statement, props) => {
        let session = driver.session();
        await session.run(statement, { props: props }).catch((err) => {
            console.log(statement);
            console.log(err);
        });
        await session.close();
    };

    const clearFinished = () => {
        let temp = { ...fileQueue };

        if (Object.keys(temp).length === 0) {
            alert.error('Really?');
            return;
        }

        for (let key of Object.keys(temp)) {
            if (fileIsComplete(temp[key].status)) delete temp[key];
        }

        setFileQueue(temp);

        if (
            postProcessStep ===
            ADPostProcessSteps.length + AzurePostProcessSteps.length
        ) {
            setPostProcessVisible(false);
            setPostProcessStep(0);
        }
    };

    const closeUpload = () => {
        setUploadVisible(false);
    };

    useEffect(() => {
        const eff = async () => {
            if (postProcessRunning) {
                return;
            }
            if (!uploading) {
                let f;
                for (let file of Object.values(fileQueue)) {
                    if (file.status === FileStatus.Waiting) {
                        f = file;
                        break;
                    }
                }

                if (f !== undefined) {
                    setNeedsPostProcess(true);
                    setUploading(true);
                    await processJson(f);
                }

                if (f === undefined && needsPostProcess) {
                    for (let file of Object.values(fileQueue)) {
                        if (!fileIsComplete(file.status)) {
                            return;
                        }
                    }

                    setNeedsPostProcess(false);
                    setPostProcessRunning(true);
                    console.time('PostProcess');
                    await postProcessAD().catch(console.error);
                    await postProcessAzure().catch(console.error);
                    console.timeEnd('PostProcess');
                    console.log('Post-processing complete');
                    setPostProcessRunning(false);
                }
            }
        };

        eff().catch(console.error);
    }, [fileQueue]);

    const incrementPostProcessStep = () => {
        setPostProcessStep((postProcessStep) => postProcessStep + 1);
    };

    const postGetChanges = async (session) => {
        await session
            .run('MATCH (n:Domain) RETURN n.objectid AS domainid')
            .catch((err) => {
                console.log(err);
            })
            .then(async (res) => {
                for (let domain of res.records) {
                    let domainId = domain.get('domainid');

                    let getChangesResult = await session.run(
                        'MATCH (n)-[:MemberOf|GetChanges*1..]->(:Domain {objectid: $objectid}) RETURN n',
                        { objectid: domainId }
                    );
                    let getChangesPrincipals = [];
                    for (let principal of getChangesResult.records) {
                        getChangesPrincipals.push(
                            principal.get('n').properties.objectid
                        );
                    }

                    let getChangesAllResult = await session.run(
                        'MATCH (n)-[:MemberOf|GetChangesAll*1..]->(:Domain {objectid: $objectid}) RETURN n',
                        { objectid: domainId }
                    );
                    let getChangesAllPrincipals = [];
                    for (let principal of getChangesAllResult.records) {
                        getChangesAllPrincipals.push(
                            principal.get('n').properties.objectid
                        );
                    }

                    let getChangesFilteredResult = await session.run(
                        'MATCH (n)-[:MemberOf|GetChangesInFilteredSet*1..]->(:Domain {objectid: $objectid}) RETURN n',
                        { objectid: domainId }
                    );
                    let getChangesFilteredSetPrincipals = [];
                    for (let principal of getChangesFilteredResult.records) {
                        getChangesFilteredSetPrincipals.push(
                            principal.get('n').properties.objectid
                        );
                    }

                    let dcSyncPrincipals = getChangesPrincipals.filter(
                        (principal) =>
                            getChangesAllPrincipals.includes(principal)
                    );

                    if (dcSyncPrincipals.length > 0) {
                        console.log(
                            'Found DC Sync principals: ' +
                                dcSyncPrincipals.join(', ') +
                                ' in domain ' +
                                domainId
                        );
                        await session.run(
                            'UNWIND $syncers AS sync MATCH (n:Base {objectid: sync}) MATCH (m:Domain {objectid: $domainid}) MERGE (n)-[:DCSync {isacl: true, isinherited: false}]->(m)',
                            {
                                syncers: dcSyncPrincipals,
                                domainid: domainId,
                            }
                        );
                    }

                    let syncsLapsPrincipals = getChangesPrincipals.filter(
                        (principal) =>
                            getChangesFilteredSetPrincipals.includes(principal)
                    );

                    if (syncsLapsPrincipals.length > 0) {
                        console.log(
                            'Found SyncLAPSPassword principals: ' +
                                syncsLapsPrincipals.join(', ') +
                                ' in domain ' +
                                domainId
                        );
                        await session.run(
                            `UNWIND $syncers AS sync MATCH (n:Base {objectid: sync}) MATCH (m:Computer {domainsid: $domainid, haslaps:true}) 
                                CALL {
                                    WITH n, m
                                    MERGE (n)-[:SyncLAPSPassword {isacl: true, isinherited: false}]->(m)
                                } IN TRANSACTIONS OF 500 ROWS`,
                            {
                                syncers: syncsLapsPrincipals,
                                domainid: domainId,
                            }
                        );
                    }
                }
            });
    };

    const ADPostProcessSteps = [
        {
            step: 'baseOwned',
            type: 'query',
            statement:
                'MATCH (n) WHERE n:User or n:Computer AND NOT EXISTS(n.owned) CALL {WITH n SET n.owned = false} IN TRANSACTIONS OF 500 ROWS',
            params: null,
        },
        {
            step: 'baseHighValue',
            type: 'query',
            statement:
                'MATCH (n:Base) WHERE NOT EXISTS(n.highvalue) CALL { WITH n SET n.highvalue = false} IN TRANSACTIONS OF 500 ROWS',
            params: null,
        },
        {
            step: 'domainUserAssociation',
            type: 'query',
            statement:
                "MATCH (n:Group) WHERE n.objectid ENDS WITH '-513' OR n.objectid ENDS WITH '-515' WITH n UNWIND $sids AS sid MATCH (m:Group) WHERE m.objectid ENDS WITH sid MERGE (n)-[:MemberOf]->(m)",
            params: { sids: ['S-1-1-0', 'S-1-5-11'] }, //domain user sids
        },
        {
            step: 'postDCSync',
            type: 'callback',
            callback: postGetChanges,
        },
    ];

    const AzurePostProcessSteps = [
        {
            step: 'setTenantsHighValue',
            description: 'Mark all tenants as High Value',
            type: 'query',
            statement: 'MATCH (n:AZTenant) SET n.highvalue=TRUE',
            params: null,
        },
        {
            step: 'setGlobalAdminHighValue',
            description: 'Mark all global admins as High Value',
            type: 'query',
            statement: `MATCH (n:AZRole {templateid:"62E90394-69F5-4237-9190-012177145E10"})
                OPTIONAL MATCH (g:AZGroup)-[:AZHasRole]->(n)
                OPTIONAL MATCH (i)-[:AZMemberOf]->(g) WHERE i:AZUser OR i:AZServicePrincipal OR i:AZDevice
                OPTIONAL MATCH (p)-[:AZHasRole]->(n) WHERE p:AZUser OR p:AZServicePrincipal OR p:AZDevice
                CALL {
                    WITH g,i,p
                    SET g.highvalue=true, i.highvalue=true, p.highvalue=true
                } IN TRANSACTIONS OF 500 ROWS`,
            params: null,
        },
        {
            step: 'setPrivRoleAdminHighValue',
            description: 'Mark all privileged role admins as High Value',
            type: 'query',
            statement: `MATCH (n:AZRole {templateid:"E8611AB8-C189-46E8-94E1-60213AB1F814"})
                OPTIONAL MATCH (g:AZGroup)-[:AZHasRole]->(n)
                OPTIONAL MATCH (i)-[:AZMemberOf]->(g) WHERE i:AZUser OR i:AZServicePrincipal OR i:AZDevice
                OPTIONAL MATCH (p)-[:AZHasRole]->(n) WHERE p:AZUser OR p:AZServicePrincipal OR p:AZDevice
                CALL {
                    WITH g,i,p
                    SET g.highvalue=true, i.highvalue=true, p.highvalue=true
                } IN TRANSACTIONS OF 500 ROWS`,
            params: null,
        },
        {
            step: 'clearPostProcessesedRels',
            description: 'Blow away all existing post-processed relationships',
            type: 'query',
            statement:
                `MATCH (:AZBase)-[r:{0}]->() CALL { WITH r DELETE r } IN TRANSACTIONS OF {1} ROWS`.formatn(
                    [
                        AzureLabels.AddSecret,
                        AzureLabels.ExecuteCommand,
                        AzureLabels.ResetPassword,
                        AzureLabels.AddMembers,
                        AzureLabels.AddOwner,
                        AzureLabels.GlobalAdmin,
                        AzureLabels.PrivilegedAuthAdmin,
                        AzureLabels.PrivilegedRoleAdmin,
                        AzureLabels.MGAddSecret,
                        AzureLabels.MGAddOwner,
                        AzureLabels.MGAddMember,
                        AzureLabels.MGGrantAppRoles,
                        AzureLabels.MGGrantRole
                    ].join('|'),
                    batchSize
                ),
            params: null,
            log: (result) =>
                `Deleted ${
                    result.summary.counters.updates().relationshipsDeleted
                } post-processed rels`,
        },
        {
            step: 'createAZGlobalAdminEdges',
            description:
                'Global Admins get a direct edge to the AZTenant object they have that role assignment in',
            type: 'query',
            statement: `MATCH (n)-[:AZHasRole]->(m)<-[:AZContains]-(t:AZTenant)
                        WHERE m.templateid IN ['62E90394-69F5-4237-9190-012177145E10']
                        CALL {
                            WITH n,t
                            MERGE (n)-[:AZGlobalAdmin]->(t)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZGlobalAdmin Edges`,
        },
        {
            step: 'createAZPrivilegedRoleAdminEdges',
            description:
                'Privileged Role Admins get a direct edge to the AZTenant object they have that role assignment in',
            type: 'query',
            statement: `MATCH (n)-[:AZHasRole]->(m)<-[:AZContains]-(t:AZTenant)
                        WHERE m.templateid IN ['E8611AB8-C189-46E8-94E1-60213AB1F814']
                        CALL {
                            WITH n,t
                            MERGE (n)-[:AZPrivilegedRoleAdmin]->(t)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZPrivilegedRoleAdmin Edges`,
        },
        {
            step: 'createAZResetPasswordEdges',
            description:
                'Any principal with a password reset role can reset the password of other cloud-resident, non-external users in the same tenant, where those users do not have ANY AzureAD admin role assignment',
            type: 'query',
            statement: `MATCH (n)-[:AZHasRole]->(m)
                        WHERE m.templateid IN $pwResetRoles
                        WITH n
                        MATCH (at:AZTenant)-[:AZContains]->(n)
                        WITH at,n
                        MATCH (at)-[:AZContains]->(u:AZUser)
                        WHERE NOT (u)-[:AZHasRole]->()
                        AND NOT (u)-[:AZMemberOf|AZOwns]->(:AZGroup {isassignabletorole: true})
                        CALL {
                            WITH n, u
                            MERGE (n)-[:AZResetPassword]->(u)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                pwResetRoles: [
                    'C4E39BD9-1100-46D3-8C65-FB160DA0071F',
                    '62E90394-69F5-4237-9190-012177145E10',
                    '729827E3-9C14-49F7-BB1B-9608F156BBB8',
                    '966707D0-3269-4727-9BE2-8C3A10F19B9D',
                    '7BE44C8A-ADAF-4E2A-84D6-AB2649E08A13',
                    'FE930BE7-5E62-47DB-91AF-98C3A49A38B1',
                    '9980E02C-C2BE-4D73-94E8-173B1DC7CF3C',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZResetPassword Edges`,
        },
        {
            step: 'createAZResetPasswordEdges',
            description:
                'Global Admins and Privileged Authentication Admins can reset the password for any user in the same tenant',
            type: 'query',
            statement: `MATCH (n)-[:AZHasRole]->(m)
                        WHERE m.templateid IN $GAandPAA
                        MATCH (at:AZTenant)-[:AZContains]->(n)
                        MATCH (at)-[:AZContains]->(u:AZUser)
                        CALL {
                            WITH n, u
                            MERGE (n)-[:AZResetPassword]->(u)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                GAandPAA: [
                    '62E90394-69F5-4237-9190-012177145E10',
                    '7BE44C8A-ADAF-4E2A-84D6-AB2649E08A13',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZResetPassword Edges`,
        },
        {
            step: 'createAZResetPasswordEdges',
            description: `Authentication Admins can reset the password for other users with one or more of the following roles: 
        Auth Admins, Helpdesk Admins, Password Admins, Directory Readers, Guest Inviters, Message Center Readers, and Reports Readers
        Authentication admin template id: c4e39bd9-1100-46d3-8c65-fb160da0071f`,
            type: 'query',
            statement:
                `MATCH (at:AZTenant)-[:AZContains]->(AuthAdmin)-[:AZHasRole]->(AuthAdminRole:AZRole {templateid:"C4E39BD9-1100-46D3-8C65-FB160DA0071F"})
                MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)
                WHERE NOT ar.templateid IN $AuthAdminTargetRoles
                WITH COLLECT(NonTargets) AS NonTargets,at,AuthAdmin
                MATCH (at)-[:AZContains]->(AuthAdminTargets:AZUser)-[:AZHasRole]->(arTargets)
                WHERE NOT AuthAdminTargets IN NonTargets AND arTargets.templateid IN $AuthAdminTargetRoles
                AND NOT (AuthAdminTargets)-[:AZMemberOf|AZOwns]->(:AZGroup {isassignabletorole: true})
                CALL {
                    WITH AuthAdmin, AuthAdminTargets
                    MERGE (AuthAdmin)-[:AZResetPassword]->(AuthAdminTargets)
                } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                AuthAdminTargetRoles: [
                    'C4E39BD9-1100-46D3-8C65-FB160DA0071F',
                    '88D8E3E3-8F55-4A1E-953A-9B9898B8876B',
                    '95E79109-95C0-4D8E-AEE3-D01ACCF2D47B',
                    '729827E3-9C14-49F7-BB1B-9608F156BBB8',
                    '790C1FB9-7F7D-4F88-86A1-EF1F95C05C1B',
                    '4A5D8F65-41DA-4DE4-8968-E035B65339CF',
                    '966707D0-3269-4727-9BE2-8C3A10F19B9D',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZResetPassword Edges`,
        },
        {
            step: 'createAZResetPasswordEdges',
            description: `Helpdesk Admins can reset the password for other users with one or more of the following roles: 
        Auth Admin, Directory Readers, Guest Inviter, Helpdesk Administrator, Message Center Reader, Reports Reader
        Helpdesk Admin template id: 729827e3-9c14-49f7-bb1b-9608f156bbb8`,
            type: 'query',
            statement:
                `MATCH (at:AZTenant)-[:AZContains]->(HelpdeskAdmin)-[:AZHasRole]->(HelpdeskAdminRole:AZRole {templateid:"729827E3-9C14-49F7-BB1B-9608F156BBB8"})
                MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)
                WHERE NOT ar.templateid IN $HelpdeskAdminTargetRoles
                WITH COLLECT(NonTargets) AS NonTargets,at,HelpdeskAdmin
                MATCH (at)-[:AZContains]->(HelpdeskAdminTargets:AZUser)-[:AZHasRole]->(arTargets)
                WHERE NOT HelpdeskAdminTargets IN NonTargets AND arTargets.templateid IN $HelpdeskAdminTargetRoles
                AND NOT (HelpdeskAdminTargets)-[:AZMemberOf|AZOwns]->(:AZGroup {isassignabletorole: true})
                CALL {
                    WITH HelpdeskAdmin, HelpdeskAdminTargets
                    MERGE (HelpdeskAdmin)-[:AZResetPassword]->(HelpdeskAdminTargets)
                } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                HelpdeskAdminTargetRoles: [
                    'C4E39BD9-1100-46D3-8C65-FB160DA0071F',
                    '88D8E3E3-8F55-4A1E-953A-9B9898B8876B',
                    '95E79109-95C0-4D8E-AEE3-D01ACCF2D47B',
                    '729827E3-9C14-49F7-BB1B-9608F156BBB8',
                    '790C1FB9-7F7D-4F88-86A1-EF1F95C05C1B',
                    '4A5D8F65-41DA-4DE4-8968-E035B65339CF',
                    '966707D0-3269-4727-9BE2-8C3A10F19B9D',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZResetPassword Edges`,
        },
        {
            step: 'createAZResetPasswordEdges',
            description: `Password Admins can reset the password for other users with one or more of the following roles: Directory Readers, Guest Inviter, Password Administrator
        Password Admin template id: 966707d0-3269-4727-9be2-8c3a10f19b9d`,
            type: 'query',
            statement:
                `MATCH (at:AZTenant)-[:AZContains]->(PasswordAdmin)-[:AZHasRole]->(PasswordAdminRole:AZRole {templateid:"966707D0-3269-4727-9BE2-8C3A10F19B9D"})
                MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)
                WHERE NOT ar.templateid IN $PasswordAdminTargetRoles
                WITH COLLECT(NonTargets) AS NonTargets,at,PasswordAdmin
                MATCH (at)-[:AZContains]->(PasswordAdminTargets:AZUser)-[:AZHasRole]->(arTargets)
                WHERE NOT PasswordAdminTargets IN NonTargets AND arTargets.templateid IN $PasswordAdminTargetRoles
                AND NOT (PasswordAdminTargets)-[:AZMemberOf|AZOwns]->(:AZGroup {isassignabletorole: true})
                CALL {
                    WITH PasswordAdmin, PasswordAdminTargets
                    MERGE (PasswordAdmin)-[:AZResetPassword]->(PasswordAdminTargets)
                } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                PasswordAdminTargetRoles: [
                    '88D8E3E3-8F55-4A1E-953A-9B9898B8876B',
                    '95E79109-95C0-4D8E-AEE3-D01ACCF2D47B',
                    '966707D0-3269-4727-9BE2-8C3A10F19B9D',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZResetPassword Edges`,
        },
        {
            step: 'createAZResetPasswordEdges',
            description: `User Account Admins can reset the password for other users with one or more of the following roles: 
        Directory Readers, Guest Inviter, Helpdesk Administrator, Message Center Reader, Reports Reader, User Account Administrator
        User Account Admin template id: fe930be7-5e62-47db-91af-98c3a49a38b1`,
            type: 'query',
            statement:
                `MATCH (at:AZTenant)-[:AZContains]->(UserAccountAdmin)-[:AZHasRole]->(UserAccountAdminRole:AZRole {templateid:"FE930BE7-5E62-47DB-91AF-98C3A49A38B1"})
                MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)
                WHERE NOT ar.templateid IN $UserAccountAdminTargetRoles
                WITH COLLECT(NonTargets) AS NonTargets,at,UserAccountAdmin
                MATCH (at)-[:AZContains]->(UserAccountAdminTargets:AZUser)-[:AZHasRole]->(arTargets)
                WHERE NOT UserAccountAdminTargets IN NonTargets AND arTargets.templateid IN $UserAccountAdminTargetRoles
                AND NOT (UserAccountAdminTargets)-[:AZMemberOf|AZOwns]->(:AZGroup {isassignabletorole: true})
                CALL {
                    WITH UserAccountAdmin, UserAccountAdminTargets
                    MERGE (UserAccountAdmin)-[:AZResetPassword]->(UserAccountAdminTargets)
                } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                UserAccountAdminTargetRoles: [
                    '88D8E3E3-8F55-4A1E-953A-9B9898B8876B',
                    '95E79109-95C0-4D8E-AEE3-D01ACCF2D47B',
                    '729827E3-9C14-49F7-BB1B-9608F156BBB8',
                    '790C1FB9-7F7D-4F88-86A1-EF1F95C05C1B',
                    '4A5D8F65-41DA-4DE4-8968-E035B65339CF',
                    'FE930BE7-5E62-47DB-91AF-98C3A49A38B1',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZResetPassword Edges`,
        },
        {
            step: 'createAZAddSecretEdges',
            description: `Application Admin and Cloud App Admin can add secret to any tenant-resident app or service principal`,
            type: 'query',
            statement: `MATCH (at:AZTenant)
                        MATCH p = (at)-[:AZContains]->(Principal)-[:AZHasRole]->(Role)<-[:AZContains]-(at)
                        WHERE Role.templateid IN ['9B895D92-2CD3-44C7-9D02-A6AC2D5EA5C3','158C047A-C907-4556-B7EF-446551A6B5F7']
                        MATCH (at)-[:AZContains]->(target)
                        WHERE target:AZApp OR target:AZServicePrincipal
                        WITH Principal, target
                        CALL {
                            WITH Principal, target
                            MERGE (Principal)-[:AZAddSecret]->(target)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZAddSecret Edges`,
        },
        {
            step: 'createAZExecuteCommandEdges',
            description: `InTune Administrators have the ability to execute SYSTEM commands on a Windows device by abusing Endpoint Manager`,
            type: 'query',
            statement: `MATCH (azt:AZTenant)
                        MATCH (azt)-[:AZContains]->(InTuneAdmin)-[:AZHasRole]->(azr:AZRole {templateid:'3A2C62DB-5318-420D-8D74-23AFFEE5D9D5'})
                        MATCH (azt)-[:AZContains]->(azd:AZDevice)
                        WHERE toUpper(azd.operatingsystem) CONTAINS "WINDOWS" AND azd.mdmappid IN ['54B943F8-D761-4F8D-951E-9CEA1846DB5A','0000000A-0000-0000-C000-000000000000']
                        CALL {
                            WITH InTuneAdmin, azd
                            MERGE (InTuneAdmin)-[:AZExecuteCommand]->(azd)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZExecuteCommand Edges`,
        },
        {
            step: 'createAZAddMembersEdges',
            description: `These roles can alter memberships of non-role assignable security groups:
        GROUPS ADMIN, GLOBAL ADMIN, PRIV ROLE ADMIN, DIRECTORY WRITER, IDENTITY GOVERNANCE ADMIN, USER ADMINISTRATOR,
        INTUNE ADMINISTRATOR, KNOWLEDGE ADMINISTRATOR, KNOWLEDGE MANAGER`,
            type: 'query',
            statement: `MATCH (n)-[:AZHasRole]->(m)
                        WHERE m.templateid IN $addGroupMembersRoles
                        MATCH (at:AZTenant)-[:AZContains]->(n)
                        MATCH (at)-[:AZContains]->(azg:AZGroup)
                        WHERE azg.isassignabletorole IS null
		        OR azg.isassignabletorole = false
                        CALL {
                            WITH n, azg
                            MERGE (n)-[:AZAddMembers]->(azg)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                addGroupMembersRoles: [
                    'FDD7A751-B60B-444A-984C-02652FE8FA1C',
                    '62E90394-69F5-4237-9190-012177145E10',
                    'E8611AB8-C189-46E8-94E1-60213AB1F814',
                    '9360FEB5-F418-4BAA-8175-E2A00BAC4301',
                    '45D8D3C5-C802-45C6-B32A-1D70B5E1E86E',
                    'FE930BE7-5E62-47DB-91AF-98C3A49A38B1',
                    '3A2C62DB-5318-420D-8D74-23AFFEE5D9D5',
                    'B5A8DCF3-09D5-43A9-A639-8E29EF291470',
                    '744EC460-397E-42AD-A462-8B3F9747A02C',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZAddMembers Edges`,
        },
        {
            step: 'createAZAddMembersEdges',
            description: `These roles can alter memberships of role assignable security groups: GLOBAL ADMIN, PRIV ROLE ADMIN`,
            type: 'query',
            statement: `MATCH (n)-[:AZHasRole]->(m)
                        WHERE m.templateid IN $addGroupMembersRoles
                        MATCH (at:AZTenant)-[:AZContains]->(n)
                        MATCH (at)-[:AZContains]->(azg:AZGroup {isassignabletorole: true})
                        CALL {
                            WITH n,azg
                            MERGE (n)-[:AZAddMembers]->(azg)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                addGroupMembersRoles: [
                    '62E90394-69F5-4237-9190-012177145E10',
                    'E8611AB8-C189-46E8-94E1-60213AB1F814',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZAddMembers Edges`,
        },
        {
            step: 'createAZAddOwnerEdges',
            description: `These roles can update the owner of any AZApp: HYBRID IDENTITY ADMINISTRATOR, PARTNER TIER1 SUPPORT, PARTNER TIER2 SUPPORT, DIRECTORY SYNCHRONIZATION ACCOUNTS`,
            type: 'query',
            statement: `MATCH (n)-[:AZHasRole]->(m)
                        WHERE m.templateid IN $addOwnerRoles
                        MATCH (at:AZTenant)-[:AZContains]->(n)
                        MATCH (at)-[:AZContains]->(aza:AZApp)
                        CALL {
                            WITH n, aza
                            MERGE (n)-[:AZAddOwner]->(aza)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                addOwnerRoles: [
                    '8AC3FC64-6ECA-42EA-9E69-59F4C7B60EB2',
                    '4BA39CA4-527C-499A-B93D-D9B492C50246',
                    'E00E864A-17C5-4A4B-9C06-F5B95A8D5BD8',
                    'D29B2B05-8046-44BA-8758-1E26182FCF32',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZAddOwner Edges`,
        },
        {
            step: 'createAZAddOwnerEdges',
            description: `These roles can update the owner of any AZServicePrincipal: HYBRID IDENTITY ADMINISTRATOR, PARTNER TIER1 SUPPORT, PARTNER TIER2 SUPPORT, DIRECTORY SYNCHRONIZATION ACCOUNTS`,
            type: 'query',
            statement: `MATCH (n)-[:AZHasRole]->(m)
                        WHERE m.templateid IN $addOwnerRoles
                        MATCH (at:AZTenant)-[:AZContains]->(n)
                        MATCH (at)-[:AZContains]->(azsp:AZServicePrincipal)
                        CALL {
                            WITH n, azsp
                            MERGE (n)-[:AZAddOwner]->(azsp)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                addOwnerRoles: [
                    '8AC3FC64-6ECA-42EA-9E69-59F4C7B60EB2',
                    '4BA39CA4-527C-499A-B93D-D9B492C50246',
                    'E00E864A-17C5-4A4B-9C06-F5B95A8D5BD8',
                    'D29B2B05-8046-44BA-8758-1E26182FCF32',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZAddOwner Edges`,
        },
        {
            step: 'createAZMGApplicationReadWriteAllEdges',
            description:
                'Service Principals with the Application.ReadWrite.All MS Graph app role can add owners and secrets to all other Service Principals and App Registrations in the same tenant.',
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGApplication_ReadWrite_All]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(o)
                        WHERE o:AZApp OR o:AZServicePrincipal
                        CALL {
                            WITH n,o
                            MERGE (n)-[:AZMGAddSecret]->(o)
                            MERGE (n)-[:AZMGAddOwner]->(o)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGApplicationReadWriteAllEdges Edges`,
        },
        {
            step: 'createAZMGAppRoleAssignmentReadWriteAllEdges',
            description:
                'Service Principals with the AppRoleAssignment.ReadWrite.All MS Graph app role can add MS Graph app role assignments to any Service Principal in the same tenant, including the RoleManagement.ReadWrite.Directory role, allowing escalation to Global Admin.',
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGAppRoleAssignment_ReadWrite_All]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        CALL {
                            WITH n,t
                            MERGE (n)-[:AZMGGrantAppRoles]->(t)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGAppRoleAssignmentReadWriteAll Edges`,
        },
        {
            step: 'createAZMGDirectoryReadWriteAllEdges',
            description:
                'Service Principals with the Directory.ReadWrite.All MS Graph app role can add owners or members to all non role eligible security groups in the same tenant.',
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGDirectory_ReadWrite_All]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(g:AZGroup)
                        WHERE g.isassignabletorole IS NULL
                        CALL {
                            WITH n,g
                            MERGE (n)-[:AZMGAddMember]->(g)
                            MERGE (n)-[:AZMGAddOwner]->(g)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGDirectoryReadWriteAll Edges`,
        },
        {
            step: 'createAZMGGroupReadWriteAllEdges',
            description:
                'Service Principals with the Group.ReadWrite.All MS Graph app role can add owners or members to all non role eligible security groups in the same tenant.',
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGGroup_ReadWrite_All]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(g:AZGroup)
                        WHERE g.isassignabletorole IS NULL
                        CALL {
                            WITH n,g
                            MERGE (n)-[:AZMGAddMember]->(g)
                            MERGE (n)-[:AZMGAddOwner]->(g)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGGroupReadWriteAll Edges`,
        },
        {
            step: 'createAZMGGroupMemberReadWriteAllEdges',
            description:
                'Service Principals with the GroupMember.ReadWrite.All MS Graph app role can add members to all non role eligible security groups in the same tenant.',
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGGroupMember_ReadWrite_All]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(g:AZGroup)
                        WHERE g.isassignabletorole IS NULL
                        CALL {
                            WITH n,g
                            MERGE (n)-[:AZMGAddMember]->(g)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGGroupMemberReadWriteAll Edges`,
        },
        {
            step: 'createAZMGRoleManagementReadWriteDirectoryEdgesPart1',
            description:
                `Service Principals with the RoleManagement.ReadWrite.Directory MS Graph app role can:
                    Grant all AzureAD admin roles, including Global Administrator
                    Grant all MS Graph app roles
                    Add secrets to any Service Principal in the same tenant
                    Add owners to any Service Principal in the same tenant
                    Add secrets to any App Registation in the same tenant
                    Add owners to any App Registration in the same tenant
                    Add owners to any Group in the same tenant
                    Add members to any Group in the same tenant`,
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGRoleManagement_ReadWrite_Directory]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(r:AZRole)
                        CALL {
                            WITH n,t
                            MERGE (n)-[:AZMGGrantAppRoles]->(t)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGRoleManagementReadWriteDirectoryPart1 Edges`,
        },
        {
            step: 'createAZMGRoleManagementReadWriteDirectoryEdgesPart2',
            description:
                `Service Principals with the RoleManagement.ReadWrite.Directory MS Graph app role can:
                    Grant all AzureAD admin roles, including Global Administrator
                    Grant all MS Graph app roles
                    Add secrets to any Service Principal in the same tenant
                    Add owners to any Service Principal in the same tenant
                    Add secrets to any App Registation in the same tenant
                    Add owners to any App Registration in the same tenant
                    Add owners to any Group in the same tenant
                    Add members to any Group in the same tenant`,
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGRoleManagement_ReadWrite_Directory]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(r:AZRole)
                        CALL {
                            WITH n,r
                            MERGE (n)-[:AZMGGrantRole]->(r)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGRoleManagementReadWriteDirectoryPart2 Edges`,
        },
        {
            step: 'createAZMGRoleManagementReadWriteDirectoryEdgesPart3',
            description:
                `Service Principals with the RoleManagement.ReadWrite.Directory MS Graph app role can:
                    Grant all AzureAD admin roles, including Global Administrator
                    Grant all MS Graph app roles
                    Add secrets to any Service Principal in the same tenant
                    Add owners to any Service Principal in the same tenant
                    Add secrets to any App Registation in the same tenant
                    Add owners to any App Registration in the same tenant
                    Add owners to any Group in the same tenant
                    Add members to any Group in the same tenant`,
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGRoleManagement_ReadWrite_Directory]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(s:AZServicePrincipal)
                        CALL {
                            WITH n,s
                            MERGE (n)-[:AZMGAddSecret]->(s)
                            MERGE (n)-[:AZMGAddOwner]->(s)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGRoleManagementReadWriteDirectoryPart3 Edges`,
        },
        {
            step: 'createAZMGRoleManagementReadWriteDirectoryEdgesPart4',
            description:
                `Service Principals with the RoleManagement.ReadWrite.Directory MS Graph app role can:
                    Grant all AzureAD admin roles, including Global Administrator
                    Grant all MS Graph app roles
                    Add secrets to any Service Principal in the same tenant
                    Add owners to any Service Principal in the same tenant
                    Add secrets to any App Registation in the same tenant
                    Add owners to any App Registration in the same tenant
                    Add owners to any Group in the same tenant
                    Add members to any Group in the same tenant`,
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGRoleManagement_ReadWrite_Directory]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(a:AZApp)
                        CALL {
                            WITH n,a
                            MERGE (n)-[:AZMGAddSecret]->(a)
                            MERGE (n)-[:AZMGAddOwner]->(a)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGRoleManagementReadWriteDirectoryPart4 Edges`,
        },
        {
            step: 'createAZMGRoleManagementReadWriteDirectoryEdgesPart5',
            description:
                `Service Principals with the RoleManagement.ReadWrite.Directory MS Graph app role can:
                    Grant all AzureAD admin roles, including Global Administrator
                    Grant all MS Graph app roles
                    Add secrets to any Service Principal in the same tenant
                    Add owners to any Service Principal in the same tenant
                    Add secrets to any App Registation in the same tenant
                    Add owners to any App Registration in the same tenant
                    Add owners to any Group in the same tenant
                    Add members to any Group in the same tenant`,
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGRoleManagement_ReadWrite_Directory]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(g:AZGroup)
                        CALL {
                            WITH n,g
                            MERGE (n)-[:AZMGAddOwner]->(g)
                            MERGE (n)-[:AZMGAddMember]->(g)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGRoleManagementReadWriteDirectoryPart5 Edges`,
        },
        {
            step: 'createAZMGServicePrincipalEndpointReadWriteAllEdges',
            description:
                'Service Principals with the ServicePrincipalEndpoint.ReadWrite.All MS Graph app role can add owners to all other Service Principals in the same tenant.',
            type: 'query',
            statement: `MATCH (n:AZServicePrincipal)-[:AZMGServicePrincipalEndpoint_ReadWrite_All]->(m:AZServicePrincipal)<-[:AZContains]-(t:AZTenant)
                        MATCH (t)-[:AZContains]->(s:AZServicePrincipal)
                        CALL {
                            WITH n,s
                            MERGE (n)-[:AZMGAddOwner]->(s)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZMGServicePrincipalEndpointReadWriteAll Edges`,
        },
    ];

    const executePostProcessSteps = async (steps, session) => {
        for (let step of steps) {
            if (step.type === 'query') {
                await session
                    .run(step.statement, step.params)
                    .catch((err) => {
                        console.log(err);
                    })
                    .then((res) => {
                        if (typeof step.log !== 'undefined')
                            try {
                                console.log(step.log(res));
                            } catch (err) {
                                console.log(err);
                            }
                    });
            } else if (step.type === 'callback') {
                await step.callback(session);
            } else {
                console.log('Type of step unrecognized');
            }
            incrementPostProcessStep();
        }
    };

    const postProcessAD = async () => {
        console.log('Running post processing queries');
        let session = driver.session();

        await executePostProcessSteps(ADPostProcessSteps, session);

        await session.close();
    };

    const postProcessAzure = async () => {
        console.log('Running azure post-processing queries');
        let session = driver.session();

        await executePostProcessSteps(AzurePostProcessSteps, session);

        await session.close();
    };

    /**
     *
     * @param {FileStatus} status
     */
    const fileIsComplete = (status) => {
        return (
            status !== FileStatus.Waiting && status !== FileStatus.Processing
        );
    };

    const cancelUpload = () => {};

    const aboutClick = () => {
        emitter.emit('showAbout');
    };

    const settingsClick = () => {
        emitter.emit('openSettings');
    };

    const changeLayoutClick = () => {
        emitter.emit('changeLayout');
    };

    const exportClick = () => {
        emitter.emit('showExport');
    };

    const importClick = () => {
        closeTooltip();
        dialog
            .showOpenDialog({
                properties: ['openFile'],
            })
            .then((r) => {
                if (typeof r !== 'undefined') {
                    emitter.emit('import', r.filePaths[0]);
                }
            });
    };

    const refreshClick = (e) => {
        if (e.ctrlKey) {
            emitter.emit('graphReload');
        } else {
            emitter.emit('graphRefresh');
        }
    };

    const getUploadClass = () => {
        if (uploading) {
            return 'fas fa-spinner fa-spin';
        } else {
            return 'fas fa-tasks';
        }
    };

    return (
        <div className='menudiv'>
            <div>
                <MenuButton
                    click={refreshClick}
                    hoverVal='Refresh'
                    glyphicon='fas fa-sync-alt'
                />
            </div>
            <div>
                <MenuButton
                    click={exportClick}
                    hoverVal='Export Graph'
                    glyphicon='fa fa-upload'
                />
            </div>
            <div>
                <MenuButton
                    click={importClick}
                    hoverVal='Import Graph'
                    glyphicon='fa fa-download'
                />
            </div>
            <div>
                <MenuButton
                    click={() => {
                        input.current.click();
                    }}
                    hoverVal='Upload Data'
                    glyphicon={'glyphicon glyphicon-upload'}
                />
            </div>
            <div>
                <MenuButton
                    click={() => {
                        setUploadVisible(true);
                    }}
                    hoverVal='View Upload Status'
                    glyphicon={getUploadClass()}
                />
            </div>
            <div>
                <MenuButton
                    click={changeLayoutClick}
                    hoverVal='Change Layout Type'
                    glyphicon='fa fa-chart-line'
                />
            </div>
            <div>
                <MenuButton
                    click={settingsClick}
                    hoverVal='Settings'
                    glyphicon='fa fa-cogs'
                />
            </div>
            <div>
                <MenuButton
                    click={aboutClick}
                    hoverVal='About'
                    glyphicon='fa fa-info'
                />
            </div>
            <input
                ref={input}
                multiple
                className='hide'
                type='file'
                onChange={inputUsed}
            />
            <UploadStatusContainer
                files={fileQueue}
                clearFinished={clearFinished}
                open={uploadVisible}
                close={closeUpload}
                postProcessStep={postProcessStep}
                postProcessVisible={postProcessVisible}
                adPostProcessCount={ADPostProcessSteps.length}
                azPostProcessCount={AzurePostProcessSteps.length}
            />
        </div>
    );
};

MenuContainer.propTypes = {};
export default MenuContainer;
