import { eachSeries, findSeries } from 'async';
import { remote } from 'electron';
import { createReadStream, createWriteStream, statSync, unlinkSync } from 'fs';
import { isZipSync, isZip } from 'is-zip-file';
import { join } from 'path';
import React, { Component } from 'react';
import { withAlert } from 'react-alert';
import { Else, If, Then } from 'react-if';
import sanitize from 'sanitize-filename';
import { chain } from 'stream-chain';
import { withParser } from 'stream-json/filters/Pick';
import { streamArray } from 'stream-json/streamers/StreamArray';
import unzipper from 'unzipper';
import * as OldIngestion from '../../js/oldingestion.js';
import * as NewIngestion from '../../js/newingestion.js';
import MenuButton from './MenuButton';
import ProgressBarMenuButton from './ProgressBarMenuButton';
const { dialog, app } = remote;

const acceptableJSONTypes = [
    'sessions',
    'ous',
    'groups',
    'gpomembers',
    'gpos',
    'computers',
    'users',
    'domains',
];

class MenuContainer extends Component {
    constructor() {
        super();

        this.state = {
            refreshHover: false,
            uploading: false,
            progress: 0,
            cancelled: false,
            fileQueue: [],
        };

        emitter.on('cancelUpload', this.cancelUpload.bind(this));
        emitter.on('filedrop', this.fileDrop.bind(this));
        emitter.on('importShim', this._importClick.bind(this));
    }

    inputUsed = () => {
        let fileNames = [];
        $.each(input[0].files, function (_, file) {
            fileNames.push({ path: file.path, name: file.name });
        });
        this.unzipFiles(fileNames);
    };

    filesDropped = (e) => {
        let fileNames = [];
        $.each(e.dataTransfer.files, function (_, file) {
            fileNames.push({ path: file.path, name: file.name });
        });
    };

    unzipFiles = async (files) => {
        let finalFiles = [];
        var tempPath = app.getPath('temp');
        for (let file of files) {
            let path = file.path;
            let name = file.name;
            let alert;

            if (isZipSync(path)) {
                alert = this.props.alert.info(`Unzipping file ${name}`);
                const zip = createReadStream(path).pipe(
                    unzipper.Parse({ forceStream: true })
                );

                for await (const entry of zip) {
                    let sanitizedPath = sanitize(entry.path);
                    let output = join(tempPath, sanitizedPath);

                    let success = await new Promise((resolve, reject) => {
                        let st = createWriteStream(output);
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
                            name: sanitized,
                            zip_name: name,
                            delete: true,
                            status: 0,
                            progress: 0,
                        });
                    }
                }
            } else {
                finalFiles.push({
                    path: path,
                    name: name,
                    delete: false,
                    status: 0,
                    progress: 0,
                });
            }
        }

