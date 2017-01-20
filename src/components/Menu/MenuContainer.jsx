import React, { Component } from 'react';
import MenuButton from './MenuButton';
import ProgressBarMenuButton from './ProgressBarMenuButton';
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
}
