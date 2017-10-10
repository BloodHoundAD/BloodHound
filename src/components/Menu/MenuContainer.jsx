import React, { Component } from 'react';
import MenuButton from './MenuButton';
import ProgressBarMenuButton from './ProgressBarMenuButton';
import { buildDomainProps, buildSessionProps, buildLocalAdminProps, buildGroupMembershipProps, buildACLProps, findObjectType} from 'utils';
import { If, Then, Else } from 'react-if';
const { dialog, clipboard, app } = require('electron').remote;
var fs = require('fs');
var async = require('async');
var unzip = require('unzipper');
var fpath = require('path');
var csv = require('fast-csv');

export default class MenuContainer extends Component {
    constructor(){
        super();

        this.state = {
            refreshHover: false,
            uploading: false,
            progress: 0,
            cancelled: false
        };

        emitter.on('cancelUpload', this.cancelUpload.bind(this))
    }

    cancelUpload(){
        this.setState({cancelled: true});
        setTimeout(function(){
            this.setState({uploading: false})
        }.bind(this), 1000);
    }

    _refreshClick(){
        emitter.emit('graphRefresh')
    }

    _changeLayoutClick(){
        appStore.dagre = !appStore.dagre
        emitter.emit('graphRefresh')
        var type = appStore.dagre ? 'Hierarchical' : 'Directed'
        emitter.emit('showAlert', 'Changed Layout to ' + type)
    }

    _exportClick(){
        emitter.emit('showExport');
    }

    _importClick(){
        var fname = dialog.showOpenDialog({
            properties: ['openFile']
        });
        if (typeof fname !== 'undefined'){
            emitter.emit('import',fname[0]);
        }
    }

    _settingsClick(){
        emitter.emit('openSettings')
    }

    _cancelUploadClick(){
        emitter.emit('showCancelUpload')
    }

    _uploadClick(){
        var input = jQuery(this.refs.fileInput);
        var fileNames = [];

        $.each(input[0].files, function(index, file){
            fileNames.push({path:file.path, name:file.name});
        });

        this.unzipNecessary(fileNames).then(function(results){
            async.eachSeries(results, function(file, callback){
                emitter.emit('showAlert', 'Processing file {}'.format(file.name));
                this.processFile(file.path, callback);
            }.bind(this),
            function done(){
                setTimeout(function(){
                    this.setState({uploading: false});
                }.bind(this), 3000);
                $.each(results, function(index, file){
                    if (file.delete){
                        fs.unlinkSync(file.path);
                    }
                });
            }.bind(this));
    
            input.val('');
        }.bind(this));
        
    }

    async unzipNecessary(files){
        var index = 0;
        var processed = [];
        var tempPath = app.getPath('temp');
        while (index < files.length){
            var path = files[index].path;
            var name = files[index].name;

            if (path.endsWith(".zip")){
                await fs.createReadStream(path)
                    .pipe(unzip.Parse())
                    .on('entry', function(entry){
                        var output = fpath.join(tempPath, entry.path);
                        entry.pipe(fs.createWriteStream(output));
                        processed.push({path:output, name:entry.path, delete: true});
                    }).promise();
            }else{
                processed.push({path:path,name:name, delete: false});
            }
            index++;
        }

        return processed;
    }

    _aboutClick(){
        emitter.emit('showAbout');
    }
    
