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
			effectiveInboundTrusts: -1
		}

		emitter.on('domainNodeClicked', this.getNodeData.bind(this));
	}

	getNodeData(payload){
		this.state = {
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
		}

		var users,
		groups,
		computers,
		foreignGroups,
		foreignUsers,
		firstDegreeInboundTrusts,
		firstDegreeOutboundTrusts,
		effectiveInboundTrusts,
		effectiveOutboundTrusts;

		users = fullAjax(
			"MATCH (a:User) WHERE a.name ENDS WITH ('@' + '{}') RETURN COUNT(a)".format(payload),
			function(json){
				this.setState({users: json.results[0].data[0].row[0]})
			}.bind(this))

		groups = fullAjax(
			"MATCH (a:Group) WHERE a.name ENDS WITH ('@' + '{}') RETURN COUNT(a)".format(payload),
			function(json){
				this.setState({groups: json.results[0].data[0].row[0]})
			}.bind(this))

		computers = fullAjax(
			"MATCH (n:Computer) WHERE n.name ENDS WITH '{}' WITH n WHERE size(split(n.name,'.')) - size(split('{}}','.')) = 1 RETURN count(n)".formatAll(payload),
			function(json){
				this.setState({computers: json.results[0].data[0].row[0]})
			}.bind(this))

		foreignGroups = fullAjax(
			"MATCH (a:Group) WHERE NOT a.name ENDS WITH ('@' + '{}') WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + '{}') WITH a,b MATCH (a)-[r:MemberOf]->(b) RETURN count(a)".formatAll(payload),
			function(json){
				this.setState({foreignGroups: json.results[0].data[0].row[0]})
			}.bind(this))

		foreignUsers = fullAjax(
			"MATCH (a:User) WHERE NOT a.name ENDS WITH ('@' + '{}') WITH a MATCH (b:Group) WHERE b.name ENDS WITH ('@' + '{}') WITH a,b MATCH (a)-[r:MemberOf]->(b) RETURN count(a)".formatAll(payload),
			function(json){
				this.setState({foreignUsers: json.results[0].data[0].row[0]})
			}.bind(this))

		firstDegreeInboundTrusts = fullAjax(
			"MATCH (a:Domain {name:'{}'})<-[r:TrustedBy]-(b:Domain) RETURN count(b)".format(payload),
			function(json){
				this.setState({firstDegreeInboundTrusts: json.results[0].data[0].row[0]})
			}.bind(this))

		firstDegreeOutboundTrusts = fullAjax(
			"MATCH (a:Domain {name:'{}'})-[r:TrustedBy]->(b:Domain) RETURN count(b)".format(payload),
			function(json){
				this.setState({firstDegreeOutboundTrusts: json.results[0].data[0].row[0]})
			}.bind(this))

		effectiveInboundTrusts = fullAjax(
			"MATCH (a:Domain {name:'{}'})<-[r:TrustedBy*1..]-(b:Domain) RETURN count(b)".format(payload),
			function(json){
				this.setState({effectiveInboundTrusts: json.results[0].data[0].row[0]})
			}.bind(this))

		effectiveOutboundTrusts = fullAjax(
			"MATCH (a:Domain {name:'{}'})-[r:TrustedBy*1..]->(b:Domain) RETURN count(b)".format(payload),
			function(json){
				this.setState({effectiveOutboundTrusts: json.results[0].data[0].row[0]})
			}.bind(this))

		$.ajax(users)
		$.ajax(groups)
		$.ajax(computers)
		$.ajax(foreignGroups)
		$.ajax(foreignUsers)
		$.ajax(firstDegreeInboundTrusts)
		$.ajax(firstDegreeOutboundTrusts)
		$.ajax(effectiveInboundTrusts)
		$.ajax(effectiveOutboundTrusts)
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
