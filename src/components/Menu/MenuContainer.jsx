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
                    await postProcessAD().catch(console.error);
                    await postProcessAzure().catch(console.error);
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

    const postDcSync = async (session) => {
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
                            'UNWIND $syncers AS sync MATCH (n:Base {objectid: sync}) MATCH (m:Domain {objectid: $domainid}) MERGE (n)-[:DCSync]->(m)',
                            {
                                syncers: dcSyncPrincipals,
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
            callback: postDcSync,
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
                        AzureLabels.GlobalAdmin,
                        AzureLabels.PrivilegedAuthAdmin,
                        AzureLabels.PrivilegedRoleAdmin,
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
                        WHERE m.templateid IN ['62e90394-69f5-4237-9190-012177145e10']
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
                        WHERE m.templateid IN ['e8611ab8-c189-46e8-94e1-60213ab1f814']
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
                        CALL {
                            WITH n, u
                            MERGE (n)-[:AZResetPassword]->(u)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                pwResetRoles: [
                    'c4e39bd9-1100-46d3-8c65-fb160da0071f',
                    '62e90394-69f5-4237-9190-012177145e10',
                    '729827e3-9c14-49f7-bb1b-9608f156bbb8',
                    '966707d0-3269-4727-9be2-8c3a10f19b9d',
                    '7be44c8a-adaf-4e2a-84d6-ab2649e08a13',
                    'fe930be7-5e62-47db-91af-98c3a49a38b1',
                    '9980e02c-c2be-4d73-94e8-173b1dc7cf3c',
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
                    '62e90394-69f5-4237-9190-012177145e10',
                    '7be44c8a-adaf-4e2a-84d6-ab2649e08a13',
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
                `MATCH (at:AZTenant)-[:AZContains]->(AuthAdmin)-[:AZHasRole]->(AuthAdminRole:AZRole {templateid:"c4e39bd9-1100-46d3-8c65-fb160da0071f"})
                MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)
                WHERE NOT ar.templateid IN $AuthAdminTargetRoles
                WITH COLLECT(NonTargets) AS NonTargets,at,AuthAdmin
                MATCH (at)-[:AZContains]->(AuthAdminTargets:AZUser)-[:AZHasRole]->(arTargets)
                WHERE NOT AuthAdminTargets IN NonTargets AND arTargets.templateid IN $AuthAdminTargetRoles
                CALL {
                    WITH AuthAdmin, AuthAdminTargets
                    MERGE (AuthAdmin)-[:AZResetPassword]->(AuthAdminTargets)
                } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                AuthAdminTargetRoles: [
                    'c4e39bd9-1100-46d3-8c65-fb160da0071f',
                    '88d8e3e3-8f55-4a1e-953a-9b9898b8876b',
                    '95e79109-95c0-4d8e-aee3-d01accf2d47b',
                    '729827e3-9c14-49f7-bb1b-9608f156bbb8',
                    '790c1fb9-7f7d-4f88-86a1-ef1f95c05c1b',
                    '4a5d8f65-41da-4de4-8968-e035b65339cf',
                    '966707d0-3269-4727-9be2-8c3a10f19b9d',
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
                `MATCH (at:AZTenant)-[:AZContains]->(HelpdeskAdmin)-[:AZHasRole]->(HelpdeskAdminRole:AZRole {templateid:"729827e3-9c14-49f7-bb1b-9608f156bbb8"})
                MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)
                WHERE NOT ar.templateid IN $HelpdeskAdminTargetRoles
                WITH COLLECT(NonTargets) AS NonTargets,at,HelpdeskAdmin
                MATCH (at)-[:AZContains]->(HelpdeskAdminTargets:AZUser)-[:AZHasRole]->(arTargets)
                WHERE NOT HelpdeskAdminTargets IN NonTargets AND arTargets.templateid IN $HelpdeskAdminTargetRoles
                CALL {
                    WITH HelpdeskAdmin, HelpdeskAdminTargets
                    MERGE (HelpdeskAdmin)-[:AZResetPassword]->(HelpdeskAdminTargets)
                } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                HelpdeskAdminTargetRoles: [
                    'c4e39bd9-1100-46d3-8c65-fb160da0071f',
                    '88d8e3e3-8f55-4a1e-953a-9b9898b8876b',
                    '95e79109-95c0-4d8e-aee3-d01accf2d47b',
                    '729827e3-9c14-49f7-bb1b-9608f156bbb8',
                    '790c1fb9-7f7d-4f88-86a1-ef1f95c05c1b',
                    '4a5d8f65-41da-4de4-8968-e035b65339cf',
                    '966707d0-3269-4727-9be2-8c3a10f19b9d',
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
                `MATCH (at:AZTenant)-[:AZContains]->(PasswordAdmin)-[:AZHasRole]->(PasswordAdminRole:AZRole {templateid:"966707d0-3269-4727-9be2-8c3a10f19b9d"})
                MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)
                WHERE NOT ar.templateid IN $PasswordAdminTargetRoles
                WITH COLLECT(NonTargets) AS NonTargets,at,PasswordAdmin
                MATCH (at)-[:AZContains]->(PasswordAdminTargets:AZUser)-[:AZHasRole]->(arTargets)
                WHERE NOT PasswordAdminTargets IN NonTargets AND arTargets.templateid IN $PasswordAdminTargetRoles
                CALL {
                    WITH PasswordAdmin, PasswordAdminTargets
                    MERGE (PasswordAdmin)-[:AZResetPassword]->(PasswordAdminTargets)
                } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                PasswordAdminTargetRoles: [
                    '88d8e3e3-8f55-4a1e-953a-9b9898b8876b',
                    '95e79109-95c0-4d8e-aee3-d01accf2d47b',
                    '966707d0-3269-4727-9be2-8c3a10f19b9d',
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
                `MATCH (at:AZTenant)-[:AZContains]->(UserAccountAdmin)-[:AZHasRole]->(UserAccountAdminRole:AZRole {templateid:"fe930be7-5e62-47db-91af-98c3a49a38b1"})
                MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)
                WHERE NOT ar.templateid IN $UserAccountAdminTargetRoles
                WITH COLLECT(NonTargets) AS NonTargets,at,UserAccountAdmin
                MATCH (at)-[:AZContains]->(UserAccountAdminTargets:AZUser)-[:AZHasRole]->(arTargets)
                WHERE NOT UserAccountAdminTargets IN NonTargets AND arTargets.templateid IN $UserAccountAdminTargetRoles
                CALL {
                    WITH UserAccountAdmin, UserAccountAdminTargets
                    MERGE (UserAccountAdmin)-[:AZResetPassword]->(UserAccountAdminTargets)
                } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                UserAccountAdminTargetRoles: [
                    '88d8e3e3-8f55-4a1e-953a-9b9898b8876b',
                    '95e79109-95c0-4d8e-aee3-d01accf2d47b',
                    '729827e3-9c14-49f7-bb1b-9608f156bbb8',
                    '790c1fb9-7f7d-4f88-86a1-ef1f95c05c1b',
                    '4a5d8f65-41da-4de4-8968-e035b65339cf',
                    'fe930be7-5e62-47db-91af-98c3a49a38b1',
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
                        WHERE Role.templateid IN ['9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3','158c047a-c907-4556-b7ef-446551a6b5f7']
                        MATCH (at)-[:AZContains]->(target)
                        WHERE target:AZApp OR target:AZServicePrincipal
                        WITH Principal, target
                        CALL {
                            WITH Principal, target
                            MERGE (Principal)-[:AZAddSecret]->(target)
                        } IN TRANSACTIONS OF 10000 ROWS`,
            params: null,
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZAddSecret Edges`,
        },
        {
            step: 'createAZExecuteCommandEdges',
            description: `InTune Administrators and device owners have the ability to execute SYSTEM commands on a Windows device by abusing Endpoint Manager`,
            type: 'query',
            statement: `MATCH (azt:AZTenant)
                        MATCH (azt)-[:AZContains]->(InTuneAdmin)-[:AZHasRole]->(azr:AZRole {templateid:'3a2c62db-5318-420d-8d74-23affee5d9d5'})
                        MATCH (azt)-[:AZContains]->(azd:AZDevice)
                        WHERE toUpper(azd.operatingsystem) CONTAINS "WINDOWS" AND azd.mdmAppId IN ['54b943f8-d761-4f8d-951e-9cea1846db5a','0000000a-0000-0000-c000-000000000000']
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
                        MATCH (at)-[:AZContains]->(azg:AZGroup {isassignabletorole: false})
                        CALL {
                            WITH n, azg
                            MERGE (n)-[:AZAddMembers]->(azg)
                        } IN TRANSACTIONS OF {} ROWS`.format(batchSize),
            params: {
                addGroupMembersRoles: [
                    'fdd7a751-b60b-444a-984c-02652fe8fa1c”, “62e90394-69f5-4237-9190-012177145e10”, “e8611ab8-c189-46e8-94e1-60213ab1f814”, “9360feb5-f418-4baa-8175-e2a00bac4301”, “45d8d3c5-c802-45c6-b32a-1d70b5e1e86e”, “fe930be7-5e62-47db-91af-98c3a49a38b1”, “3a2c62db-5318-420d-8d74-23affee5d9d5”, “b5a8dcf3-09d5-43a9-a639-8e29ef291470”, “744ec460-397e-42ad-a462-8b3f9747a02c',
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
                    '62e90394-69f5-4237-9190-012177145e10',
                    'e8611ab8-c189-46e8-94e1-60213ab1f814',
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
                    '8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2',
                    '4ba39ca4-527c-499a-b93d-d9b492c50246',
                    'e00e864a-17c5-4a4b-9c06-f5b95a8d5bd8',
                    'd29b2b05-8046-44ba-8758-1e26182fcf32',
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
                    '8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2',
                    '4ba39ca4-527c-499a-b93d-d9b492c50246',
                    'e00e864a-17c5-4a4b-9c06-f5b95a8d5bd8',
                    'd29b2b05-8046-44ba-8758-1e26182fcf32',
                ],
            },
            log: (result) =>
                `Created ${
                    result.summary.counters.updates().relationshipsCreated
                } AZAddOwner Edges`,
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

        const createSyncLAPSPasswordStatement = "MATCH (n)-[:GetChangesInFilteredSet]->(m:Domain) WHERE (n)-[:GetChanges]->(m) AND NOT (n)-[:GetChangesAll]->(m) AND NOT n.objectid ENDS WITH '-S-1-5-9' MATCH (o:Computer {haslaps: true, domainsid: m.domainsid}) CREATE (n)-[:SyncLAPSPassword {isacl: true, isinherited: false}]->(o)"
        await session.run(createSyncLAPSPasswordStatement, null).catch((err) => {
            console.log(err);
        });

        const deleteGetChangesInFilteredSetStatement = "MATCH ()-[r:GetChangesInFilteredSet]->(:Domain) DELETE r"
        await session.run(deleteGetChangesInFilteredSetStatement, null).catch((err) => {
            console.log(err);
        });

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
