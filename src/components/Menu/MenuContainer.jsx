import React, { Component } from "react";
import MenuButton from "./MenuButton";
import ProgressBarMenuButton from "./ProgressBarMenuButton";
import {
    buildGpoAdminJson,
    buildSessionJson,
    buildUserJson,
    buildComputerJson,
    buildDomainJson,
    buildGpoJson,
    buildGroupJson,
    buildOuJson
} from "utils";
import { If, Then, Else } from "react-if";
import { remote } from "electron";
const { dialog, app } = remote;
import { unlinkSync, createReadStream, createWriteStream } from "fs";
import { eachSeries } from "async";
import { Parse } from "unzipper";
import { join } from "path";

import { withParser } from "stream-json/filters/Pick";
import { streamArray } from "stream-json/streamers/StreamArray";
import { chain } from "stream-chain";
import { connectTo } from "stream-json/Assembler";
var iszip = require('is-zip-file');

export default class MenuContainer extends Component {
    constructor() {
        super();

        this.state = {
            refreshHover: false,
            uploading: false,
            progress: 0,
            cancelled: false
        };

        emitter.on("cancelUpload", this.cancelUpload.bind(this));
        emitter.on("filedrop", this.fileDrop.bind(this))
        emitter.on("importShim", this._importClick.bind(this))
    }

    fileDrop(e){
        let fileNames = []
        $.each(e.dataTransfer.files, function(_, file){
            fileNames.push({ path: file.path, name: file.name });
        })

        this.unzipNecessary(fileNames).then(
            function(results) {
                eachSeries(
                    results,
                    function(file, callback) {
                        emitter.emit(
                            "showAlert",
                            "Processing file {}".format(file.name)
                        );
                        this.getFileMeta(file.path, callback);
                    }.bind(this),
                    function done() {
                        setTimeout(
                            function() {
                                this.setState({ uploading: false });
                            }.bind(this),
                            3000
                        );
                        this.addOwnedProp();
                        $.each(results, function(_, file) {
                            if (file.delete) {
                                unlinkSync(file.path);
                            }
                        });
                    }.bind(this)
                );
            }.bind(this)
        );
    }

    cancelUpload() {
        this.setState({ cancelled: true });
        setTimeout(
            _ => {
                this.setState({ uploading: false });
            },
            1000
        );
    }

    _refreshClick(event) {
        if (event.ctrlKey){
            emitter.emit("graphReload");
        }else{
            emitter.emit("graphRefresh");
        }
        
    }

    _changeLayoutClick() {
        emitter.emit("changeLayout");
    }

    _exportClick() {
        emitter.emit("showExport");
    }

    _importClick() {
        if (appStore.currentTooltip !== null){
            appStore.currentTooltip.close();
        }
        var fname = dialog.showOpenDialog({
            properties: ["openFile"]
        });
        if (typeof fname !== "undefined") {
            emitter.emit("import", fname[0]);
        }
    }

    _settingsClick() {
        emitter.emit("openSettings");
    }

    _cancelUploadClick() {
        emitter.emit("showCancelUpload");
    }

    _uploadClick() {
        var input = jQuery(this.refs.fileInput);
        var fileNames = [];

        $.each(input[0].files, function(_, file) {
            fileNames.push({ path: file.path, name: file.name });
        });

        this.unzipNecessary(fileNames).then(
            results => {
                eachSeries(
                    results,
                    (file, callback) => {
                        emitter.emit(
                            "showAlert",
                            "Processing file {}".format(file.name)
                        );
                        this.getFileMeta(file.path, callback);
                    },
                    function done() {
                        setTimeout(
                            _ => {
                                this.setState({ uploading: false });
                            },
                            3000
                        );
                        this.addOwnedProp();
                        $.each(results, (_, file) => {
                            if (file.delete) {
                                unlinkSync(file.path);
                            }
                        });
                    }
                );

                input.val("");
            }
        );
    }

    async addOwnedProp(){
        let s = driver.session();
        await s.run("MATCH (n:User) WHERE NOT EXISTS(n.owned) SET n.owned=false");
        await s.run("MATCH (n:Computer) WHERE NOT EXISTS(n.owned) SET n.owned=false");
        s.close();
    }

