import React, { Component } from 'react';
import NodeALink from './NodeALink'
import PropTypes from 'prop-types'

export default class ComputerNodeData extends Component {
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
			sessions: -1,
			firstdegreeControl: -1,
			groupDelegatedControl: -1,
			transitiveControl: -1,
			derivativeLocalAdmins: -1,
			driversessions: []
		}

		emitter.on('computerNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		$.each(this.state.driversessions, function(index, record){
			record.close();
		})
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
			derivativeLocalAdmin: -1,
			firstdegreeControl: -1,
			groupDelegatedControl: -1,
			transitiveControl: -1,
			derivativeLocalAdmins: -1
		})

		var s1 = driver.session()
		var s2 = driver.session()
		var s3 = driver.session()
		var s4 = driver.session()
		var s5 = driver.session()
		var s6 = driver.session()
		var s7 = driver.session()
		var s8 = driver.session()
		var s9 = driver.session()
		var s10 = driver.session()
		var s11 = driver.session()
		var s12 = driver.session()
		var s13 = driver.session()

		s1.run("MATCH (a)-[b:AdminTo]->(c:Computer {name:{name}}) RETURN count(a)", {name:payload})
			.then(function(result){
				this.setState({'explicitAdmins':result.records[0]._fields[0].low})
				s1.close()
			}.bind(this))

		s2.run("MATCH p=(n:User)-[r:MemberOf|AdminTo*1..]->(m:Computer {name:{name}}) RETURN count(distinct(n))", {name:payload})
			.then(function(result){
				this.setState({'unrolledAdmins':result.records[0]._fields[0].low})
				s2.close()
			}.bind(this))

		s3.run("MATCH (m:Computer {name:{name}}), (n:Computer), (m)-[r:AdminTo]->(n) RETURN count(distinct(m))", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeLocalAdmin':result.records[0]._fields[0].low})
				s3.close()
			}.bind(this))

		s4.run("MATCH p=(n:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(c2:Computer) RETURN count(c2)", {name:payload})
			.then(function(result){
				this.setState({'groupDelegatedLocalAdmin':result.records[0]._fields[0].low})
				s4.close()
			}.bind(this))

		s5.run("MATCH (n:Computer {name:{name}}), (m:Computer), p=shortestPath((n)-[r:AdminTo|MemberOf*1..]->(m)) RETURN count(distinct(m))", {name:payload})
			.then(function(result){
				this.setState({'derivativeLocalAdmin':result.records[0]._fields[0].low})
				s5.close()
			}.bind(this))

		s6.run("MATCH (n:Computer {name:{name}}),(target:Group), (n)-[r:MemberOf]->(target) RETURN count(target)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeGroupMembership':result.records[0]._fields[0].low})
				s6.close()
			}.bind(this))

		s7.run("MATCH p = (c:Computer {name:{name}})-[r:MemberOf*1..]->(g:Group) RETURN COUNT(DISTINCT(g))", {name:payload})
			.then(function(result){
				this.setState({'unrolledGroupMembership':result.records[0]._fields[0].low})
				s7.close()
			}.bind(this))

		s8.run("MATCH (m:Computer {name:{name}})-[r:HasSession]->(n:User) WITH n,r,m WHERE NOT n.name ENDS WITH '$' RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'sessions':result.records[0]._fields[0].low})
				s8.close()
			}.bind(this))

		s9.run("MATCH p = shortestPath((n)-[r:AdminTo|MemberOf|HasSession*1..]->(m:Computer {name:{name}})) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'derivativeLocalAdmins':result.records[0]._fields[0].low})
				s9.close()
			}.bind(this))

		s10.run("MATCH p = (c:Computer {name:{name}})-[r:MemberOf*1..]->(g:Group) WHERE NOT g.domain = c.domain RETURN COUNT(DISTINCT(g))", {name:payload})
			.then(function(result){
				this.setState({'foreignGroupMembership':result.records[0]._fields[0].low})
				s10.close()
			}.bind(this))

		s11.run("MATCH p = (c:Computer {name:{name}})-[r:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'firstdegreeControl':result.records[0]._fields[0].low})
				s11.close()
			}.bind(this))

		s12.run("MATCH p = (c:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'groupDelegatedControl':result.records[0]._fields[0].low})
				s12.close()
			}.bind(this))

		s13.run("MATCH p = shortestPath((c:Computer {name:{name}})-[r:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(n)) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'transitiveControl':result.records[0]._fields[0].low})
				s13.close()
			}.bind(this))
		
		this.setState({'driversessions': [s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13]})
	}

	render() {
		return (
			<div className={this.props.visible ? "" : "displaynone"}>
				<dl className='dl-horizontal'>
					<h4>Node Info</h4>
					<dt>
						Name
					</dt>
					<dd>
						{this.state.label}
					</dd>
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
					<br />
					<h4>Local Admins</h4>
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
									"MATCH p = (n:User)-[r:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(c:Computer {name:{name}}) RETURN p",
									{name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
					    Derivative Local Admins
					</dt>
					<dd>
						<NodeALink
							ready={this.state.derivativeLocalAdmins !== -1}
							value={this.state.derivativeLocalAdmins}
							click={function(){
								emitter.emit('query',
									"MATCH p = shortestPath((n)-[r:AdminTo|MemberOf|HasSession*1..]->(m:Computer {name:{name}})) RETURN p",{name: this.state.label}, this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<h4>Group Memberships</h4>
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
									"MATCH p = (n:Computer {name:{name}})-[r:MemberOf*1..]->(m:Group) RETURN p",{name: this.state.label}, this.state.label)
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
								emitter.emit('query',
									"MATCH p = (c:Computer {name:{name}})-[r:MemberOf*1..]->(g:Group) WHERE NOT g.domain = c.domain RETURN p",{name: this.state.label}, this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<h4>Local Admin Rights</h4>
					<dt>
						First Degree Local Admin
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeLocalAdmin !== -1}
							value={this.state.firstDegreeLocalAdmin}
							click={function(){
								emitter.emit('query',
									"MATCH (n:Computer {name:{name}}), (m:Computer), p=(n)-[r:AdminTo]->(m) RETURN p",{name: this.state.label}, this.state.label)
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
									"MATCH p=(n:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(m:Computer) RETURN p",{name: this.state.label}, this.state.label)
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
									"MATCH p = shortestPath((c1:Computer {name:'OFLEX01P002.CENTENE.COM'})-[r:AdminTo|MemberOf|HasSession*1..]->(c:Computer)) RETURN p",{name: this.state.label}, this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<h4>Outbound Object Control</h4>
					<dt>
						First Degree Object Control
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstdegreeControl !== -1}
							value={this.state.firstdegreeControl}
							click={function(){
								emitter.emit('query', "MATCH p = (c:Computer {name:{name}})-[r1:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN p", {name:this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Group Delegated Object Control
					</dt>
					<dd>
						<NodeALink
							ready={this.state.groupDelegatedControl !== -1}
							value={this.state.groupDelegatedControl}
							click={function(){
								emitter.emit('query', "MATCH p = (c:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Transitive Object Control
					</dt>
					<dd>
						<NodeALink
							ready={this.state.transitiveControl !== -1}
							value={this.state.transitiveControl}
							click={function(){	
								emitter.emit('query', "MATCH p = shortestPath((c:Computer {name:{name}})-[r1:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(n)) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}

ComputerNodeData.propTypes= {
	visible : React.PropTypes.bool.isRequired
}