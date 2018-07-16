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
const { dialog, app } = require("electron").remote;
var fs = require("fs");
var async = require("async");
var unzip = require("unzipper");
var fpath = require("path");

const Pick = require("stream-json/filters/Pick");
const { streamArray } = require("stream-json/streamers/StreamArray");
const { chain } = require("stream-chain");
const Asm = require("stream-json/Assembler");

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
    }

    cancelUpload() {
        this.setState({ cancelled: true });
        setTimeout(
            function() {
                this.setState({ uploading: false });
            }.bind(this),
            1000
        );
    }

    _refreshClick() {
        emitter.emit("graphRefresh");
    }

    _changeLayoutClick() {
        appStore.dagre = !appStore.dagre;
        emitter.emit("graphRefresh");
        var type = appStore.dagre ? "Hierarchical" : "Directed";
        emitter.emit("showAlert", "Changed Layout to " + type);
    }

    _exportClick() {
        emitter.emit("showExport");
    }

    _importClick() {
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

        $.each(input[0].files, function(index, file) {
            fileNames.push({ path: file.path, name: file.name });
        });

        this.unzipNecessary(fileNames).then(
            function(results) {
                async.eachSeries(
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
                        $.each(results, function(index, file) {
                            if (file.delete) {
                                fs.unlinkSync(file.path);
                            }
                        });
                    }.bind(this)
                );

                input.val("");
            }.bind(this)
        );
    }

    async unzipNecessary(files) {
        var index = 0;
        var processed = [];
        var tempPath = app.getPath("temp");
        while (index < files.length) {
            var path = files[index].path;
            var name = files[index].name;

            if (path.endsWith(".zip")) {
                await fs
                    .createReadStream(path)
                    .pipe(unzip.Parse())
                    .on("entry", function(entry) {
                        var output = fpath.join(tempPath, entry.path);
                        entry.pipe(fs.createWriteStream(output));
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

        let pipeline = chain([
            fs.createReadStream(file, { encoding: "utf8" }),
            Pick.withParser({ filter: "meta" })
        ]);

        let asm = Asm.connectTo(pipeline);
        asm.on(
            "done",
            function(asm) {
                let data = asm.current;
                count = data.count;
                type = data.type;

                if (!acceptableTypes.includes(type)) {
                    emitter.emit("showAlert", "Unrecognized JSON Type");
                    callback();
                }

                this.processJson(file, callback, count, type);
            }.bind(this)
        );
    }

    processJson(file, callback, count, type) {
        let pipeline = chain([
            fs.createReadStream(file, { encoding: "utf8" }),
            Pick.withParser({ filter: type }),
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
                        glyphicon="glyphicon glyphicon-refresh"
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._exportClick.bind(this)}
                        hoverVal="Export Graph"
                        glyphicon="glyphicon glyphicon-export"
                    />
                </div>
                <div>
                    <MenuButton
                        click={this._importClick.bind(this)}
                        hoverVal="Import Graph"
                        glyphicon="glyphicon glyphicon-import"
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
