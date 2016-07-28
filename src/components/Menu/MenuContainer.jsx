import React, { Component } from 'react';
import MenuButton from './menubutton';
const { dialog } = require('electron').remote
var fs = require('fs')

export default class MenuContainer extends Component {
	constructor(){
		super()

		this.state = {
			refreshHover: false
		}
	}

	_refreshClick(){
		emitter.emit('graphRefresh')
	}

	_changeLayoutClick(){
		appStore.dagre = !appStore.dagre
		emitter.emit('graphRefresh')
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

		fs.readFile(filename, 'utf8', function(err, data){
			var header = data.split('\n')[0]
			var filetype;
			if (header.includes('UserName') && header.includes('ComputerName') && header.include('Weight')){
				filetype = 'session'
			}else if (header.includes('AccountName') && header.includes('AccountType') && header.includes('GroupName')){
				filetype = 'group'
			}else if (header.includes('AccountName') && header.includes('AccountType') && header.includes('ComputerName')){
				filetype = 'localadmin'
			}else if (header.includes('SourceDomain') && header.includes('TargetDomain') && header.includes('TrustDirection') && header.include('TrustType') && header.includes('Transitive')){
				filetype = 'domain'
			}

			if (typeof filetype === 'undefined'){
				emitter.emit('showAlert', 'Unreconized CSV Type');
				return;
			}

			Papa.parse(data,{
				worker: true,
				header: true,
				dynamicTyping: true,
				chunk: function(row, parser){
					console.log(row)
				}
			})
		})
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
					<MenuButton click={this._uploadClick.bind(this)} hoverVal="Upload Data" glyphicon="glyphicon glyphicon-upload" />
				</div>
				<div>
					<MenuButton click={this._changeLayoutClick.bind(this)} hoverVal="Change Layout Type" glyphicon="fa fa-line-chart" />
				</div>
				<div>
					<MenuButton click={this._refreshClick.bind(this)} hoverVal="Settings" glyphicon="fa fa-cogs" />
				</div>
			</div>
		);
	}
}
