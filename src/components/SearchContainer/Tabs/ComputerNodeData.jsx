import React, { Component } from 'react';
import { fullAjax } from 'utils';
import NodeALink from './NodeALink'

export default class ComputerNodeData extends Component {
	propTypes: {
		visible : React.PropTypes.bool.isRequired
	}

	constructor(){
		super();

		this.state = {
			label: "",
			os: "None",
			unconstrained: "None",
			explicitAdmins: -1,
			unrolledAdmins: -1,
			firstDegreeGroupMembership: -1,
			unrolledGroupMembership: -1,
			firstDegreeLocalAdmin: -1,
			groupDelegatedLocalAdmin: -1,
			derivativeLocalAdmin: -1,
			sessions: -1
		}

		emitter.on('computerNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		this.setState({
			label: payload,
			os: "None",
			unconstrained: "None",
			explicitAdmins: -1,
			unrolledAdmins: -1,
			firstDegreeGroupMembership: -1,
			unrolledGroupMembership: -1,
			sessions: -1,
			firstDegreeLocalAdmin: -1,
			groupDelegatedLocalAdmin: -1,
			derivativeLocalAdmin: -1
		})

		var explicitAdmins, 
			unrolledAdmins, 
			firstDegreeGroupMembership,
			unrolledGroupMembership,
			firstDegreeLocalAdmin,
			groupDelegatedLocalAdmin,
			derivativeLocalAdmin,
			sessions;

		explicitAdmins = fullAjax(
			"MATCH (a)-[b:AdminTo]->(c:Computer {name:'{}'}) RETURN count(a)".format(payload),
			function(json){
				this.setState({explicitAdmins: json.results[0].data[0].row[0]})	
			}.bind(this))

		unrolledAdmins = fullAjax(
			"MATCH (n:User),(target:Computer {name:'{}'}), p=allShortestPaths((n)-[:AdminTo|MemberOf*1..]->(target)) WITH nodes(p) AS y RETURN count(distinct(filter(x in y WHERE labels(x)[0] = 'User')))".format(payload),
			function(json){
				this.setState({unrolledAdmins: json.results[0].data[0].row[0]})	
			}.bind(this))

		firstDegreeLocalAdmin = fullAjax(
			"MATCH (n:Computer {name:'{}'}), (m:Computer), (n)-[r:AdminTo]-(m) RETURN count(m)".format(payload),
			function(json){
				this.setState({firstDegreeLocalAdmin: json.results[0].data[0].row[0]})
			}.bind(this))

		groupDelegatedLocalAdmin = fullAjax(
			"MATCH (n:Computer {name:'{}'}), (m:Group), x=allShortestPaths((n)-[r:MemberOf*1..]->(m)) WITH n,m,r MATCH (m)-[s:AdminTo*1..]->(p:Computer) RETURN count(distinct(p))".format(payload),
			function(json){
				this.setState({groupDelegatedLocalAdmin: json.results[0].data[0].row[0]})
			}.bind(this))

		derivativeLocalAdmin = fullAjax(
			"MATCH (n:Computer {name:'{}'}), (m:Computer), p=allShortestPaths((n)-[r*1..]->(m)) RETURN count(distinct(m))".format(payload),
			function(json){
				this.setState({derivativeLocalAdmin: json.results[0].data[0].row[0]})
			}.bind(this))

		firstDegreeGroupMembership = fullAjax(
			"MATCH (n:Computer {name:'{}'}),(target:Group), (n)-[r:MemberOf]->(target) RETURN count(target)".format(payload),
			function(json){
				this.setState({firstDegreeGroupMembership: json.results[0].data[0].row[0]})	
			}.bind(this))

		unrolledGroupMembership = fullAjax(
			"MATCH (n:Computer {name:'{}'}), (target:Group), (n)-[r:MemberOf]->(target) RETURN count(target)".format(payload),
			function(json){
				this.setState({unrolledGroupMembership: json.results[0].data[0].row[0]})	
			}.bind(this))

