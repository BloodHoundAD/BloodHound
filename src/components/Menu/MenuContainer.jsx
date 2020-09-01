import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
const { dialog, app } = remote;
import { useAlert } from 'react-alert';
import MenuButton from './MenuButton';
import { isZipSync } from 'is-zip-file';
import sanitize from 'sanitize-filename';
import { pick } from 'stream-json/filters/Pick';
import { ignore } from 'stream-json/filters/Ignore';
import { chain } from 'stream-chain';
import fs from 'fs';
import path from 'path';
import { parser } from 'stream-json';
import { streamValues } from 'stream-json/streamers/StreamValues';
import unzipper from 'unzipper';
import * as NewIngestion from '../../js/newingestion';
import UploadStatusContainer from '../Float/UploadStatusContainer';
import clsx from 'clsx';

const FileStatus = Object.freeze({
    ParseError: 0,
    InvalidVersion: 1,
    BadType: 2,
    Waiting: 3,
    Processing: 4,
    Done: 5,
});

const AllowedTypes = [
    'sessions',
    'ous',
    'groups',
    'gpomembers',
    'gpos',
    'computers',
    'users',
    'domains',
    'azusers',
    'azgroups',
    'aztenants',
    'azsubscriptions',
    'azresourcegroups',
    'azvms',
    'azkeyvaults',
    'azdevices',
    'azgroupowners',
    'azgroupmembers',
    'azvmpermissions',
    'azrgpermissions',
    'azkvpermissions',
    'azkvaccesspolicies',
    'azpwresetrights',
    'azgroupsrights',
    'azglobaladminrights',
    'azprivroleadminrights',
];

const IngestFuncMap = {
    computers: NewIngestion.buildComputerJsonNew,
    groups: NewIngestion.buildGroupJsonNew,
    users: NewIngestion.buildUserJsonNew,
    domains: NewIngestion.buildDomainJsonNew,
    ous: NewIngestion.buildOuJsonNew,
    gpos: NewIngestion.buildGpoJsonNew,
    azdevices: NewIngestion.buildAzureDevices,
    azusers: NewIngestion.buildAzureUsers,
    azgroups: NewIngestion.buildAzureGroups,
    aztenants: NewIngestion.buildAzureTenants,
    azsubscriptions: NewIngestion.buildAzureSubscriptions,
    azresourcegroups: NewIngestion.buildAzureResourceGroups,
    azvms: NewIngestion.buildAzureVMs,
    azkeyvaults: NewIngestion.buildAzureKeyVaults,
    azgroupowners: NewIngestion.buildAzureGroupOwners,
    azgroupmembers: NewIngestion.buildAzureGroupMembers,
    azvmpermissions: NewIngestion.buildAzureVmPerms,
    azrgpermissions: NewIngestion.buildAzureRGPermissions,
    azkvpermissions: NewIngestion.buildAzureKVPermissions,
    azkvaccesspolicies: NewIngestion.buildAzureKVAccessPolicies,
    azpwresetrights: NewIngestion.buildAzurePWResetRights,
    azgroupsrights: NewIngestion.buildAzureGroupRights,
    azglobaladminrights: NewIngestion.buildAzureGlobalAdminRights,
    azprivroleadminrights: NewIngestion.buildAzurePrivRileAdminRights,
};