    processFile(file, callback){
        console.log(file);
        var count = 0;
        var header = "";
        var processHeader = true;
        var fileType;
        
        //Lets calculate the number of lines in the file and get the header
        var input = fs.createReadStream(file);
        input.on('data', function (chunk){
            for (var i=0; i < chunk.length; ++i){
                    if (processHeader){
                        header = header + String.fromCharCode(chunk[i]);
                    }
                    if (chunk[i] === 10){
                        //At the first newline, we look at the header to figure out 
                        if (processHeader){
                            processHeader = false;
                            fileType = findObjectType(header);
                            if (fileType === 'unknown'){
                                emitter.emit('showAlert', 'Unrecognized CSV Type');
                                input.close();
                            }
                        }
                        count++;
                    }
            }
        })
        .on('end', function(){
            //We've got our line count for progress
            var chunk = [];
            var localCount = 0;
            var sent = 0;

            //Subtract one line to account for the header
            count--;
            
            //Change the UI to display our uploading state
            this.setState({
                uploading: true,
                progress: 0
            });

            //Start a timer
            console.time('IngestTime');

            //Start parsing the file
            var parser = csv.fromStream(fs.createReadStream(file),
            {
                 headers: true,
                 ignoreEmpty: true
            })
            .on('data', function(data){
                //On each row, push it into an array and increment a counter
                chunk.push(data);
                localCount++;

                //If we've collected 10k rows, push it all to the DB.
                if (localCount % 10000 === 0){
                    //Pause the parser until upload is complete
                    parser.pause();
                    this.uploadData(chunk, fileType, count)
                        .then(function(){
                            //Update the sent number, and resume the parser
                            sent += chunk.length;
                            this.setState({progress: Math.floor(sent / count * 100)});

                            chunk = [];
                            parser.resume();
                        }.bind(this));
                }
            }.bind(this))
            .on('end', function(){
                //Upload any remaining data
                this.uploadData(chunk, fileType, count)
                    .then(function(){
                        //Set the uploading state to 100%, refresh the db display, and move on to the next file if there is one
                        this.setState({progress:100});
                        emitter.emit('refreshDBData');
                        console.timeEnd('IngestTime');
                        callback();
                    }.bind(this));
            }.bind(this));
        }.bind(this));
    }
    
    async uploadData(currentChunk, filetype, total){
        var index = 0;
        var processed;
        var sent = 0;
        var session = driver.session();

        if (filetype === 'groupmembership'){
            var userQuery = 'UNWIND {props} AS prop MERGE (user:User {name:prop.account}) WITH user,prop MERGE (group:Group {name:prop.group}) WITH user,group MERGE (user)-[:MemberOf {isACL:false}]->(group)';
            var computerQuery = 'UNWIND {props} AS prop MERGE (computer:Computer {name:prop.account}) WITH computer,prop MERGE (group:Group {name:prop.group}) WITH computer,group MERGE (computer)-[:MemberOf {isACL:false}]->(group)';
            var groupQuery = 'UNWIND {props} AS prop MERGE (group1:Group {name:prop.account}) WITH group1,prop MERGE (group2:Group {name:prop.group}) WITH group1,group2 MERGE (group1)-[:MemberOf {isACL:false}]->(group2)';

            processed = buildGroupMembershipProps(currentChunk);

            await session.run(userQuery, {props: processed.users});
            await session.run(computerQuery, {props: processed.computers});
            await session.run(groupQuery, {props: processed.groups});
        }else if (filetype === 'localadmin'){
            userQuery = 'UNWIND {props} AS prop MERGE (user:User {name: prop.account}) WITH user,prop MERGE (computer:Computer {name: prop.computer}) WITH user,computer MERGE (user)-[:AdminTo {isACL:false}]->(computer)';
            groupQuery = 'UNWIND {props} AS prop MERGE (group:Group {name: prop.account}) WITH group,prop MERGE (computer:Computer {name: prop.computer}) WITH group,computer MERGE (group)-[:AdminTo {isACL:false}]->(computer)';
            computerQuery = 'UNWIND {props} AS prop MERGE (computer1:Computer {name: prop.account}) WITH computer1,prop MERGE (computer2:Computer {name: prop.computer}) WITH computer1,computer2 MERGE (computer1)-[:AdminTo {isACL:false}]->(computer2)';

            processed = buildLocalAdminProps(currentChunk);

            await session.run(userQuery, {props: processed.users});
            await session.run(computerQuery, {props: processed.computers});
            await session.run(groupQuery, {props: processed.groups});
        }else if (filetype === 'sessions'){
            var query = 'UNWIND {props} AS prop MERGE (user:User {name:prop.account}) WITH user,prop MERGE (computer:Computer {name: prop.computer}) WITH user,computer,prop MERGE (computer)-[:HasSession {Weight : prop.weight, isACL: false}]-(user)';

            processed = buildSessionProps(currentChunk);

            await session.run(query, {props: processed});
        }else if (filetype === 'domain'){
            query = "UNWIND {props} AS prop MERGE (domain1:Domain {name: prop.domain1}) WITH domain1,prop MERGE (domain2:Domain {name: prop.domain2}) WITH domain1,domain2,prop MERGE (domain1)-[:TrustedBy {TrustType : prop.trusttype, Transitive: toBoolean(prop.transitive), isACL:false}]->(domain2)";

            processed = buildDomainProps(currentChunk);

            await session.run(query, {props: processed});
        }else if (filetype === 'acl'){
            processed = buildACLProps(currentChunk);

            for (var key in processed){
                await session.run(processed[key].statement, {props: processed[key].props});
            }
        }else if (filetype === 'userprops'){
            $.each(currentChunk, function(index, obj){
                var spn = obj.ServicePrincipalNames;
                var sh = obj.SidHistory;

                if (spn === ""){
                    obj.ServicePrincipalNames = [];
                }else{
                    obj.ServicePrincipalNames = spn.split('|');
                }
            });
            query = 'UNWIND {props} AS prop MERGE (user:User {name: upper(prop.AccountName)}) SET user.Enabled = toBoolean(prop.Enabled),user.PwdLastSet = toInt(prop.PwdLastSet),user.LastLogon = toInt(prop.LastLogon),user.Sid = prop.Sid,user.SidHistory = prop.SidHistory,user.HasSPN = toBoolean(prop.HasSPN),user.DisplayName=prop.DisplayName,user.ServicePrincipalNames = prop.ServicePrincipalNames,user.Email=prop.Email';

            await session.run(query, {props:currentChunk});
        }else if (filetype === 'compprops'){
            query = 'UNWIND {props} AS prop MERGE (comp:Computer {name: upper(prop.AccountName)}) SET comp.Enabled=toBoolean(prop.Enabled),comp.PwdLastSet=toInt(prop.PwdLastSet),comp.LastLogon=toInt(prop.LastLogon),comp.OperatingSystem=prop.OperatingSystem,comp.Sid=prop.Sid,comp.UnconstrainedDelegation=toBoolean(prop.UnconstrainedDelegation)';

            await session.run(query, {props:currentChunk});
        }
    }

