import React, { useEffect, useState, useRef } from 'react';
import { remote } from 'electron';

const { dialog, app } = remote;
import { useAlert } from 'react-alert';
import MenuButton from './MenuButton';
import { isZipSync } from 'is-zip-file';
import sanitize from 'sanitize-filename';
import { pick } from 'stream-json/filters/Pick';
import { chain } from 'stream-chain';
import fs from 'fs';
import path from 'path';
import { parser } from 'stream-json';

const { batch } = require('stream-json/utils/Batch');
import AdmZip from 'adm-zip';
import * as NewIngestion from '../../js/newingestion';
import UploadStatusContainer from '../Float/UploadStatusContainer';
import { streamArray } from 'stream-json/streamers/StreamArray';

const FileStatus = Object.freeze({
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
    const [fileQueue, setFileQueue] = useState({});
    const alert = useAlert();
    const input = useRef(null);
    const [uploading, setUploading] = useState(false);
    const fileId = useRef(0);
    const [uploadVisible, setUploadVisible] = useState(false);
    const [needsPostProcess, setNeedsPostProcess] = useState(false);

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
                    type = /"type.?:\s?"(\w*)"/g.exec(chunk)[1];
                    count = parseInt(/"count.?:\s?(\d*)/g.exec(chunk)[1]);
                } catch (e) {
                    type = null;
                    count = null;
                }
                try {
                    version = parseInt(/"version.?:\s?(\d*)/g.exec(chunk)[1]);
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
                    for (let item of processedData.AzurePropertyMaps) {
                        let props = item.Props;
                        if (props.length === 0) continue;
                        let chunked = props.chunk();
                        let statement = item.Statement;

                        for (let chunk of chunked) {
                            await uploadData(statement, chunk);
                        }
                    }

                    for (let item of processedData.OnPremPropertyMaps) {
                        let props = item.Props;
                        if (props.length === 0) continue;
                        let chunked = props.chunk();
                        let statement = item.Statement;

                        for (let chunk of chunked) {
                            await uploadData(statement, chunk);
                        }
                    }

                    for (let item of processedData.RelPropertyMaps) {
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
            if (
                temp[key].status !== FileStatus.Processing &&
                temp[key].status !== FileStatus.Waiting
            ) {
                delete temp[key];
            }
        }

        setFileQueue(temp);
    };

    const closeUpload = () => {
        setUploadVisible(false);
    };

    useEffect(() => {
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
                processJson(f);
            }

            if (f === undefined && needsPostProcess) {
                for (let file of Object.values(fileQueue)) {
                    if (!fileIsComplete(file.status)) {
                        return;
                    }
                }

                postProcessUpload().then((_) => {
                    postProcessAzure().then((_) => {
                        console.log('post-processing complete');
                        setNeedsPostProcess(false);
                    });
                });
            }
        }
    }, [fileQueue]);

    const postProcessUpload = async () => {
        console.log('Running post processing queries');
        let session = driver.session();

        const baseOwnedStatement =
            'MATCH (n) WHERE n:User or n:Computer AND NOT EXISTS(n.owned) SET n.owned = false';
        await session.run(baseOwnedStatement, null).catch((err) => {
            console.log(err);
        });

        const baseHighValueStatement =
            'MATCH (n:Base) WHERE NOT EXISTS(n.highvalue) SET n.highvalue = false';
        await session.run(baseHighValueStatement, null).catch((err) => {
            console.log(err);
        });

        const dUsersSids = ['S-1-1-0', 'S-1-5-11'];
        const domainUsersAssociationStatement =
            "MATCH (n:Group) WHERE n.objectid ENDS WITH '-513' OR n.objectid ENDS WITH '-515' WITH n UNWIND $sids AS sid MATCH (m:Group) WHERE m.objectid ENDS WITH sid MERGE (n)-[:MemberOf]->(m)";
        await session
            .run(domainUsersAssociationStatement, { sids: dUsersSids })
            .catch((err) => {
                console.log(err);
            });

        await session.close();
    };

    const postProcessAzure = async () => {
        console.log('Running azure post-processing queries');
        let session = driver.session();

        await session.run('WITH ["c4e39bd9-1100-46d3-8c65-fb160da0071f","62e90394-69f5-4237-9190-012177145e10","729827e3-9c14-49f7-bb1b-9608f156bbb8","966707d0-3269-4727-9be2-8c3a10f19b9d","7be44c8a-adaf-4e2a-84d6-ab2649e08a13","fe930be7-5e62-47db-91af-98c3a49a38b1","9980e02c-c2be-4d73-94e8-173b1dc7cf3c"] AS pwResetRoles\n' +
            'MATCH (n:AZUser)-[:AZHasRole]->(m)\n' +
            'WHERE m.templateid IN pwResetRoles\n' +
            'WITH n\n' +
            'MATCH (at:AZTenant)-[:AZContains]->(n)\n' +
            'WITH at,n\n' +
            'MATCH (at)-[:AZContains]->(u:AZUser)\n' +
            'WHERE NOT (u)-[:AZHasRole]->()\n' +
            'MERGE (n)-[:AZResetPassword]->(u)\n', null).catch((err) => {
                console.log(err)
        })

        await session.run('WITH ["62e90394-69f5-4237-9190-012177145e10","7be44c8a-adaf-4e2a-84d6-ab2649e08a13"] AS GAandPAA\n' +
            'MATCH (n:AZUser)-[:AZHasRole]->(m)\n' +
            'WHERE m.templateid IN GAandPAA\n' +
            'WITH n\n' +
            'MATCH (at:AZTenant)-[:AZContains]->(n)\n' +
            'WITH at,n\n' +
            'MATCH (at)-[:AZContains]->(u:AZUser)\n' +
            'MERGE (n)-[:AZResetPassword]->(u)\n', null).catch((err) => {
                console.log(err)
        })

        await session.run('MATCH (at:AZTenant)-[:AZContains]->(AuthAdmin:AZUser)-[:AZHasRole]->(AuthAdminRole:AZRole {roleTemplateId:"c4e39bd9-1100-46d3-8c65-fb160da0071f"})\n' +
            'WITH [\'c4e39bd9-1100-46d3-8c65-fb160da0071f\',\'88d8e3e3-8f55-4a1e-953a-9b9898b8876b\',\'95e79109-95c0-4d8e-aee3-d01accf2d47b\',\'729827e3-9c14-49f7-bb1b-9608f156bbb8\',\'790c1fb9-7f7d-4f88-86a1-ef1f95c05c1b\',\'4a5d8f65-41da-4de4-8968-e035b65339cf\',\'966707d0-3269-4727-9be2-8c3a10f19b9d\'] AS AuthAdminTargetRoles,AuthAdmin,at\n' +
            'MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)\n' +
            'WHERE NOT ar.templateid IN AuthAdminTargetRoles\n' +
            'WITH COLLECT(NonTargets) AS NonTargets,at,AuthAdmin,AuthAdminTargetRoles\n' +
            'MATCH (at)-[:AZContains]->(AuthAdminTargets:AZUser)-[:AZHasRole]->(arTargets)\n' +
            'WHERE NOT AuthAdminTargets IN NonTargets AND arTargets.templateid IN AuthAdminTargetRoles\n' +
            'MERGE (AuthAdmin)-[:AZResetPassword]->(AuthAdminTargets)\n', null).catch((err) => {
                console.log(err)
        })

        await session.run('MATCH (at:AZTenant)-[:AZContains]->(HelpdeskAdmin:AZUser)-[:AZHasRole]->(HelpdeskAdminRole:AZRole {roleTemplateId:"c4e39bd9-1100-46d3-8c65-fb160da0071f"})\n' +
            'WITH [\'c4e39bd9-1100-46d3-8c65-fb160da0071f\',\'88d8e3e3-8f55-4a1e-953a-9b9898b8876b\',\'95e79109-95c0-4d8e-aee3-d01accf2d47b\',\'729827e3-9c14-49f7-bb1b-9608f156bbb8\',\'790c1fb9-7f7d-4f88-86a1-ef1f95c05c1b\',\'4a5d8f65-41da-4de4-8968-e035b65339cf\',\'966707d0-3269-4727-9be2-8c3a10f19b9d\'] AS HelpdeskAdminTargetRoles,HelpdeskAdmin,at\n' +
            'MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)\n' +
            'WHERE NOT ar.templateid IN HelpdeskAdminTargetRoles\n' +
            'WITH COLLECT(NonTargets) AS NonTargets,at,HelpdeskAdmin,HelpdeskAdminTargetRoles\n' +
            'MATCH (at)-[:AZContains]->(HelpdeskAdminTargets:AZUser)-[:AZHasRole]->(arTargets)\n' +
            'WHERE NOT HelpdeskAdminTargets IN NonTargets AND arTargets.templateid IN HelpdeskAdminTargetRoles\n' +
            'MERGE (HelpdeskAdmin)-[:AZResetPassword]->(HelpdeskAdminTargets)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('MATCH (at:AZTenant)-[:AZContains]->(PasswordAdmin:AZUser)-[:AZHasRole]->(PasswordAdminRole:AZRole {roleTemplateId:"966707d0-3269-4727-9be2-8c3a10f19b9d"})\n' +
            'WITH [\'88d8e3e3-8f55-4a1e-953a-9b9898b8876b\',\'95e79109-95c0-4d8e-aee3-d01accf2d47b\',\'966707d0-3269-4727-9be2-8c3a10f19b9d\'] AS PasswordAdminTargetRoles,PasswordAdmin,at\n' +
            'MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)\n' +
            'WHERE NOT ar.templateid IN PasswordAdminTargetRoles\n' +
            'WITH COLLECT(NonTargets) AS NonTargets,at,PasswordAdmin,PasswordAdminTargetRoles\n' +
            'MATCH (at)-[:AZContains]->(PasswordAdminTargets:AZUser)-[:AZHasRole]->(arTargets)\n' +
            'WHERE NOT PasswordAdminTargets IN NonTargets AND arTargets.templateid IN PasswordAdminTargetRoles\n' +
            'MERGE (PasswordAdmin)-[:AZResetPassword]->(PasswordAdminTargets)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('MATCH (at:AZTenant)-[:AZContains]->(UserAccountAdmin:AZUser)-[:AZHasRole]->(UserAccountAdminRole:AZRole {roleTemplateId:"fe930be7-5e62-47db-91af-98c3a49a38b1"})\n' +
            'WITH [\'88d8e3e3-8f55-4a1e-953a-9b9898b8876b\',\'95e79109-95c0-4d8e-aee3-d01accf2d47b\',\'729827e3-9c14-49f7-bb1b-9608f156bbb8\',\'790c1fb9-7f7d-4f88-86a1-ef1f95c05c1b\',\'4a5d8f65-41da-4de4-8968-e035b65339cf\',\'fe930be7-5e62-47db-91af-98c3a49a38b1\'] AS UserAccountAdminTargetRoles,UserAccountAdmin,at\n' +
            'MATCH (NonTargets:AZUser)-[:AZHasRole]->(ar:AZRole)\n' +
            'WHERE NOT ar.templateid IN UserAccountAdminTargetRoles\n' +
            'WITH COLLECT(NonTargets) AS NonTargets,at,UserAccountAdmin,UserAccountAdminTargetRoles\n' +
            'MATCH (at)-[:AZContains]->(UserAccountAdminTargets:AZUser)-[:AZHasRole]->(arTargets)\n' +
            'WHERE NOT UserAccountAdminTargets IN NonTargets AND arTargets.templateid IN UserAccountAdminTargetRoles\n' +
            'MERGE (UserAccountAdmin)-[:AZResetUserAccount]->(UserAccountAdminTargets)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('MATCH (at:AZTenant)\n' +
            'MATCH (at)-[:AZContains]->(AppAdmin)-[:AZHasRole]->(AppAdminRole {roleTemplateId:\'9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3\'})-[:AZScopedTo]->(at)\n' +
            'MATCH (at)-[:AZContains]->(app:AZApp)\n' +
            'MERGE (AppAdmin)-[:AZAddSecret]->(app)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('MATCH (at:AZTenant)\n' +
            'MATCH (at)-[:AZContains]->(AppAdmin)-[:AZHasRole]->(AppAdminRole {roleTemplateId:\'158c047a-c907-4556-b7ef-446551a6b5f7\'})-[:AZScopedTo]->(at)\n' +
            'MATCH (at)-[:AZContains]->(app:AZApp)\n' +
            'MERGE (AppAdmin)-[:AZAddSecret]->(app)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('MATCH (at:AZTenant)\n' +
            'MATCH (at)-[:AZContains]->(AppAdmin)-[:AZHasRole]->(AppAdminRole {roleTemplateId:\'9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3\'})-[:AZScopedTo]->(app)\n' +
            'MERGE (AppAdmin)-[:AZAddSecret]->(app)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('MATCH (at:AZTenant)\n' +
            'MATCH (at)-[:AZContains]->(AppAdmin)-[:AZHasRole]->(AppAdminRole {roleTemplateId:\'158c047a-c907-4556-b7ef-446551a6b5f7\'})-[:AZScopedTo]->(app)\n' +
            'MERGE (AppAdmin)-[:AZAddSecret]->(app)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('MATCH (AppOwner)-[:AZOwns]->(app:AZApp)\n' +
            'MERGE (AppOwner)-[:AZAddSecret]-(app)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('MATCH (azt:AZTenant)\n' +
            'MATCH (azt)-[:AZContains]->(InTuneAdmin)-[:AZHasRole]->(azr:AZRole {roleTemplateId:\'3a2c62db-5318-420d-8d74-23affee5d9d5\'})\n' +
            'MATCH (azt)-[:AZContains]->(azd:AZDevice)\n' +
            'WHERE toUpper(azd.operatingsystem) CONTAINS "WINDOWS"\n' +
            'MERGE (InTuneAdmin)-[:AZExecuteCommand]->(azd)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('WITH ["fdd7a751-b60b-444a-984c-02652fe8fa1c”, “62e90394-69f5-4237-9190-012177145e10”, “e8611ab8-c189-46e8-94e1-60213ab1f814”, “9360feb5-f418-4baa-8175-e2a00bac4301”, “45d8d3c5-c802-45c6-b32a-1d70b5e1e86e”, “fe930be7-5e62-47db-91af-98c3a49a38b1”, “3a2c62db-5318-420d-8d74-23affee5d9d5”, “b5a8dcf3-09d5-43a9-a639-8e29ef291470”, “744ec460-397e-42ad-a462-8b3f9747a02c"] AS addGroupMembersRoles\n' +
            'MATCH (n)-[:AZHasRole]->(m)\n' +
            'WHERE m.templateid IN pwResetRoles\n' +
            'WITH n\n' +
            'MATCH (at:AZTenant)-[:AZContains]->(n)\n' +
            'WITH at,n\n' +
            'MATCH (at)-[:AZContains]->(azg:AZGroup {isAssignableToRole: false})\n' +
            'MERGE (n)-[:AZAddMembers]->(azg)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('WITH [“62e90394-69f5-4237-9190-012177145e10”, “e8611ab8-c189-46e8-94e1-60213ab1f814”] AS addGroupMembersRoles\n' +
            'MATCH (n)-[:AZHasRole]->(m)\n' +
            'WHERE m.templateid IN pwResetRoles\n' +
            'WITH n\n' +
            'MATCH (at:AZTenant)-[:AZContains]->(n)\n' +
            'WITH at,n\n' +
            'MATCH (at)-[:AZContains]->(azg:AZGroup {isAssignableToRole: true})\n' +
            'MERGE (n)-[:AZAddMembers]->(azg)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('WITH ["8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2","4ba39ca4-527c-499a-b93d-d9b492c50246","e00e864a-17c5-4a4b-9c06-f5b95a8d5bd8","d29b2b05-8046-44ba-8758-1e26182fcf32"] AS addOwnerRoles\n' +
            'MATCH (n)-[:AZHasRole]->(m)\n' +
            'WHERE m.templateid IN pwResetRoles\n' +
            'WITH n\n' +
            'MATCH (at:AZTenant)-[:AZContains]->(n)\n' +
            'WITH at,n\n' +
            'MATCH (at)-[:AZContains]->(aza:AZApp)\n' +
            'MERGE (n)-[:AZAddOwner]->(aza)\n', null).catch(err => {
                console.log(err)
        })

        await session.run('WITH ["8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2","4ba39ca4-527c-499a-b93d-d9b492c50246","e00e864a-17c5-4a4b-9c06-f5b95a8d5bd8","d29b2b05-8046-44ba-8758-1e26182fcf32"] AS addOwnerRoles\n' +
            'MATCH (n)-[:AZHasRole]->(m)\n' +
            'WHERE m.templateid IN pwResetRoles\n' +
            'WITH n\n' +
            'MATCH (at:AZTenant)-[:AZContains]->(n)\n' +
            'WITH at,n\n' +
            'MATCH (at)-[:AZContains]->(azsp:AZServicePrincipal)\n' +
            'MERGE (n)-[:AZAddOwner]->(aza)\n', null).catch(err => {
                console.log(err)
        })
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
            />
        </div>
    );
};

MenuContainer.propTypes = {};
export default MenuContainer;
