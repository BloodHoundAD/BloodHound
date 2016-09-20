import React, { Component } from 'react';
import { fullAjax, defaultAjaxSettings } from 'utils';
import LogoutModal from 'modals/LogoutModal';

export default class DatabaseDataDisplay extends Component {
	constructor(){
		super()
		this.state = {
			url: appStore.databaseInfo.url,
			user: appStore.databaseInfo.user,
			num_users: 'Refreshing',
			num_computers: 'Refreshing',
			num_groups: 'Refreshing',
			num_relationships: 'Refreshing',
			num_sessions: 'Refreshing',
			interval: null,
			session: driver.session()
		}
	}

	componentDidMount() {
		this.refreshDBData()
		var x = setInterval(function(){
			this.refreshDBData()
		}.bind(this), 60000);
		this.setState({
			interval: x
		})
		emitter.on('hideDBClearModal', this.refreshDBData.bind(this))
		emitter.on('refreshDBData', this.refreshDBData.bind(this))
	}

	componentWillUnmount() {
		clearInterval(this.state.interval)
		this.state.session.close()
		this.setState({
			interval: null,
			session: null
		})
	}

	toggleLogoutModal(){
		emitter.emit('showLogout');
	}

	toggleDBWarnModal(){
		emitter.emit('openDBWarnModal')
	}
	

	render() {
		return (
			<div>
				<h3>Database Info</h3>
				<dl className="dl-horizontal dl-horizontal-fix">
					<dt>DB Address</dt>
					<dd>{this.state.url}</dd>
					<dt>DB User</dt>
					<dd>{this.state.user}</dd>
					<dt>Users</dt>
					<dd>{this.state.num_users}</dd>
					<dt>Computers</dt>
					<dd>{this.state.num_computers}</dd>
					<dt>Groups</dt>
					<dd>{this.state.num_groups}</dd>
					<dt>Sessions</dt>
					<dd>{this.state.num_sessions}</dd>
					<dt>Relationships</dt>
					<dd>{this.state.num_relationships}</dd>
				</dl>

				<div className="text-center">
					<div className="btn-group dbbuttons">
						<button type="button" className="btn btn-success" onClick={function(){this.refreshDBData()}.bind(this)}>Refresh DB Stats</button>
						<button type="button" className="btn btn-warning" onClick={this.toggleLogoutModal}>Log Out/Switch DB</button>
						<button type="button" className="btn btn-danger" onClick={this.toggleDBWarnModal}>Clear Database</button>
					</div>
				</div>
			</div>
		);
	}

	refreshDBData(){
		var session = this.state.session;

		session.run("MATCH (n:User) WHERE NOT n.name ENDS WITH '$' RETURN count(n)")
			.then(function(result){
				this.setState({'num_users':result.records[0]._fields[0].low})
			}.bind(this))
		
		session.run("MATCH (n:Group) RETURN count(n)")
			.then(function(result){
				this.setState({'num_groups':result.records[0]._fields[0].low})
			}.bind(this))
		
		session.run("MATCH (n:Computer) RETURN count(n)")
			.then(function(result){
				this.setState({'num_computers':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH ()-[r:HasSession]->() RETURN count(r)")
			.then(function(result){
				this.setState({'num_sessions':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH ()-[r]->() RETURN count(r)")
			.then(function(result){
				this.setState({'num_relationships':result.records[0]._fields[0].low})
			}.bind(this))
	}
}