    render() {
        return (
            <div className="menudiv">
                <div>
                    <MenuButton click={this._refreshClick.bind(this)} hoverVal="Refresh" glyphicon="glyphicon glyphicon-refresh" />
                </div>
                <div>
                    <MenuButton click={this._exportClick.bind(this)} hoverVal="Export Graph" glyphicon="glyphicon glyphicon-export" />
                </div>
                <div>
                    <MenuButton click={this._importClick.bind(this)} hoverVal="Import Graph" glyphicon="glyphicon glyphicon-import" />
                </div>
                <div>
                    <If condition={this.state.uploading}>
                        <Then>
                            <ProgressBarMenuButton click={this._cancelUploadClick.bind(this)} progress={this.state.progress} committed={this.state.committed}/>
                        </Then>
                        <Else>{ () =>
                            <MenuButton click={function(){jQuery(this.refs.fileInput).click()}.bind(this)} hoverVal="Upload Data" glyphicon="glyphicon glyphicon-upload" />        
                        }</Else>
                    </If>        
                </div>
                <div>
                    <MenuButton click={this._changeLayoutClick.bind(this)} hoverVal="Change Layout Type" glyphicon="fa fa-line-chart" />
                </div>
                <div>
                    <MenuButton click={this._settingsClick.bind(this)} hoverVal="Settings" glyphicon="fa fa-cogs" />
                </div>
                <div>
                    <MenuButton click={this._aboutClick.bind(this)} hoverVal="About" glyphicon="fa fa-info" />
                </div>
                <input ref="fileInput" multiple className="hide" type="file" onChange={this._uploadClick.bind(this)}/>
            </div>
        );
    }
}