        checkValidFiles;
    };

    async checkFileValid(filePath) {
        const pipeline = chain([
            fs.createReadStream(filePath),
            parser(),
            pick({ filter: 'meta' }),
            ignore({ filter: 'data' }),
            streamValues(),
            (data) => {
                const value = data.value;
                console.log(value);
            },
        ]);
    }

    fileDrop(e) {
        let fileNames = [];
        $.each(e.dataTransfer.files, function (_, file) {
            fileNames.push({ path: file.path, name: file.name });
        });

        this.unzipNecessary(fileNames).then((results) => {
            eachSeries(
                results,
                (file, callback) => {
                    var msg = 'Processing file {}'.format(file.name);
                    if (file.zip_name) {
                        msg += ' from {}'.format(file.zip_name);
                    }
                    this.alert = this.props.alert.info(msg, { timeout: 0 });
                    this.getFileMeta(file.path, callback);
                },
                () => {
                    setTimeout(() => {
                        this.setState({ uploading: false });
                    }, 3000);
                    this.addBaseProps();
                    $.each(results, function (_, file) {
                        if (file.delete) {
                            unlinkSync(file.path);
                        }
                    });
                    this.props.alert.info('Finished processing all files', {
                        timeout: 0,
                    });
                }
            );
        });
    }

    cancelUpload() {
        this.setState({ cancelled: true });
        setTimeout((_) => {
            this.setState({ uploading: false });
        }, 1000);
    }

    _refreshClick(event) {
        if (event.ctrlKey) {
            emitter.emit('graphReload');
        } else {
            emitter.emit('graphRefresh');
        }
    }

    _changeLayoutClick() {
        emitter.emit('changeLayout');
    }

    _exportClick() {
        emitter.emit('showExport');
    }

    _importClick() {
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
    }

    _settingsClick() {
        emitter.emit('openSettings');
    }

    _cancelUploadClick() {
        emitter.emit('showCancelUpload');
    }

    _uploadClick() {
        var input = jQuery(this.refs.fileInput);
        var fileNames = [];

        $.each(input[0].files, function (_, file) {
            fileNames.push({ path: file.path, name: file.name });
        });

        this.unzipNecessary(fileNames).then((results) => {
            eachSeries(
                results,
                (file, callback) => {
                    var msg = 'Processing file {}'.format(file.name);
                    if (file.zip_name) {
                        msg += ' from {}'.format(file.zip_name);
                    }
                    this.alert = this.props.alert.info(msg, { timeout: 0 });
                    this.getFileMeta(file.path, callback);
                },
                () => {
                    setTimeout(() => {
                        this.setState({ uploading: false });
                    }, 3000);
                    this.addBaseProps();
                    $.each(results, function (_, file) {
                        if (file.delete) {
                            unlinkSync(file.path);
                        }
                    });
                    this.props.alert.info('Finished processing all files', {
                        timeout: 0,
                    });
                }
            );

            input.val('');
        });
    }

    async addBaseProps() {
        let s = driver.session();
        await s.run(
            'MATCH (n:User) WHERE NOT EXISTS(n.owned) SET n.owned=false'
        );
        await s.run(
            'MATCH (n:Computer) WHERE NOT EXISTS(n.owned) SET n.owned=false'
        );

        await s.run(
            'MATCH (n:Group) WHERE n.objectid ENDS WITH "-513" MATCH (m:Group) WHERE m.domain=n.domain AND m.objectid ENDS WITH "S-1-1-0" MERGE (n)-[r:MemberOf]->(m)'
        );

        await s.run(
            'MATCH (n:Group) WHERE n.objectid ENDS WITH "-515" MATCH (m:Group) WHERE m.domain=n.domain AND m.objectid ENDS WITH "S-1-1-0" MERGE (n)-[r:MemberOf]->(m)'
        );

        await s.run(
            'MATCH (n:Group) WHERE n.objectid ENDS WITH "-513" MATCH (m:Group) WHERE m.domain=n.domain AND m.objectid ENDS WITH "S-1-5-11" MERGE (n)-[r:MemberOf]->(m)'
        );

        await s.run(
            'MATCH (n:Group) WHERE n.objectid ENDS WITH "-515" MATCH (m:Group) WHERE m.domain=n.domain AND m.objectid ENDS WITH "S-1-5-11" MERGE (n)-[r:MemberOf]->(m)'
        );
        s.close();
    }

    async unzipNecessary(files) {
        var index = 0;
        var processed = [];
        var tempPath = app.getPath('temp');
        let promises = [];
        while (index < files.length) {
            var path = files[index].path;
            var name = files[index].name;

            if (isZipSync(path)) {
                var alert = this.props.alert.info(
                    'Unzipping file {}'.format(name)
                );

                const zip = createReadStream(path).pipe(
                    Parse({ forceStream: true })
                );

                for await (const entry of zip) {
                    let sanitized = sanitize(entry.path);
                    let output = join(tempPath, sanitized);
                    entry.pipe(createWriteStream(output));

                    processed.push({
                        path: output,
                        name: sanitized,
                        zip_name: name,
                        delete: true,
                    });
                }
                alert.close();
            } else {
                processed.push({ path: path, name: name, delete: false });
            }
            index++;
        }
        await Promise.all(promises);
        return processed;
    }

    _aboutClick() {
        emitter.emit('showAbout');
    }

    getFileMeta(file, callback) {
        let acceptableTypes = [
            'sessions',
            'ous',
            'groups',
            'gpomembers',
            'gpos',
            'computers',
            'users',
            'domains',
        ];
        let count;

        this.setState({
            uploading: true,
            progress: 0,
        });

        let size = statSync(file).size;
        let start = size - 200;
        if (start <= 0) {
            start = 0;
        }
        createReadStream(file, {
            encoding: 'utf8',
            start: start,
            end: size,
        }).on('data', (chunk) => {
            let type, version, ftype;
            try {
                type = /type.?:\s?"(\w*)"/g.exec(chunk)[1];
                count = /count.?:\s?(\d*)/g.exec(chunk)[1];
            } catch (e) {
                type = null;
            }
            try {
                version = /version.?:\s?(\d*)/g.exec(chunk)[1];
            } catch (e) {
                version = null;
            }

            if (version == null) {
                this.props.alert.error(
                    'Version 2 data is not compatible with BloodHound v3.'
                );
                this.setState({ uploading: false });
                callback();
                return;
            }

            if (!acceptableTypes.includes(type)) {
                this.props.alert.error('Unrecognized File');
                this.setState({
                    uploading: false,
                });
                callback();
                return;
            }

            this.processJson(file, callback, parseInt(count), type, version);
        });
    }

    processJson(file, callback, count, type, version = null) {
        let pipeline = chain([
            createReadStream(file, { encoding: 'utf8' }),
            withParser({ filter: type }),
            streamArray(),
        ]);

        let localcount = 0;
        let sent = 0;
        let chunk = [];
        //Start a timer for fun

        this.setState({
            uploading: true,
            progress: 0,
        });

        console.log(`Processing ${file}`);
        console.time('IngestTime');
        pipeline
            .on(
                'data',
                async function (data) {
                    chunk.push(data.value);
                    localcount++;

                    if (localcount % 1000 === 0) {
                        pipeline.pause();
                        await this.uploadData(chunk, type, version);
                        sent += chunk.length;
                        this.setState({
                            progress: Math.floor((sent / count) * 100),
                        });
                        chunk = [];
                        pipeline.resume();
                    }
                }.bind(this)
            )
            .on(
                'end',
                async function () {
                    await this.uploadData(chunk, type, version);
                    this.setState({ progress: 100 });
                    emitter.emit('refreshDBData');
                    console.timeEnd('IngestTime');
                    if (this.alert) {
                        // close currently shown info alert
                        this.alert.close();
                    }
                    callback();
                }.bind(this)
            );
    }

    //DO NOT USE THIS FUNCTION FOR ANYTHING, ITS ONLY FOR TESTING
    sleep_test(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async uploadData(chunk, type, version) {
        let session = driver.session();
        let funcMap;
        if (version == null) {
            funcMap = {
                computers: OldIngestion.buildComputerJson,
                domains: OldIngestion.buildDomainJson,
                gpos: OldIngestion.buildGpoJson,
                users: OldIngestion.buildUserJson,
                groups: OldIngestion.buildGroupJson,
                ous: OldIngestion.buildOuJson,
                sessions: OldIngestion.buildSessionJson,
                gpomembers: OldIngestion.buildGpoAdminJson,
            };
        } else {
            funcMap = {
                computers: NewIngestion.buildComputerJsonNew,
                groups: NewIngestion.buildGroupJsonNew,
                users: NewIngestion.buildUserJsonNew,
                domains: NewIngestion.buildDomainJsonNew,
                ous: NewIngestion.buildOuJsonNew,
                gpos: NewIngestion.buildGpoJsonNew,
            };
        }

        let data = funcMap[type](chunk);
        for (let key in data) {
            if (data[key].props.length === 0) {
                continue;
            }
            let arr = data[key].props.chunk();
            let statement = data[key].statement;
            for (let i = 0; i < arr.length; i++) {
                await session
                    .run(statement, { props: arr[i] })
                    .catch(function (error) {
                        console.log(statement);
                        console.log(data[key].props);
                        console.log(error);
                    });
            }
        }

        session.close();
    }

    render() {
        return (
            <div className='menudiv'>
                <div>
                    <MenuButton
                        click={this._refreshClick.bind(this)}
                        hoverVal='Refresh'
                        glyphicon='fas fa-sync-alt'
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._exportClick.bind(this)}
                        hoverVal='Export Graph'
                        glyphicon='fa fa-upload'
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._importClick.bind(this)}
                        hoverVal='Import Graph'
                        glyphicon='fa fa-download'
                    />
                </div>
                <div>
                    <If condition={this.state.uploading}>
                        <Then>
                            <ProgressBarMenuButton
                                click={this._cancelUploadClick.bind(this)}
                                progress={this.state.progress}
                                committed={this.state.committed}
                            />
                        </Then>
                        <Else>
                            {() => (
                                <MenuButton
                                    click={function () {
                                        jQuery(this.refs.fileInput).click();
                                    }.bind(this)}
                                    hoverVal='Upload Data'
                                    glyphicon='glyphicon glyphicon-upload'
                                />
                            )}
                        </Else>
                    </If>
                </div>
                <div>
                    <MenuButton
                        click={this._changeLayoutClick.bind(this)}
                        hoverVal='Change Layout Type'
                        glyphicon='fa fa-chart-line'
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._settingsClick.bind(this)}
                        hoverVal='Settings'
                        glyphicon='fa fa-cogs'
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._aboutClick.bind(this)}
                        hoverVal='About'
                        glyphicon='fa fa-info'
                    />
                </div>
                <input
                    ref='fileInput'
                    multiple
                    className='hide'
                    type='file'
                    onChange={this._uploadClick.bind(this)}
                />
            </div>
        );
    }
}

export default withAlert()(MenuContainer);
