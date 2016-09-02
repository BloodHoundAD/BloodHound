import React, { Component } from 'react';
import MenuButton from './MenuButton';
import ProgressBarMenuButton from './ProgressBarMenuButton';
import { buildMergeQuery, defaultAjaxSettings } from 'utils';
import { If, Then, Else } from 'react-if';
const { dialog, clipboard } = require('electron').remote
var fs = require('fs')

export default class MenuContainer extends Component {
	constructor(){
		super()

		this.state = {
			refreshHover: false,
			uploading: false,
			progress: 0,
			parser: null,
			currentAjax: null
		}

		emitter.on('cancelUpload', this.cancelUpload.bind(this))
	}

	cancelUpload(){
		this.state.parser.abort()
		this.state.currentAjax.abort()
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

	_uploadClick(){
		var data;

		var filename = dialog.showOpenDialog({
			properties: ['openFile']
		})[0]

		var i;

		fs.readFile(filename, 'utf8', function(err, data){
			var count = data.split('\n').length;
			count = count - 2
			var header = data.split('\n')[0]
			var filetype;
			if (header.includes('UserName') && header.includes('ComputerName') && header.includes('Weight')){
				filetype = 'sessions'
			}else if (header.includes('AccountName') && header.includes('AccountType') && header.includes('GroupName')){
				filetype = 'groupmembership'
			}else if (header.includes('AccountName') && header.includes('AccountType') && header.includes('ComputerName')){
				filetype = 'localadmin'
			}else if (header.includes('SourceDomain') && header.includes('TargetDomain') && header.includes('TrustDirection') && header.includes('TrustType') && header.includes('Transitive')){
				filetype = 'domain'
			}

			if (typeof filetype === 'undefined'){
				emitter.emit('showAlert', 'Unrecognized CSV Type');
				return;
			}

			this.setState({
				uploading: true,
				progress: 0,
				committed: 0
			})
			var completed = -1;
			var sent = -1;
			var committed = 0;
			var transactionID = 0;
			var openTransaction = defaultAjaxSettings()
			openTransaction.url = appStore.databaseInfo.url + '/db/data/transaction'
			openTransaction.async = false
			openTransaction.data = JSON.stringify(
			{
				"statements": []
			}
			)
			openTransaction.success = function(data){
				var frag = data.commit.split('/')
				transactionID = frag[frag.length - 2]
			}
			$.ajax(openTransaction)

			var closeTransaction = defaultAjaxSettings()

			Papa.parse(data,{
				header: true,
				dynamicTyping: true,
				chunkSize: 25600,
				skipEmptyLines: true,
				chunk: function(rows, parser){
					if (rows.data.length === 0){
						parser.abort()
						if (committed !== count){
							closeTransaction.url = appStore.databaseInfo.url + '/db/data/transaction/' + transactionID + '/commit'
							closeTransaction.success = function(){
								committed += sent
								this.setState({committed: 100, progress: 100})
								setTimeout(function(){
									this.setState({uploading: false})
								}.bind(this), 3000)
								emitter.emit('refreshDBData')
							}.bind(this)
							$.ajax(closeTransaction)
						}
						return
					}
					parser.pause()
					this.setState({parser: parser})
					var options = defaultAjaxSettings()
					options.url = appStore.databaseInfo.url + '/db/data/transaction/' + transactionID
					//var data = JSON.stringify(buildMergeQuery(rows.data, filetype), null, 2)
					options.headers['X-Stream'] = true
					options.data = JSON.stringify(buildMergeQuery(rows.data, filetype))
					options.success = function(json){
						if (json.errors.length > 0){
							parser.abort()
							fs.writeFile("error.log", JSON.stringify(json.errors, null, 2))
							clipboard.writeText(JSON.stringify(json.errors, null, 2))
							dialog.showErrorBox("Ingestion Error", "An error occurred in ingestion.\nIf possible please post the error.log file to a git issue (check for sensitive data first!) or contact cptjesus directly on the BloodHound Slack Channel.\nThe error has also been copied to your clipboard.")
							this.cancelUpload()							
							return
						}
						completed += rows.data.length
						sent += rows.data.length
						this.setState({progress: Math.floor((completed / count) * 100)})
						if (sent > 20000){
							closeTransaction.url = appStore.databaseInfo.url + '/db/data/transaction/' + transactionID + '/commit'
							closeTransaction.success = function(){
								committed += sent
								sent = 0
								if (committed < count){
									$.ajax(openTransaction)	
								}else{
									setTimeout(function(){
										this.setState({uploading: false})
									}.bind(this), 3000)
								}
								this.setState({committed: Math.floor((committed / count) * 100)})
								parser.resume()
							}.bind(this)
							$.ajax(closeTransaction)
						}else{
							parser.resume()
						}
					}.bind(this)
					var a = $.ajax(options);
					this.setState({currentAjax: a})
				}.bind(this)
			})
		}.bind(this))
	}

	_settingsClick(){
		emitter.emit('openSettings')
	}

	_cancelUploadClick(){
		emitter.emit('showCancelUpload')
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
							<MenuButton click={this._uploadClick.bind(this)} hoverVal="Upload Data" glyphicon="glyphicon glyphicon-upload" />		
						}</Else>
					</If>		
				</div>
				<div>
					<MenuButton click={this._changeLayoutClick.bind(this)} hoverVal="Change Layout Type" glyphicon="fa fa-line-chart" />
				</div>
				<div>
					<MenuButton click={this._settingsClick.bind(this)} hoverVal="Settings" glyphicon="fa fa-cogs" />
				</div>
			</div>
		);
	}
}