    async unzipNecessary(files) {
        var index = 0;
        var processed = [];
        var tempPath = app.getPath("temp");
        while (index < files.length) {
            var path = files[index].path;
            var name = files[index].name;

            if (iszip.isZipSync(path)) {
                await createReadStream(path)
                    .pipe(Parse())
                    .on("entry", function(entry) {
                        var output = join(tempPath, entry.path);
                        entry.pipe(createWriteStream(output));
                        processed.push({
                            path: output,
                            name: entry.path,
                            delete: true
                        });
                    })
                    .promise();
            } else {
                processed.push({ path: path, name: name, delete: false });
            }
            index++;
        }

        return processed;
    }

    _aboutClick() {
        emitter.emit("showAbout");
    }

    getFileMeta(file, callback) {
        let acceptableTypes = [
            "sessions",
            "ous",
            "groups",
            "gpoadmins",
            "gpos",
            "computers",
            "users",
            "domains"
        ];
        let count;
        let type;

        console.log(file);
        this.setState({
            uploading: true,
            progress: 0
        });

        let pipeline = chain([
            createReadStream(file, { encoding: "utf8" }),
            withParser({ filter: "meta" })
        ]);

        let asm = connectTo(pipeline);
        asm.on(
            "done",
            function(asm) {
                let data = asm.current;
                count = data.count;
                type = data.type;

                if (!acceptableTypes.includes(type)) {
                    emitter.emit("showAlert", "Unrecognized JSON Type");
                    this.setState({
                        uploading: false
                    });
                    callback();
                }

                this.processJson(file, callback, count, type);
            }.bind(this)
        );
    }

    processJson(file, callback, count, type) {
        let pipeline = chain([
            createReadStream(file, { encoding: "utf8" }),
            withParser({ filter: type }),
            streamArray()
        ]);

        let localcount = 0;
        let sent = 0;
        let chunk = [];
        //Start a timer for fun

        this.setState({
            uploading: true,
            progress: 0
        });

        console.time("IngestTime");

        pipeline
            .on(
                "data",
                async function(data) {
                    chunk.push(data.value);
                    localcount++;

                    if (localcount % 100 === 0) {
                        pipeline.pause();
                        await this.uploadData(chunk, type);
                        sent += chunk.length;
                        this.setState({
                            progress: Math.floor((sent / count) * 100)
                        });
                        chunk = [];
                        pipeline.resume();
                    }
                }.bind(this)
            )
            .on(
                "end",
                async function() {
                    await this.uploadData(chunk, type);
                    this.setState({ progress: 100 });
                    emitter.emit("refreshDBData");
                    console.timeEnd("IngestTime");
                    callback();
                }.bind(this)
            );
    }

    //DO NOT USE THIS FUNCTION FOR ANYTHING, ITS ONLY FOR TESTING
    sleep_test(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async uploadData(chunk, type) {
        let session = driver.session();
        let funcMap = {
            computers: buildComputerJson,
            domains: buildDomainJson,
            gpos: buildGpoJson,
            users: buildUserJson,
            groups: buildGroupJson,
            ous: buildOuJson,
            sessions: buildSessionJson,
            gpoadmins: buildGpoAdminJson
        };
        let data = funcMap[type](chunk);

        for (let key in data) {
            await session
                .run(data[key].statement, { props: data[key].props })
                .catch(function(error) {
                    console.log(error);
                });
        }

        session.close();
    }

    render() {
        return (
            <div className="menudiv">
                <div>
                    <MenuButton
                        click={this._refreshClick.bind(this)}
                        hoverVal="Refresh"
                        glyphicon="fa fa-refresh"
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._exportClick.bind(this)}
                        hoverVal="Export Graph"
                        glyphicon="fa fa-download"
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._importClick.bind(this)}
                        hoverVal="Import Graph"
                        glyphicon="fa fa-upload"
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
                                    click={function() {
                                        jQuery(this.refs.fileInput).click();
                                    }.bind(this)}
                                    hoverVal="Upload Data"
                                    glyphicon="glyphicon glyphicon-upload"
                                />
                            )}
                        </Else>
                    </If>
                </div>
                <div>
                    <MenuButton
                        click={this._changeLayoutClick.bind(this)}
                        hoverVal="Change Layout Type"
                        glyphicon="fa fa-line-chart"
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._settingsClick.bind(this)}
                        hoverVal="Settings"
                        glyphicon="fa fa-cogs"
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._aboutClick.bind(this)}
                        hoverVal="About"
                        glyphicon="fa fa-info"
                    />
                </div>
                <input
                    ref="fileInput"
                    multiple
                    className="hide"
                    type="file"
                    onChange={this._uploadClick.bind(this)}
                />
            </div>
        );
    }
}
