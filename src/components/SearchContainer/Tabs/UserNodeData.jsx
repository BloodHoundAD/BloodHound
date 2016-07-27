import React, { Component } from 'react';
import NodeALink from './nodealink'
import { fullAjax } from 'utils'

export default class UserNodeData extends Component {
	propTypes: {
		visible : React.PropTypes.bool.isRequired
	}

	constructor(){
		super();

		this.state = {
			label: "",
			samAccountName: "None",
			displayName: "None",
			pwdLastChanged: "None",
			firstDegreeGroupMembership: -1,
			unrolledGroupMembership: -1,
			foreignGroupMembership: -1,
			firstDegreeLocalAdmin: -1,
			groupDelegatedLocalAdmin: -1,
			derivateLocalAdmin: -1,
			sessions: -1
		}

		emitter.on('userNodeClicked', this.getNodeData.bind(this));
	}

	placeholder(){

	}

	getNodeData(payload){
		this.setState({
			label: payload,
			samAccountName: "None",
			displayName: "None",
			pwdLastChanged: "None",
			firstDegreeGroupMembership: -1,
			unrolledGroupMembership: -1,
			foreignGroupMembership: -1,
			firstDegreeLocalAdmin: -1,
			groupDelegatedLocalAdmin: -1,
			derivativeLocalAdmin: -1,
			sessions: -1
		})
		var firstDegreeGroupMembership, 
			unrolledGroupMembership,
			unrolledGroupMembership,
			foreignGroupMembership,
			firstDegreeLocalAdmin,
			groupDelegatedLocalAdmin,
			derivativeLocalAdmin,
			sessions;

		firstDegreeGroupMembership = fullAjax(
			"MATCH (n:User {name:'{}'}), (m:Group), p=allShortestPaths((n)-[:MemberOf*1]->(m)) RETURN count(m)".format(payload),
			function(json){
				this.setState({firstDegreeGroupMembership: json.results[0].data[0].row[0]})	
			}.bind(this))
		
		unrolledGroupMembership = fullAjax(
			"MATCH (n:User {name:'{}'}), (target:Group), p=allShortestPaths((n)-[:MemberOf*1..]->(target)) RETURN count(target)".format(payload),
			function(json){
				this.setState({unrolledGroupMembership: json.results[0].data[0].row[0]})
			}.bind(this))

		firstDegreeLocalAdmin = fullAjax(
			"MATCH (n:User {name:'{}'}), (target:Computer), p=allShortestPaths((n)-[:AdminTo*1]->(target)) RETURN count(target)".format(payload),
			function(json){
				this.setState({firstDegreeLocalAdmin: json.results[0].data[0].row[0]})
			}.bind(this)
			)
		groupDelegatedLocalAdmin = fullAjax(
			"MATCH x=allShortestPaths((n:User {name:'{}'})-[r:MemberOf*1..]->(m:Group)) WITH n,m,r MATCH (m)-[s:AdminTo*1..]->(p:Computer) RETURN count(distinct(p))".format(payload),
			function(json){
				this.setState({groupDelegatedLocalAdmin: json.results[0].data[0].row[0]})
			}.bind(this)
			)
		derivativeLocalAdmin = fullAjax(
			"MATCH (n:User {name:'{}'}), (target:Computer), p=allShortestPaths((n)-[*]->(target)) RETURN count(distinct(target))".format(payload),
			function(json){
				this.setState({derivativeLocalAdmin: json.results[0].data[0].row[0]})
			}.bind(this)
			)
		sessions = fullAjax(
			"MATCH (n:Computer)-[r:HasSession]->(m:User {name:'{}'}) RETURN count(n)".format(payload),
			function(json){
				this.setState({sessions: json.results[0].data[0].row[0]})
			}.bind(this)
			)

		$.ajax(firstDegreeGroupMembership);
		$.ajax(unrolledGroupMembership);
		$.ajax(firstDegreeLocalAdmin);
		$.ajax(groupDelegatedLocalAdmin);
		$.ajax(derivativeLocalAdmin);
		$.ajax(sessions);
	}

	render() {
		return (
			<div className={this.props.visible ? "" : "displaynone"}>
				<dl className='dl-horizontal'>
					<dt>
						Node
					</dt>
					<dd>
						{this.state.label}
					</dd>
					<br />
					<dt>
						SAMAccountName
					</dt>
					<dd>
						{this.state.samAccountName}
					</dd>
					<dt>
						Display Name
					</dt>
					<dd>
						{this.state.displayName}
					</dd>
					<dt>
						Password Last Changed
					</dt>
					<dd>
						{this.state.pwdLastChanged}
					</dd>
					<br />
					<dt>
						First Degree Group Memberships
					</dt>
					<dd>
						<NodeALink 
							ready={this.state.firstDegreeGroupMembership !== -1}
							value={this.state.firstDegreeGroupMembership}
							click={function(){
								emitter.emit('query', "MATCH (n:User {name:'{}'}), (target:Group),p=allShortestPaths((n)-[:MemberOf*1]->(target)) RETURN p".format(this.state.label))
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Group Memberships
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledGroupMembership !== -1}
							value={this.state.unrolledGroupMembership}
							click={function(){
								emitter.emit('query', "MATCH (n:User {name:'{}'}), (target:Group),p=allShortestPaths((n)-[:MemberOf*1..]->(target)) RETURN p".format(this.state.label),
									this.state.label)
							}.bind(this)} />
					</dd>
					{/*<dt>
						Foreign Group Membership
					</dt>
					<dd>
						<NodeALink
							ready={this.state.foreignGroupMembership !== -1}
							value={this.state.foreignGroupMembership}
							click={this.placeholder} />
					</dd> */}
					<br />
					<dt>
						First Degree Local Admin
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeLocalAdmin !== -1}
							value={this.state.firstDegreeLocalAdmin}
							click={function(){
								emitter.emit('query', "MATCH (n:User {name:'{}'}), (target:Computer), p=allShortestPaths((n)-[:AdminTo*1]->(target)) RETURN p".format(this.state.label))
							}.bind(this)} />
					</dd>
					<dt>
						Group Delegated Local Admin Rights
					</dt>
					<dd>
						<NodeALink
							ready={this.state.groupDelegatedLocalAdmin !== -1}
							value={this.state.groupDelegatedLocalAdmin}
							click={function(){
								emitter.emit('query', "MATCH (n:User {name:'{}'}), (m:Group), x=allShortestPaths((n)-[r:MemberOf*1..]->(m)) WITH n,m,r MATCH (m)-[s:AdminTo*1..]->(p:Computer) RETURN n,m,r,s,p".format(this.state.label)
									,this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Derivative Local Admin Rights
					</dt>
					<dd>
						<NodeALink
							ready={this.state.derivativeLocalAdmin !== -1}
							value={this.state.derivativeLocalAdmin}
							click={this.placeholder} />
					</dd>
					<dt>
						Sessions
					</dt>
					<dd>
						<NodeALink
							ready={this.state.sessions !== -1}
							value={this.state.sessions}
							click={this.placeholder} />
					</dd>
				</dl>
			</div>
		);
	}
}
