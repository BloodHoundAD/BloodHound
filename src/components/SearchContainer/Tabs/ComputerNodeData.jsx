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

		var s1 = driver.session()
		var s2 = driver.session()
		var s3 = driver.session()
		var s4 = driver.session()
		var s5 = driver.session()
		var s6 = driver.session()
		var s7 = driver.session()
		var s8 = driver.session()

		s1.run("MATCH (a)-[b:AdminTo]->(c:Computer {name:{name}}) RETURN count(a)", {name:payload})
			.then(function(result){
				this.setState({'explicitAdmins':result.records[0]._fields[0].low})
				s1.close()
			}.bind(this))

		s2.run("MATCH p=shortestPath((n:User)-[r*1..]->(m:Computer {name:{name}})) WHERE NONE(rel in r WHERE type(rel)='HasSession') RETURN count(m)", {name:payload})
			.then(function(result){
				this.setState({'unrolledAdmins':result.records[0]._fields[0].low})
				s2.close()
			}.bind(this))

		s3.run("MATCH (n:Computer {name:{name}}), (m:Computer), (n)-[r:AdminTo]-(m) RETURN count(m)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeLocalAdmin':result.records[0]._fields[0].low})
				s3.close()
			}.bind(this))

		s4.run("MATCH p=shortestPath((n:Computer {name:{name}})-[r*1..]->(m:Computer)) WHERE NONE(rel in rels(p) WHERE type(rel)='HasSession') WITH p WHERE ANY(rel in rels(p) WHERE type(rel)='MemberOf') RETURN count(p)", {name:payload})
			.then(function(result){
				this.setState({'groupDelegatedLocalAdmin':result.records[0]._fields[0].low})
				s4.close()
			}.bind(this))

		s5.run("MATCH (n:Computer {name:{name}}), (m:Computer), p=shortestPath((n)-[r*1..]->(m)) RETURN count(p)", {name:payload})
			.then(function(result){
				this.setState({'derivativeLocalAdmin':result.records[0]._fields[0].low})
				s5.close()
			}.bind(this))

		s6.run("MATCH (n:Computer {name:{name}}),(target:Group), (n)-[r:MemberOf]->(target) RETURN count(target)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeGroupMembership':result.records[0]._fields[0].low})
				s6.close()
			}.bind(this))

		s7.run("MATCH (n:Computer {name:{name}}), (target:Group), (n)-[r:MemberOf]->(target) RETURN count(target)", {name:payload})
			.then(function(result){
				this.setState({'unrolledGroupMembership':result.records[0]._fields[0].low})
				s7.close()
			}.bind(this))

		s8.run("MATCH (m:Computer {name:{name}})-[r:HasSession]->(n:User) WITH n,r,m WHERE NOT n.name ENDS WITH '$' RETURN count(r)", {name:payload})
			.then(function(result){
				this.setState({'sessions':result.records[0]._fields[0].low})
				s8.close()
			}.bind(this))
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
									"MATCH (n)-[r:AdminTo]->(m:Computer {name:{name}}) RETURN n,r,m",{name: this.state.label})
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
									"MATCH (n:User),(m:Computer {name:{name}}), p=allShortestPaths((n)-[:AdminTo|MemberOf*1..]->(m)) RETURN p",
									{name: this.state.label},
									this.state.label)
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
									"MATCH (n:Computer {name:{name}}),(m:Group), (n)-[r:MemberOf]->(m) RETURN n,r,m",{name: this.state.label}, this.state.label)
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
									"MATCH (n:Computer {name:{name}}), (m:Group),p=allShortestPaths((n)-[:MemberOf*1..]->(m)) RETURN p",{name: this.state.label}, this.state.label)
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
									"MATCH (n:Computer {name:{name}}), (m:Computer), p=shortestPath((n)-[r:MemberOf|AdminTo]->(m)) RETURN p",{name: this.state.label}, this.state.label)
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
									"MATCH p=shortestPath((n:Computer {name:{name}})-[r*1..]->(m:Computer)) WHERE NONE(rel in rels(p) WHERE type(rel)='HasSession') WITH p WHERE ANY(rel in rels(p) WHERE type(rel)='MemberOf') RETURN p",{name: this.state.label}, this.state.label)
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
									"MATCH (n:Computer {name:{name}}), (m:Computer), p=shortestPath((n)-[r*1..]->(m)) RETURN p",{name: this.state.label}, this.state.label)
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
									"MATCH (m:Computer {name:{name}})-[r:HasSession]->(n:User) WITH n,r,m WHERE NOT n.name ENDS WITH '$' RETURN n,r,m", {name: this.state.label})
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}
