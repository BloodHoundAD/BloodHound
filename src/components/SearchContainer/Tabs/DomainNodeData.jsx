import React, { Component } from 'react';
import NodeALink from './NodeALink.jsx'
import LoadLabel from './LoadLabel.jsx'
import { fullAjax } from 'utils'

export default class DomainNodeData extends Component {
	propTypes: {
		visible : React.PropTypes.bool.isRequired
	}

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
			session: driver.session()
		}

		emitter.on('domainNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
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

		var session = this.state.session

		session.run("MATCH (a:User) WHERE a.name ENDS WITH ('@' + {name}) RETURN COUNT(a)", {name:payload})
			.then(function(result){
				this.setState({'users':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH (a:Group) WHERE a.name ENDS WITH ('@' + {name}) RETURN COUNT(a)", {name:payload})
			.then(function(result){
				this.setState({'groups':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH (n:Computer) WHERE n.name ENDS WITH {name} WITH n WHERE size(split(n.name,'.')) - size(split('{}}','.')) = 1 RETURN count(n)", {name:payload})
			.then(function(result){
				this.setState({'computers':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH (a:Group) WHERE NOT a.name ENDS WITH ('@' + {name}) WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + {name}) WITH a,b MATCH (a)-[r:MemberOf]->(b) RETURN count(a)", {name:payload})
			.then(function(result){
				this.setState({'foreignGroups':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH (a:User) WHERE NOT a.name ENDS WITH ('@' + {name}) WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + {name}) WITH a,b MATCH (a)-[r:MemberOf]->(b) RETURN count(a)", {name:payload})
			.then(function(result){
				this.setState({'foreignUsers':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH (a:Domain {name:{name}})<-[r:TrustedBy]-(b:Domain) RETURN count(b)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeInboundTrusts':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH (a:Domain {name:{name}})-[r:TrustedBy]->(b:Domain) RETURN count(b)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeOutboundTrusts':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH (a:Domain {name:{name}})<-[r:TrustedBy*1..]-(b:Domain) RETURN count(b)", {name:payload})
			.then(function(result){
				this.setState({'effectiveInboundTrusts':result.records[0]._fields[0].low})
			}.bind(this))

		session.run("MATCH (a:Domain {name:{name}})-[r:TrustedBy*1..]->(b:Domain) RETURN count(b)", {name:payload})
			.then(function(result){
				this.setState({'effectiveOutboundTrusts':result.records[0]._fields[0].low})
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
								emitter.emit('query', "MATCH (a:User) WHERE NOT a.name ENDS WITH ('@' + '{}') WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + '{}') WITH a,b MATCH (a)-[r:MemberOf]-(b) RETURN a,r,b".formatAll(this.state.label))
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
								emitter.emit('query', "MATCH (a:Group) WHERE NOT a.name ENDS WITH ('@' + '{}') WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + '{}') WITH a,b MATCH (a)-[r:MemberOf]-(b) RETURN a,r,b".formatAll(this.state.label))
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
								emitter.emit('query', "MATCH (a:Domain {name:'{}'})<-[r:TrustedBy]-(b:Domain) RETURN a,r,b".formatAll(this.state.label))
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
								emitter.emit('query', "MATCH (a:Domain {name:'{}'})<-[r:TrustedBy*1..]-(b:Domain) RETURN a,r,b".formatAll(this.state.label))
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
								emitter.emit('query', "MATCH (a:Domain {name:'{}'})-[r:TrustedBy]->(b:Domain) RETURN a,r,b".formatAll(this.state.label))
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
								emitter.emit('query', "MATCH (a:Domain {name:'{}'})-[r:TrustedBy*1..]->(b:Domain) RETURN a,r,b".formatAll(this.state.label))
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}