const MenuContainer = () => {
    const [fileQueue, setFileQueue] = useState({});
    const alert = useAlert();
    const input = useRef(null);
    const [uploading, setUploading] = useState(false);
    const fileId = useRef(0);
    const [uploadVisible, setUploadVisible] = useState(false);

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
        var tempPath = app.getPath('temp');
        for (let file of files) {
            let fPath = file.path;
            let name = file.name;

            if (isZipSync(fPath)) {
                alert.info(`Unzipping file ${name}`);
                const zip = fs
                    .createReadStream(fPath)
                    .pipe(unzipper.Parse({ forceStream: true }));

                for await (const entry of zip) {
                    let sanitizedPath = sanitize(entry.path);
                    let output = path.join(tempPath, sanitizedPath);

                    let success = await new Promise((resolve, reject) => {
                        let st = fs.createWriteStream(output);
                        st.on('error', (err) => {
                            console.error(err);
                            resolve(false);
                        });

                        st.on('finish', () => {
                            resolve(true);
                        });

                        entry.pipe(st);
                    });

                    if (success) {
                        finalFiles.push({
                            path: output,
                            name: sanitizedPath,
                            zip_name: name,
                            delete: true,
                            id: fileId.current,
                        });
                        fileId.current += 1;
                    }
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

        checkFileValidity(finalFiles);
    };

    const checkFileValidity = async (files) => {
        let filteredFiles = {};
        for (let file of files) {
            const pipeline = chain([
                fs.createReadStream(file.path, { encoding: 'utf8' }),
                parser(),
                pick({ filter: 'meta' }),
                ignore({ filter: 'data' }),
                streamValues(),
                (data) => {
                    const value = data.value;
                    return value;
                },
            ]);

            let meta;
            try {
                for await (let data of pipeline) {
                    meta = data;
                }
            } catch (e) {
                console.log(e);
                filteredFiles[file.id] = {
                    ...file,
                    status: FileStatus.ParseError,
                };
                continue;
            }

            if (!('version' in meta) || meta.version < 3) {
                filteredFiles[file.id] = {
                    ...file,
                    status: FileStatus.InvalidVersion,
                };
                continue;
            }

            if (!AllowedTypes.includes(meta.type)) {
                filteredFiles[file.id] = {
                    ...file,
                    status: FileStatus.BadType,
                };
                continue;
            }
            filteredFiles[file.id] = {
                ...file,
                status: FileStatus.Waiting,
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
        console.log(`Processing ${file.name}`);
        console.time('IngestTime');
        const pipeline = chain([
            fs.createReadStream(file.path, { encoding: 'utf8' }),
            parser(),
            pick({ filter: 'data' }),
            ignore({ filter: 'meta' }),
            streamValues(),
            (data) => {
                const value = data.value;
                return value;
            },
        ]);

        let count = 0;
        let chunk = [];
        let processor = IngestFuncMap[file.type];
        try {
            for await (let data of pipeline) {
                chunk.push(data);
                count++;

                if (count % 5 === 0) {
                    pipeline.pause();
                    let data = processor(chunk);
                    for (let key in data) {
                        if (data[key].props.length === 0) continue;
                        let cData = data[key].props.chunk();
                        let statement = data[key].statement;

                        for (let c of cData) {
                            await uploadData(statement, c);
                            //await sleep_test(100);
                        }
                    }
                    file.progress = count;
                    setFileQueue((state) => {
                        return { ...state, [file.id]: file };
                    });
                    chunk = [];
                    pipeline.resume();
                }
            }

            let data = processor(chunk);
            for (let key in data) {
                if (data[key].props.length === 0) continue;
                let cData = data[key].props.chunk();
                let statement = data[key].statement;

                for (let c of cData) {
                    await uploadData(statement, c);
                }
            }
            file.progress = count;
            file.status = FileStatus.Done;
            setUploading(false);
            setFileQueue((state) => {
                return { ...state, [file.id]: file };
            });

            console.timeEnd('IngestTime');
            emitter.emit('refreshDBData');
        } catch (e) {
            console.log(e);
        }
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
        session.close();
    };

    const clearFinished = () => {
        let temp = { ...fileQueue };
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
                if (file.status == FileStatus.Waiting) {
                    f = file;
                    break;
                }
            }
            if (f !== undefined) {
                setUploading(true);
                processJson(f);
            }
        }
    }, [fileQueue]);

    const cancelUpload = () => {};

    const aboutClick = (e) => {
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
