import React, { Component } from 'react';
import NodeALink from './NodeALink.jsx'
import LoadLabel from './LoadLabel.jsx'
import PropTypes from 'prop-types'

export default class DomainNodeData extends Component {
	constructor(){
		super();

		this.state = {
			label: "",
			users: -1,
			groups: -1,
			computers: -1,
			foreignGroups: -1,
			foreignUsers: -1,
			firstDegreeOutboundTrusts: -1,
			effectiveOutboundTrusts: -1,
			firstDegreeInboundTrusts: -1,
			effectiveInboundTrusts: -1,
			driversessions: []
		}

		emitter.on('domainNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		$.each(this.state.driversessions, function(index, record){
			record.close();
		})
		this.setState({
			label: payload,
			users: -1,
			groups: -1,
			computers: -1,
			foreignGroups: -1,
			foreignUsers: -1,
			firstDegreeOutboundTrusts: -1,
			effectiveOutboundTrusts: -1,
			firstDegreeInboundTrusts: -1,
			effectiveInboundTrusts: -1
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

		s1.run("MATCH (a:User) WHERE a.name ENDS WITH ('@' + {name}) RETURN COUNT(a)", {name:payload})
			.then(function(result){
				this.setState({'users':result.records[0]._fields[0].low})
				s1.close()
			}.bind(this))

		s2.run("MATCH (a:Group) WHERE a.name ENDS WITH ('@' + {name}) RETURN COUNT(a)", {name:payload})
			.then(function(result){
				this.setState({'groups':result.records[0]._fields[0].low})
				s2.close()
			}.bind(this))

		s3.run("MATCH (n:Computer) WHERE n.name ENDS WITH {name} WITH n WHERE size(split(n.name,'.')) - size(split({name},'.')) = 1 RETURN count(n)", {name:payload})
			.then(function(result){
				this.setState({'computers':result.records[0]._fields[0].low})
				s3.close()
			}.bind(this))

		s4.run("MATCH (a:Group) WHERE NOT a.name ENDS WITH ('@' + {name}) WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + {name}) WITH a,b MATCH (a)-[r:MemberOf]->(b) RETURN count(a)", {name:payload})
			.then(function(result){
				this.setState({'foreignGroups':result.records[0]._fields[0].low})
				s4.close()
			}.bind(this))

		s5.run("MATCH (a:User) WHERE NOT a.name ENDS WITH ('@' + {name}) WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + {name}) WITH a,b MATCH (a)-[r:MemberOf]->(b) RETURN count(a)", {name:payload})
			.then(function(result){
				this.setState({'foreignUsers':result.records[0]._fields[0].low})
				s5.close()
			}.bind(this))

		s6.run("MATCH (a:Domain {name:{name}})<-[r:TrustedBy]-(b:Domain) RETURN count(b)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeInboundTrusts':result.records[0]._fields[0].low})
				s6.close()
			}.bind(this))

		s7.run("MATCH (a:Domain {name:{name}})-[r:TrustedBy]->(b:Domain) RETURN count(b)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeOutboundTrusts':result.records[0]._fields[0].low})
				s7.close()
			}.bind(this))

		s8.run("MATCH p=shortestPath((a:Domain {name:{name}})<-[r:TrustedBy*1..]-(b:Domain)) RETURN count(b)", {name:payload})
			.then(function(result){
				this.setState({'effectiveInboundTrusts':result.records[0]._fields[0].low})
				s8.close()
			}.bind(this))

		s9.run("MATCH p=shortestPath((a:Domain {name:{name}})-[r:TrustedBy*1..]->(b:Domain)) RETURN count(b)", {name:payload})
			.then(function(result){
				this.setState({'effectiveOutboundTrusts':result.records[0]._fields[0].low})
				s9.close()
			}.bind(this))
		
		this.setState({'driversessions': [s1,s2,s3,s4,s5,s6,s7,s8,s9]})
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
						Users
					</dt>
					<dd>
						<LoadLabel
							ready={this.state.users !== -1}
							value={this.state.users} />
					</dd>
					<dt>
						Groups
					</dt>
					<dd>
						<LoadLabel
							ready={this.state.groups !== -1}
							value={this.state.groups} />
					</dd>
					<dt>
						Computers
					</dt>
					<dd>
						<LoadLabel
							ready={this.state.computers !== -1}
							value={this.state.computers} />
					</dd>
					<br />
					<dt>
						Foreign Users
					</dt>
					<dd>
						<NodeALink
							ready={this.state.foreignUsers !== -1}
							value={this.state.foreignUsers}
							click={function(){
								emitter.emit('query', "MATCH (a:User) WHERE NOT a.name ENDS WITH ('@' + {domain}) WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + {domain}) WITH a,b MATCH (a)-[r:MemberOf]-(b) RETURN a,r,b", {domain: this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Foreign Groups
					</dt>
					<dd>
						<NodeALink
							ready={this.state.foreignGroups !== -1}
							value={this.state.foreignGroups}
							click={function(){
								emitter.emit('query', "MATCH (a:Group) WHERE NOT a.name ENDS WITH ('@' + {domain}) WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + {domain}) WITH a,b MATCH (a)-[r:MemberOf]-(b) RETURN a,r,b", {domain: this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Foreign Admins
					</dt>
					<dd>
						<NodeALink
							ready={this.state.foreignAdmins !== -1}
							value={this.state.foreignAdmins}
							click={function(){
								emitter.emit('query', "MATCH (a:Group) WHERE NOT a.name ENDS WITH ('@' + {domain}) WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + {domain}) WITH a,b MATCH (a)-[r:MemberOf]-(b) RETURN a,r,b", {domain: this.state.label})
							}.bind(this)} />
					</dd>
					<br />
					<dt>
						Inbound Trusts
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeInboundTrusts !== -1}
							value={this.state.firstDegreeInboundTrusts}
							click={function(){
								emitter.emit('query', "MATCH (a:Domain {name:{domain}})<-[r:TrustedBy]-(b:Domain) RETURN a,r,b", {domain: this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Effective Inbound Trusts
					</dt>
					<dd>
						<NodeALink
							ready={this.state.effectiveInboundTrusts !== -1}
							value={this.state.effectiveInboundTrusts}
							click={function(){
								emitter.emit('query', "MATCH p=shortestPath((a:Domain {name:{domain}})<-[r:TrustedBy*1..]-(b:Domain)) RETURN p", {domain: this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Outbound Trusts
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeOutboundTrusts !== -1}
							value={this.state.firstDegreeOutboundTrusts}
							click={function(){
								emitter.emit('query', "MATCH (a:Domain {name:{domain}})-[r:TrustedBy]->(b:Domain) RETURN a,r,b", {domain: this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Effective Outbound Trusts
					</dt>
					<dd>
						<NodeALink
							ready={this.state.effectiveOutboundTrusts !== -1}
							value={this.state.effectiveOutboundTrusts}
							click={function(){
								emitter.emit('query', "MATCH p=shortestPath((a:Domain {name:{domain}})-[r:TrustedBy*1..]->(b:Domain)) RETURN p", {domain: this.state.label})
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}

DomainNodeData.propTypes = {
	visible : React.PropTypes.bool.isRequired
}