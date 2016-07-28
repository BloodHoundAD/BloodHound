import React, { Component } from 'react';
import MenuButton from './menubutton';

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

	render() {
		return (
			<div className="menudiv">
				<div>
					<MenuButton click={this._refreshClick.bind(this)} hoverVal="Refresh" glyphicon="glyphicon glyphicon-refresh" />
				</div>
				<div>
					<MenuButton click={this._refreshClick.bind(this)} hoverVal="Export Graph" glyphicon="glyphicon glyphicon-export" />
				</div>
				<div>
					<MenuButton click={this._refreshClick.bind(this)} hoverVal="Import Graph" glyphicon="glyphicon glyphicon-import" />
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
