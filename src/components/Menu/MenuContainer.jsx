import React, { Component } from 'react';
import MenuButton from './MenuButton';
import ProgressBarMenuButton from './ProgressBarMenuButton';
<<<<<<< HEAD
import { buildDomainProps, buildSessionProps, buildLocalAdminProps, buildGroupMembershipProps, buildACLProps } from 'utils';
import { If, Then, Else } from 'react-if';
const { dialog, clipboard } = require('electron').remote
var fs = require('fs')
var async = require('async')

export default class MenuContainer extends Component {
	constructor(){
		super()

		this.state = {
			refreshHover: false,
			uploading: false,
			progress: 0,
			parser: null
		}

		emitter.on('cancelUpload', this.cancelUpload.bind(this))
	}

	cancelUpload(){
		this.state.parser.abort()
		setTimeout(function(){
			this.setState({uploading: false})
		}.bind(this), 1000)
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
		})
		if (typeof fname !== 'undefined'){
			emitter.emit('import',fname[0])
		}
	}

	_settingsClick(){
		emitter.emit('openSettings')
	}

	_cancelUploadClick(){
		emitter.emit('showCancelUpload')
	}

	_uploadClick(){
		var input = jQuery(this.refs.fileInput)
		var files = $.makeArray(input[0].files)

		async.eachSeries(files, function(file, callback){
			emitter.emit('showAlert', 'Processing file {}'.format(file.name));
			this.processFile(file.path, file, callback)
		}.bind(this),
		function done(){
			setTimeout(function(){
				this.setState({uploading: false})
			}.bind(this), 3000)
		}.bind(this))

		input.val('')
	}

	_aboutClick(){
		emitter.emit('showAbout')
	}

	processFile(filename, fileobject, callback){
		var sent = 0

		var i;
		var count = 0;
		var header = ""
		var procHeader = true;
		fs.createReadStream(filename)
			.on('data', function(chunk) {
				for (i=0; i < chunk.length; ++i){
					if (procHeader){
						header = header + String.fromCharCode(chunk[i])
					}
					if (chunk[i] == 10){
						if (procHeader){
							procHeader = false;
						}
						count++
					};
				}
				
			})
			.on('end', function() {
				count = count - 1
				var filetype;
				if (header.includes('UserName') && header.includes('ComputerName') && header.includes('Weight')){
					filetype = 'sessions'
				}else if (header.includes('AccountName') && header.includes('AccountType') && header.includes('GroupName')){
					filetype = 'groupmembership'
				}else if (header.includes('AccountName') && header.includes('AccountType') && header.includes('ComputerName')){
					filetype = 'localadmin'
				}else if (header.includes('SourceDomain') && header.includes('TargetDomain') && header.includes('TrustDirection') && header.includes('TrustType') && header.includes('Transitive')){
					filetype = 'domain'
				}else if (header.includes('ActiveDirectoryRights') && header.includes('ObjectType') && header.includes('PrincipalType')){
					filetype = 'acl'
				}

				if (typeof filetype === 'undefined'){
					emitter.emit('showAlert', 'Unrecognized CSV Type');
					return;
				}

				this.setState({
					uploading: true,
					progress: 0
				})
				//I have no idea why this workaround is needed. Apparently all my sessions freeze unless I make a random query
				setTimeout(function(){
					var sess = driver.session()
					sess.run('MATCH (n) RETURN (n) LIMIT 1')
						.then(function(){
							sess.close()
						})
				}, 1000)

				console.time('IngestTime')
				Papa.parse(fileobject,{
					header: true,
					dynamicTyping: true,
					skipEmptyLines: true,
					chunkSize: 5242880,
					//chunkSize: 500000,
					chunk: function(rows, parser){
						this.setState({parser: parser})
						if (rows.data.length === 0){
							console.timeEnd('IngestTime')
							parser.abort()
							this.setState({progress:100})
							emitter.emit('refreshDBData')
							callback()
							return
						}
						parser.pause()
						sent += rows.data.length
						if (filetype === 'sessions'){
							var query = 'UNWIND {props} AS prop MERGE (user:User {name:prop.account}) WITH user,prop MERGE (computer:Computer {name: prop.computer}) WITH user,computer,prop MERGE (computer)-[:HasSession {Weight : prop.weight}]-(user)'
							var props = buildSessionProps(rows.data)
							var session = driver.session()
							session.run(query, {props: props})
								.then(function(){
									this.setState({progress: Math.floor((sent / count) * 100)})
									session.close()
									parser.resume()
								}.bind(this))
						}else if (filetype === 'groupmembership'){
							var props = buildGroupMembershipProps(rows.data)
							var userQuery = 'UNWIND {props} AS prop MERGE (user:User {name:prop.account}) WITH user,prop MERGE (group:Group {name:prop.group}) WITH user,group MERGE (user)-[:MemberOf]->(group)'
							var computerQuery = 'UNWIND {props} AS prop MERGE (computer:Computer {name:prop.account}) WITH computer,prop MERGE (group:Group {name:prop.group}) WITH computer,group MERGE (computer)-[:MemberOf]->(group)'
							var groupQuery = 'UNWIND {props} AS prop MERGE (group1:Group {name:prop.account}) WITH group1,prop MERGE (group2:Group {name:prop.group}) WITH group1,group2 MERGE (group1)-[:MemberOf]->(group2)'
							
							var session = driver.session()
							var tx = session.beginTransaction()
							var promises = []

							promises.push(tx.run(userQuery, {props: props.users}))
							promises.push(tx.run(computerQuery, {props: props.computers}))
							promises.push(tx.run(groupQuery, {props: props.groups}))

							Promise.all(promises)
								.then(function(){
									tx.commit()
										.then(function(){
											session.close()
											this.setState({progress: Math.floor((sent / count) * 100)})
											parser.resume()
										}.bind(this))
								}.bind(this))
						}else if (filetype === 'localadmin'){
							var props = buildLocalAdminProps(rows.data)
							var userQuery = 'UNWIND {props} AS prop MERGE (user:User {name: prop.account}) WITH user,prop MERGE (computer:Computer {name: prop.computer}) WITH user,computer MERGE (user)-[:AdminTo]->(computer)'
							var groupQuery = 'UNWIND {props} AS prop MERGE (group:Group {name: prop.account}) WITH group,prop MERGE (computer:Computer {name: prop.computer}) WITH group,computer MERGE (group)-[:AdminTo]->(computer)'
							var computerQuery = 'UNWIND {props} AS prop MERGE (computer1:Computer {name: prop.account}) WITH computer1,prop MERGE (computer2:Computer {name: prop.computer}) WITH computer1,computer2 MERGE (computer1)-[:AdminTo]->(computer2)'

							var session = driver.session()
							var tx = session.beginTransaction()
							var promises = []

							promises.push(tx.run(userQuery, {props: props.users}))
							promises.push(tx.run(computerQuery, {props: props.computers}))
							promises.push(tx.run(groupQuery, {props: props.groups}))

							Promise.all(promises)
								.then(function(){
									tx.commit()
										.then(function(){
											session.close()
											this.setState({progress: Math.floor((sent / count) * 100)})
											parser.resume()
										}.bind(this))
								}.bind(this))
						}else if (filetype === 'domain'){
							var props = buildDomainProps(rows.data)
							var query = "UNWIND {props} AS prop MERGE (domain1:Domain {name: prop.domain1}) WITH domain1,prop MERGE (domain2:Domain {name: prop.domain2}) WITH domain1,domain2,prop MERGE (domain1)-[:TrustedBy {TrustType : prop.trusttype, Transitive: prop.transitive}]->(domain2)"
							var session = driver.session()
							session.run(query, {props: props})
								.then(function(){
									this.setState({progress: Math.floor((sent / count) * 100)})
									session.close()
									parser.resume()
								}.bind(this))
						}else if (filetype === 'acl'){
							var data = buildACLProps(rows.data)
							var promises = []
							var session = driver.session()
							var tx = session.beginTransaction()
							for (var key in data){
								var promise = tx.run(data[key].statement, {props: data[key].props})
								promises.push(promise)
							}

							Promise.all(promises)
								.then(function(){
									tx.commit()
										.then(function(){
											this.setState({progress: Math.floor((sent / count) * 100)})
											session.close()
											parser.resume()
										}.bind(this))
								}.bind(this))
						}
					}.bind(this)
				})
			}.bind(this));
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
=======
import { buildDomainProps, buildSessionProps, buildLocalAdminProps, buildGroupMembershipProps, buildACLProps, findObjectType, buildStructureProps, buildGplinkProps} from 'utils';
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
            processed = buildGroupMembershipProps(currentChunk);
            for (let skey in processed) {
                await session.run(processed[skey].statement, { props: processed[skey].props });
            }
        }else if (filetype === 'localadmin'){
            processed = buildLocalAdminProps(currentChunk);
            for (let skey in processed) {
                await session.run(processed[skey].statement, { props: processed[skey].props });
            }
        }else if (filetype === 'sessions'){
            processed = buildSessionProps(currentChunk);

            for (let skey in processed) {
                await session.run(processed[skey].statement, { props: processed[skey].props });
            }
        }else if (filetype === 'domain'){
            processed = buildDomainProps(currentChunk);

            for (let skey in processed) {
                await session.run(processed[skey].statement, { props: processed[skey].props });
            }
        }else if (filetype === 'acl'){
            processed = buildACLProps(currentChunk);

            for (let key in processed){
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
            let query = 'UNWIND {props} AS prop MERGE (user:User {name: upper(prop.AccountName)}) SET user.Enabled = toBoolean(prop.Enabled),user.PwdLastSet = toInt(prop.PwdLastSet),user.LastLogon = toInt(prop.LastLogon),user.Sid = prop.Sid,user.SidHistory = prop.SidHistory,user.HasSPN = toBoolean(prop.HasSPN),user.DisplayName=prop.DisplayName,user.ServicePrincipalNames = prop.ServicePrincipalNames,user.Email=prop.Email,user.domain=prop.Domain,user.Title=prop.Title,user.HomeDir=prop.HomeDirectory';

            await session.run(query, {props:currentChunk});
        }else if (filetype === 'compprops'){
            let query = 'UNWIND {props} AS prop MERGE (comp:Computer {name: upper(prop.AccountName)}) SET comp.Enabled=toBoolean(prop.Enabled),comp.PwdLastSet=toInt(prop.PwdLastSet),comp.LastLogon=toInt(prop.LastLogon),comp.OperatingSystem=prop.OperatingSystem,comp.Sid=prop.Sid,comp.UnconstrainedDelegation=toBoolean(prop.UnconstrainedDelegation),comp.domain=prop.Domain';
            await session.run(query, {props:currentChunk});
        }else if (filetype === 'structure'){  
            processed = buildStructureProps(currentChunk);
            for (let skey in processed){
                await session.run(processed[skey].statement, { props: processed[skey].props });
            }
        }else if (filetype === 'gplink'){
            processed = buildGplinkProps(currentChunk);
            for (let gkey in processed) {
                await session.run(processed[gkey].statement, { props: processed[gkey].props });
            }
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
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
}