		sessions = fullAjax(
			"MATCH (m:Computer {name:'{}'})-[r:HasSession]->(n:User) WITH n,r,m WHERE NOT n.name ENDS WITH '$' RETURN count(r)".format(payload),
			function(json){
				this.setState({sessions: json.results[0].data[0].row[0]})	
			}.bind(this))

		$.ajax(explicitAdmins);
		$.ajax(unrolledAdmins);
		$.ajax(firstDegreeLocalAdmin);
		$.ajax(groupDelegatedLocalAdmin);
		$.ajax(derivativeLocalAdmin);
		$.ajax(firstDegreeGroupMembership);
		$.ajax(unrolledGroupMembership);
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
						OS
					</dt>
					<dd>
						{this.state.os}
					</dd>
					<dt>
						Allows Unconstrained Delegation
					</dt>
					<dd>
						{this.state.unconstrained}
					</dd>
					<br />
					<dt>
						Explicit Admins
					</dt>
					<dd>
						<NodeALink 
							ready={this.state.explicitAdmins !== -1}
							value={this.state.explicitAdmins}
							click={function(){
								emitter.emit('query',
									"MATCH (n)-[r:AdminTo]->(m:Computer {name:'{}'}) RETURN n,r,m".format(this.state.label))
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Admins
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledAdmins !== -1}
							value={this.state.unrolledAdmins}
							click={function(){
								emitter.emit('query',
									"MATCH (n:User),(m:Computer {name:'{}'}), p=allShortestPaths((n)-[:AdminTo|MemberOf*1..]->(m)) RETURN p".format(this.state.label), this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						First Degree Group Membership
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeGroupMembership !== -1}
							value={this.state.firstDegreeGroupMembership}
							click={function(){
								emitter.emit('query',
									"MATCH (n:Computer {name:'{}'}),(m:Group), (n)-[r:MemberOf]->(m) RETURN n,r,m".format(this.state.label), this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Group Membership
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledGroupMembership !== -1}
							value={this.state.unrolledGroupMembership}
							click={function(){
								emitter.emit('query',
									"MATCH (n:Computer {name:'{}'}), (m:Group),p=allShortestPaths((n)-[:MemberOf*1..]->(m)) RETURN p".format(this.state.label), this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						First Degree Local Admin
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeLocalAdmin !== -1}
							value={this.state.firstDegreeLocalAdmin}
							click={function(){
								emitter.emit('query',
									"MATCH (n:Computer {name:'{}'}), (m:Computer), p=allShortestPaths((n)-[r:MemberOf|AdminTo]->(m)) RETURN p".format(this.state.label), this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Group Delegated Local Admin
					</dt>
					<dd>
						<NodeALink
							ready={this.state.groupDelegatedLocalAdmin !== -1}
							value={this.state.groupDelegatedLocalAdmin}
							click={function(){
								emitter.emit('query',
									"MATCH (n:Computer {name:'{}'}), (m:Group), x=allShortestPaths((n)-[r:MemberOf*1..]->(m)) WITH n,m,r MATCH (m)-[s:AdminTo*1..]->(p:Computer) RETURN n,m,r,s,p".format(this.state.label), this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Derivative Local Admin
					</dt>
					<dd>
						<NodeALink
							ready={this.state.derivativeLocalAdmin !== -1}
							value={this.state.derivativeLocalAdmin}
							click={function(){
								emitter.emit('query',
									"MATCH (n:Computer {name:'{}'}), (m:Computer), p=allShortestPaths((n)-[r*1..]->(m)) RETURN p".format(this.state.label), this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Sessions
					</dt>
					<dd>
						<NodeALink
							ready={this.state.sessions !== -1}
							value={this.state.sessions}
							click={function(){
								emitter.emit('query',
									"MATCH (m:Computer {name:'{}'})-[r:HasSession]->(n:User) WITH n,r,m WHERE NOT n.name ENDS WITH '$' RETURN n,r,m".format(this.state.label))
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}
