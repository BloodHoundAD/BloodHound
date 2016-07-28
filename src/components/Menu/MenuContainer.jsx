import React, { Component } from 'react';
import MenuButton from './menubutton';
const { dialog } = require('electron').remote

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
		emitter.emit('import',dialog.showOpenDialog({
			properties: ['openFile']
		})[0])
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
					<MenuButton click={this._refreshClick.bind(this)} hoverVal="Upload Data" glyphicon="glyphicon glyphicon-upload" />
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
