import React, { Component } from 'react';
import NodeALink from './NodeALink'

export default class GroupNodeData extends Component {
	propTypes: {
		visible : React.PropTypes.bool.isRequired
	}

	constructor(){
		super();

		this.state = {
			label: "",
			directMembers: -1,
			unrolledMembers: -1,
			directAdminTo: -1,
			derivativeAdminTo: -1,
			unrolledMemberOf: -1,
			sessions: -1,
			foreignGroupMembership: -1
		}

		emitter.on('groupNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		this.setState({
			label: payload,
			directMembers: -1,
			unrolledMembers: -1,
			directAdminTo: -1,
			derivativeAdminTo: -1,
			unrolledMemberOf: -1,
			sessions: -1,
			foreignGroupMembership: -1
		})

		var domain = '@' + payload.split('@').last()
		var s1 = driver.session()
		var s2 = driver.session()
		var s3 = driver.session()
		var s4 = driver.session()
		var s5 = driver.session()
		var s6 = driver.session()
		var s7 = driver.session()

		s1.run("MATCH (a)-[b:MemberOf]->(c:Group {name:{name}}) RETURN count(a)", {name:payload})
			.then(function(result){
				this.setState({'directMembers':result.records[0]._fields[0].low})
				s1.close()
			}.bind(this))

		s2.run("MATCH p = (n)-[r:MemberOf*1..]->(g:Group {name:{name}}) RETURN COUNT(n)", {name:payload})
			.then(function(result){
				this.setState({'unrolledMembers':result.records[0]._fields[0].low})
				s2.close()
			}.bind(this))

		s3.run("MATCH (n:Group {name:{name}})-[r:AdminTo]->(m:Computer) RETURN count(distinct(m))", {name:payload})
			.then(function(result){
				this.setState({'directAdminTo':result.records[0]._fields[0].low})
				s3.close()
			}.bind(this))

		s4.run("MATCH p = shortestPath((g:Group {name:{name}})-[r:MemberOf|AdminTo|HasSession*1..]->(c:Computer)) RETURN COUNT(DISTINCT(c))", {name:payload})
			.then(function(result){
				this.setState({'derivativeAdminTo':result.records[0]._fields[0].low})
				s4.close()
			}.bind(this))

		s5.run("MATCH p = (g1:Group {name:{name}})-[r:MemberOf*1..]->(g2:Group) RETURN COUNT(DISTINCT(g2))", {name:payload})
			.then(function(result){
				this.setState({'unrolledMemberOf':result.records[0]._fields[0].low})
				s5.close()
			}.bind(this))

		s6.run("MATCH p = (c:Computer)-[r1:HasSession]->(u:User)-[r2:MemberOf*1..]->(g:Group {name: {name}}) RETURN COUNT(r1)", {name:payload})
			.then(function(result){
				this.setState({'sessions':result.records[0]._fields[0].low})
				s6.close()
			}.bind(this))

		s7.run("MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:Group {name:{name}}) MATCH (m)-[r:MemberOf]->(n) RETURN count(n)", {name:payload, domain:domain})
			.then(function(result){
				this.setState({'foreignGroupMembership':result.records[0]._fields[0].low})
				s7.close()
			}.bind(this))
	}

	render() {
		var domain = '@' + this.state.label.split('@')
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
						Direct Members
					</dt>
					<dd>
						<NodeALink 
							ready={this.state.directMembers !== -1}
							value={this.state.directMembers}
							click={function(){
								emitter.emit('query', "MATCH (n)-[r:MemberOf]->(m:Group {name:{name}}) RETURN n,r,m", {name: this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Members
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledMembers !== -1}
							value={this.state.unrolledMembers}
							click={function(){
								emitter.emit('query', "MATCH p = (n)-[r:MemberOf*1..]->(g:Group {name:{name}}) RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						Direct Admin To
					</dt>
					<dd>
						<NodeALink
							ready={this.state.directAdminTo !== -1}
							value={this.state.directAdminTo}
							click={function(){
								emitter.emit('query', "MATCH p=(g:Group {name:{name}})-[r:AdminTo]->(c:Computer) RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						Derivative Admin To
					</dt>
					<dd>
						<NodeALink
							ready={this.state.derivativeAdminTo !== -1}
							value={this.state.derivativeAdminTo}
							click={function(){
								emitter.emit('query', "MATCH p = shortestPath((g:Group {name:{name}})-[r:MemberOf|AdminTo|HasSession*1..]->(c:Computer)) RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Unrolled Member Of
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledMemberOf !== -1}
							value={this.state.unrolledMemberOf}
							click={function(){
								emitter.emit('query', "MATCH p = (g1:Group {name:{name}})-[r:MemberOf*1..]->(g2:Group) RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Foreign Group Membership
					</dt>
					<dd>
						<NodeALink
							ready={this.state.foreignGroupMembership !== -1}
							value={this.state.foreignGroupMembership}
							click={function(){
								emitter.emit('query', "MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:Group {name:{name}}) MATCH (m)-[r:MemberOf]->(n) RETURN m,r,n", {name: this.state.label, domain: domain})
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
								emitter.emit('query', "MATCH p = (c:Computer)-[r1:HasSession]->(u:User)-[r2:MemberOf*1..]->(g:Group {name: {name}}) RETURN p", {name: this.state.label},
									"",this.state.label)
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}