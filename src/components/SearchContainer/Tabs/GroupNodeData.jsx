import React, { Component } from 'react';
import NodeALink from './nodealink'
import { fullAjax } from 'utils';

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
			sessions: -1
		}

		emitter.on('groupNodeClicked', this.getNodeData.bind(this));
	}

	placeholder(){

	}

	getNodeData(payload){
		this.setState({
			label: payload,
			directMembers: -1,
			unrolledMembers: -1,
			directAdminTo: -1,
			derivativeAdminTo: -1,
			unrolledMemberOf: -1,
			sessions: -1
		})

		var directMembers, 
			unrolledMembers, 
			directAdminTo,
			derivativeAdminTo,
			unrolledMemberOf,
			sessions;

		directMembers = fullAjax(
			"MATCH (a)-[b:MemberOf]->(c:Group {name:'{}'}) RETURN count(a)".format(payload),
			function(json){
				this.setState({directMembers: json.results[0].data[0].row[0]})	
			}.bind(this))

		unrolledMembers = fullAjax(
			"MATCH (n:User), (m:Group {name:'{}'}), p=allShortestPaths((n)-[:MemberOf*1..]->(m)) WITH nodes(p) AS y RETURN count(distinct(filter(x in y WHERE labels(x)[0] = 'User')))".format(payload),
			function(json){
				this.setState({unrolledMembers: json.results[0].data[0].row[0]})	
			}.bind(this))

		directAdminTo = fullAjax(
			"MATCH (n:Group {name:'{}'})-[r:AdminTo]->(m:Computer) RETURN count(distinct(m))".format(payload),
			function(json){
				this.setState({directAdminTo: json.results[0].data[0].row[0]})	
			}.bind(this))

		derivativeAdminTo = fullAjax(
			"MATCH (n:Group {name:'{}'}), (target:Computer), p=allShortestPaths((n)-[*]->(target)) RETURN count(distinct(target))".format(payload),
			function(json){
				this.setState({derivativeAdminTo: json.results[0].data[0].row[0]})	
			}.bind(this))

		unrolledMemberOf = fullAjax(
			"MATCH (n:Group {name:'{}'}), (target:Group), p=allShortestPaths((n)-[r:MemberOf*1..]->(target)) RETURN count(target)".format(payload),
			function(json){
				this.setState({unrolledMemberOf: json.results[0].data[0].row[0]})	
			}.bind(this))

		sessions = fullAjax(
			"MATCH (n:User), (m:Group {name:'{}'}), p=allShortestPaths((n)-[r:MemberOf*1..]->(m)) WITH n,m,r MATCH (n)-[s:HasSession]-(o:Computer) RETURN count(s)".format(payload),
			function(json){
				this.setState({sessions: json.results[0].data[0].row[0]})	
			}.bind(this))

		$.ajax(directMembers);
		$.ajax(unrolledMembers);
		$.ajax(directAdminTo);
		$.ajax(derivativeAdminTo);
		$.ajax(unrolledMemberOf);
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
						Direct Members
					</dt>
					<dd>
						<NodeALink 
							ready={this.state.directMembers !== -1}
							value={this.state.directMembers}
							click={function(){
								emitter.emit('query', "MATCH (n)-[r:MemberOf]->(m:Group {name:'{}'}) RETURN n,r,m".format(this.state.label))
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
								emitter.emit('query', "MATCH (n:User), (m:Group {name:'{}'}), p=allShortestPaths((n)-[:MemberOf*1..]->(m)) RETURN p".format(this.state.label),
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
								emitter.emit('query', "MATCH (n:Group {name:'{}'})-[r:AdminTo]->(m:Computer) RETURN n,r,m".format(this.state.label),
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
								emitter.emit('query', "MATCH (n:Group {name:'{}'}), (target:Computer), p=allShortestPaths((n)-[*]->(target)) RETURN p".format(this.state.label),
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
								emitter.emit('query', "MATCH (n:Group {name:'{}'}), (target:Group), p=allShortestPaths((n)-[r:MemberOf*1..]->(target)) RETURN p".format(this.state.label),
									this.state.label)
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
								emitter.emit('query', "MATCH (n:User), (m:Group {name: '{}'}), p=allShortestPaths((n)-[r:MemberOf*1..]->(m)) WITH n,m,r MATCH (n)-[s:HasSession]-(o:Computer) RETURN m,n,r,o,s".format(this.state.label),
									"",this.state.label)
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}
