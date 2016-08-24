import React, { Component } from 'react';
import MenuButton from './MenuButton';
import ProgressBarMenuButton from './ProgressBarMenuButton';
import { buildMergeQuery, defaultAjaxSettings } from 'utils';
import { If, Then, Else } from 'react-if';
const { dialog } = require('electron').remote
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
				progress: 0
			})
			var completed = -1;
			Papa.parse(data,{
				header: true,
				dynamicTyping: true,
				chunkSize: 131072,
				chunk: function(rows, parser){
					parser.pause()
					this.setState({parser: parser})
					var options = defaultAjaxSettings()
					options.url = appStore.databaseInfo.url + '/db/data/batch'
					//var data = JSON.stringify(buildMergeQuery(rows.data, filetype), null, 2)
					options.data = JSON.stringify(buildMergeQuery(rows.data, filetype))
					options.success = function(){
						completed += rows.data.length
						this.setState({progress: Math.floor((completed / count) * 100)})
						if (completed === count){
							setTimeout(function(){
								this.setState({uploading: false})
							}.bind(this), 3000)
						}
						parser.resume()
						emitter.emit('refreshDBData')
					}.bind(this)
					options.error = function(xhr, status, error){
						if (xhr.statusText !== 'abort'){
							console.log(xhr)
							console.log(status)
							console.log(error)	
						}
					}
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
							<ProgressBarMenuButton click={this._cancelUploadClick.bind(this)} progress={this.state.progress}/>
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
