import React, { Component } from 'react';
import NodeALink from './NodeALink'
import PropTypes from 'prop-types'

export default class GroupNodeData extends Component {
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
			foreignGroupMembership: -1,
			foreignGroupMembers: -1,
			firstDegreeGroupMembership: -1,
			groupDelegatedAdmin: -1,
			firstdegreeControl: -1,
			groupDelegatedControl: -1,
			transitiveControl: -1,
			firstDegreeControllers: -1,
			unrolledControllers: -1,
			transitiveControllers: -1,
			driversessions: []
		}

		emitter.on('groupNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		$.each(this.state.driversessions, function(index, record){
			record.close();
		})

		this.setState({
			label: payload,
			directMembers: -1,
			unrolledMembers: -1,
			directAdminTo: -1,
			derivativeAdminTo: -1,
			unrolledMemberOf: -1,
			sessions: -1,
			foreignGroupMembership: -1,
			foreignGroupMembers: -1,
			firstDegreeGroupMembership: -1,
			groupDelegatedAdmin: -1,
			firstdegreeControl: -1,
			groupDelegatedControl: -1,
			transitiveControl: -1,
			firstDegreeControllers: -1,
			unrolledControllers: -1,
			transitiveControllers: -1
		})

		var domain = '@' + payload.split('@').last()
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
		var s14 = driver.session()
		var s15 = driver.session()
		var s16 = driver.session()

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

		s8.run("MATCH p = (n)-[r:MemberOf*1..]->(g:Group {name:{name}}) WHERE NOT g.domain = n.domain RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'foreignGroupMembers':result.records[0]._fields[0].low})
				s8.close()
			}.bind(this))

		s9.run("MATCH p = (g1:Group {name:{name}})-[r:MemberOf]->(g2:Group) RETURN COUNT(DISTINCT(g2))", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeGroupMembership':result.records[0]._fields[0].low})
				s9.close()
			}.bind(this))

		s10.run("MATCH p = (g1:Group {name:{name}})-[r1:MemberOf*1..]->(g2:Group)-[r2:AdminTo]->(c:Computer) RETURN COUNT(DISTINCT(c))", {name:payload})
			.then(function(result){
				this.setState({'groupDelegatedAdmin':result.records[0]._fields[0].low})
				s10.close()
			}.bind(this))

		s11.run("MATCH p = (g:Group {name:{name}})-[r:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'firstdegreeControl':result.records[0]._fields[0].low})
				s11.close()
			}.bind(this))

		s12.run("MATCH p = (g1:Group {name:{name}})-[r1:MemberOf*1..]->(g2:Group)-[r2:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'groupDelegatedControl':result.records[0]._fields[0].low})
				s12.close()
			}.bind(this))

		s13.run("MATCH p = shortestPath((g:Group {name:{name}})-[r:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(n)) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'transitiveControl':result.records[0]._fields[0].low})
				s13.close()
			}.bind(this))

		s14.run("MATCH p = (n)-[r:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(g:Group {name:{name}}) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeControllers':result.records[0]._fields[0].low})
				s14.close()
			}.bind(this))

		s15.run("MATCH p = (n1)-[r:MemberOf*1..]->(g1:Group)-[r1:AddMembers|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(g2:Group {name: {name}}) WITH LENGTH(p) as pathLength, p, n1 WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = g2.name) AND NOT n1.name = g2.name RETURN COUNT(DISTINCT(n1))", {name:payload})
			.then(function(result){
				this.setState({'unrolledControllers':result.records[0]._fields[0].low})
				s15.close()
			}.bind(this))

		s16.run("MATCH p = shortestPath((n)-[r:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(g:Group {name:{name}})) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'transitiveControllers':result.records[0]._fields[0].low})
				s16.close()
			}.bind(this))
		
		this.setState({'driversessions': [s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,s15,s16]})
	}

	render() {
		var domain = '@' + this.state.label.split('@')
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
					<br />
					<h4>Group Members</h4>
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
					<dt>
						Foreign Members
					</dt>
					<dd>
						<NodeALink
							ready={this.state.foreignGroupMembers !== -1}
							value={this.state.foreignGroupMembers}
							click={function(){
								emitter.emit('query', "MATCH p = (n)-[r:MemberOf*1..]->(g:Group {name:{name}}) WHERE NOT g.domain = n.domain RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<h4>Group Membership</h4>
					<dt>
					    First Degree Group Membership
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeGroupMembership !== -1}
							value={this.state.firstDegreeGroupMembership}
							click={function(){
								emitter.emit('query', "MATCH p = (g1:Group {name:{name}})-[r:MemberOf]->(g2:Group) RETURN p", {name: this.state.label},
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
					<br />
					<h4>Local Admin Rights</h4>
					<dt>
						First Degree Local Admin
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
					<dt>
						Group Delegated Local Admin Rights
					</dt>
					<dd>
						<NodeALink
							ready={this.state.groupDelegatedAdmin !== -1}
							value={this.state.groupDelegatedAdmin}
							click={function(){
								emitter.emit('query', "MATCH p = (g1:Group {name:{name}})-[r1:MemberOf*1..]->(g2:Group)-[r2:AdminTo]->(c:Computer) RETURN p", {name: this.state.label},
									this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
						Derivative Local Admin Rights
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
								emitter.emit('query', "MATCH p = (g:Group {name:{name}})-[r1:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN p", {name:this.state.label})
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
								emitter.emit('query', "MATCH p = (g1:Group {name:{name}})-[r1:MemberOf*1..]->(g2:Group)-[r2:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN p", {name:this.state.label}
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
								emitter.emit('query', "MATCH p = shortestPath((g:Group {name:{name}})-[r1:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(n)) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<h4>Inbound Object Control</h4>
					<dt>
					    Explicit Object Controllers
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeControllers !== -1}
							value={this.state.firstDegreeControllers}
							click={function(){	
								emitter.emit('query', "MATCH p = (n)-[r:AddMembers|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(g:Group {name: {name}}) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
					    Unrolled Object Controllers
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledControllers !== -1}
							value={this.state.unrolledControllers}
							click={function(){	
								emitter.emit('query', "MATCH p = (n1)-[r:MemberOf*1..]->(g1:Group)-[r1:AddMembers|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(g2:Group {name: {name}}) WITH LENGTH(p) as pathLength, p, n1 WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = g2.name) AND NOT n1.name = g2.name RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<dt>
					    Transitive Object Controllers
					</dt>
					<dd>
						<NodeALink
							ready={this.state.transitiveControllers !== -1}
							value={this.state.transitiveControllers}
							click={function(){	
								emitter.emit('query', "MATCH p = shortestPath((n)-[r:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(g:Group {name: {name}})) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}

GroupNodeData.propTypes = {
	visible : React.PropTypes.bool.isRequired
}