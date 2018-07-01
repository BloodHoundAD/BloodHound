import React, { Component } from 'react';
<<<<<<< HEAD
import NodeALink from './NodeALink'
import PropTypes from 'prop-types'

export default class UserNodeData extends Component {
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
			derivativeLocalAdmin: -1,
			sessions: -1,
			firstdegreeControllers: -1,
			unrolledControllers: -1,
			transitiveControllers: -1,
			firstdegreeControl: -1,
			unrolledControl: -1,
			transitiveControl: -1
		}

		emitter.on('userNodeClicked', this.getNodeData.bind(this));
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
			sessions: -1,
			firstdegreeControllers: -1,
			unrolledControllers: -1,
			transitiveControllers: -1,
			firstdegreeControl: -1,
			unrolledControl: -1,
			transitiveControl: -1
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

		s1.run("MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) MATCH (m)-[r:MemberOf*1..]->(n) RETURN count(n)", {name:payload, domain: domain})
			.then(function(result){
				this.setState({'foreignGroupMembership':result.records[0]._fields[0].low})
				s1.close()
			}.bind(this))

		s2.run("MATCH (n:User {name:{name}}), (m:Group), p=(n)-[:MemberOf]->(m) RETURN count(m)", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeGroupMembership':result.records[0]._fields[0].low})
				s2.close()
			}.bind(this))

		s3.run("MATCH p = (n:User {name:{name}})-[r:MemberOf*1..]->(g:Group) RETURN COUNT(DISTINCT(g))", {name:payload})
			.then(function(result){
				this.setState({'unrolledGroupMembership':result.records[0]._fields[0].low})
				s3.close()
			}.bind(this))

		s4.run("MATCH p = (n:User {name:{name}})-[r:AdminTo]->(c:Computer) RETURN COUNT(DISTINCT(c))", {name:payload})
			.then(function(result){
				this.setState({'firstDegreeLocalAdmin':result.records[0]._fields[0].low})
				s4.close()
			}.bind(this))

		s5.run("MATCH p=(n:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(c:Computer) RETURN count(distinct(c))", {name:payload})
			.then(function(result){
				this.setState({'groupDelegatedLocalAdmin':result.records[0]._fields[0].low})
				s5.close()
			}.bind(this))

		s6.run("MATCH p = shortestPath((n:User {name:{name}})-[r:HasSession|AdminTo|MemberOf*1..]->(c:Computer)) RETURN COUNT(c)", {name:payload})
			.then(function(result){
				this.setState({'derivativeLocalAdmin':result.records[0]._fields[0].low})
				s6.close()
			}.bind(this))

		s7.run("MATCH p = (n:Computer)-[r:HasSession]->(m:User {name:{name}}) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'sessions':result.records[0]._fields[0].low})
				s7.close()
			}.bind(this))

		s8.run("MATCH p = (n)-[r:AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(u1:User {name: {name}}) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'firstdegreeControllers':result.records[0]._fields[0].low})
				s8.close()
			}.bind(this))

		s9.run("MATCH p = (n1)-[r:MemberOf*1..]->(g:Group)-[r1:AddMembers|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(u:User {name: {name}}) WITH LENGTH(p) as pathLength, p, n1 WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = u.name) AND NOT n1.name = u.name RETURN COUNT(DISTINCT(n1))", {name:payload})
			.then(function(result){
				this.setState({'unrolledControllers':result.records[0]._fields[0].low})
				s9.close()
			}.bind(this))

		s10.run("MATCH p = shortestPath((n1)-[r1:MemberOf|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:User {name: {name}})) RETURN COUNT(DISTINCT(n1))", {name:payload})
			.then(function(result){
				this.setState({'transitiveControllers':result.records[0]._fields[0].low})
				s10.close()
			}.bind(this))

		s11.run("MATCH p = (u:User {name:{name}})-[r1:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'firstdegreeControl':result.records[0]._fields[0].low})
				s11.close()
			}.bind(this))

		s12.run("MATCH p = (u:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'unrolledControl':result.records[0]._fields[0].low})
				s12.close()
			}.bind(this))

		s13.run("MATCH p = shortestPath((u:User {name:{name}})-[r1:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(n)) RETURN COUNT(DISTINCT(n))", {name:payload})
			.then(function(result){
				this.setState({'transitiveControl':result.records[0]._fields[0].low})
				s13.close()
			}.bind(this))
	}

	render() {
		var domain = '@' + this.state.label.split('@').last()
		return (
			<div className={this.props.visible ? "" : "displaynone"}>
				<dl className='dl-horizontal'>
                    <h4>
                        Node Info
                    </h4>
					<dt>
						Name
					</dt>
					<dd>
						{this.state.label}
					</dd>
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
					<dt>
						Sessions
					</dt>
					<dd>
						<NodeALink
							ready={this.state.sessions !== -1}
							value={this.state.sessions}
							click={function(){
								emitter.emit('query', "MATCH (n:Computer)-[r:HasSession]->(m:User {name:{name}}) RETURN n,r,m", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<h4>Group Membership</h4>
					<dt>
						First Degree Group Memberships
					</dt>
					<dd>
						<NodeALink 
							ready={this.state.firstDegreeGroupMembership !== -1}
							value={this.state.firstDegreeGroupMembership}
							click={function(){
								emitter.emit(
									'query',
									"MATCH p = (n:User {name:{name}})-[r:MemberOf]->(g:Group) RETURN p", {name:this.state.label}
									)
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
								emitter.emit('query', "MATCH p = (n:User {name:{name}})-[r:MemberOf*1..]->(g:Group) RETURN p", {name:this.state.label},
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
								emitter.emit('query', 
									"MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) WITH n,m MATCH p = (m)-[r:MemberOf*1..]->(n) RETURN p", {name: this.state.label, domain: domain})
							}.bind(this)} />
					</dd>
					<br />
					<h4>
					    Local Admin Rights
					</h4>
					<dt>
						First Degree Local Admin
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstDegreeLocalAdmin !== -1}
							value={this.state.firstDegreeLocalAdmin}
							click={function(){
								emitter.emit('query', "MATCH p = (n:User {name:{name}})-[r:AdminTo]->(c:Computer) RETURN p", {name:this.state.label})
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
								emitter.emit('query', "MATCH p=(n:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(c:Computer) RETURN p", {name:this.state.label}
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
							click={function(){	
								emitter.emit('query', "MATCH p = shortestPath((n:User {name:{name}})-[r:HasSession|AdminTo|MemberOf*1..]->(c:Computer)) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
					<br />
					<h4>
					    Outbound Object Control
					</h4>
					<dt>
						First Degree Object Control
					</dt>
					<dd>
						<NodeALink
							ready={this.state.firstdegreeControl !== -1}
							value={this.state.firstdegreeControl}
							click={function(){
								emitter.emit('query', "MATCH p = (u:User {name:{name}})-[r1:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN p", {name:this.state.label})
							}.bind(this)} />
					</dd>
					<dt>
						Group Delegated Object Control
					</dt>
					<dd>
						<NodeALink
							ready={this.state.unrolledControl !== -1}
							value={this.state.unrolledControl}
							click={function(){
								emitter.emit('query', "MATCH p = (u:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN p", {name:this.state.label}
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
								emitter.emit('query', "MATCH p = shortestPath((u:User {name:{name}})-[r1:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(n)) RETURN p", {name:this.state.label}
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
							ready={this.state.firstdegreeControllers !== -1}
							value={this.state.firstdegreeControllers}
							click={function(){	
								emitter.emit('query', "MATCH p = (n)-[r:AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(u1:User {name: {name}}) RETURN p", {name:this.state.label}
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
								emitter.emit('query', "MATCH p = (n1)-[r:MemberOf*1..]->(g:Group)-[r1:AddMembers|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(u:User {name: {name}}) WITH LENGTH(p) as pathLength, p, n1 WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = u.name) AND NOT n1.name = u.name RETURN p", {name:this.state.label}
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
								emitter.emit('query', "MATCH p = shortestPath((n1)-[r1:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:User {name: {name}})) RETURN p", {name:this.state.label}
									,this.state.label)
							}.bind(this)} />
					</dd>
				</dl>
			</div>
		);
	}
}

UserNodeData.propTypes = {
	visible : React.PropTypes.bool.isRequired
}
=======
import NodePropItem from './NodePropItem';
import PropTypes from 'prop-types';
import NodeProps from './NodeProps';
import NodeCypherLink from './NodeCypherLink';
import NodeCypherNoNumberLink from './NodeCypherNoNumberLink';
import NodeCypherLinkComplex from './NodeCypherLinkComplex';

import { If, Then, Else } from 'react-if';

export default class UserNodeData extends Component {
    constructor(){
        super();

        this.state = {
            label: "",
            driversessions : [],
            propertyMap: {},
            ServicePrincipalNames: [],
            displayMap: {"DisplayName":"Display Name", "PwdLastSet":"Password Last Changed", "LastLogon": "Last Logon", "Enabled":"Enabled","Email":"Email", "Title":"Title", "HomeDir":"Home Directory"}
        };

        emitter.on('userNodeClicked', this.getNodeData.bind(this));
    }

    getNodeData(payload){
        $.each(this.state.driversessions,function(index, record){
            record.close();
        });

        this.setState({
            label: payload,
            propertyMap: {},
            ServicePrincipalNames: [],
            driversessions: []
        });

        var props = driver.session();
        props.run("MATCH (n:User {name:{name}}) RETURN n", {name: payload})
            .then(function(result){
                var properties = result.records[0]._fields[0].properties;
                if (typeof properties.ServicePrincipalNames === 'undefined'){
                    this.setState({ServicePrincipalNames: []});
                }else{
                    this.setState({ ServicePrincipalNames: properties.ServicePrincipalNames });
                }
                this.setState({propertyMap: properties});
                props.close();
            }.bind(this));
        this.setState({driversessions:[props]});
    }

    render() {
        var domain = '@' + this.state.label.split('@').last();
        return (
            <div className={this.props.visible ? "" : "displaynone"}>
                <dl className='dl-horizontal'>
                    <h4>
                        User Info
                    </h4>
                    <dt>
                        Name
                    </dt>
                    <dd>
                        {this.state.label}
                    </dd>
                    <NodeProps properties={this.state.propertyMap} displayMap={this.state.displayMap} ServicePrincipalNames={this.state.ServicePrincipalNames} />
                    

                    <NodeCypherLink property="Sessions" target={this.state.label} baseQuery={"MATCH p=(m:Computer)-[r:HasSession]->(n:User {name:{name}})"} end={this.state.label} />

                    <NodeCypherLinkComplex property="Sibling Objects in the Same OU" target={this.state.label} countQuery={"MATCH (o1)-[r1:Contains]->(o2:User {name:{name}}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN count(distinct(n))"} graphQuery={"MATCH (o1)-[r1:Contains]->(o2:User {name:{name}}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN p1,p2"} />

                    <NodeCypherLinkComplex property="Effective Inbound GPOs" target={this.state.label} countQuery={"MATCH (c:User {name:{name}}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksInheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN count(g1)+count(g2)"} graphQuery={"MATCH (c:User {name:{name}}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksInheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN p1,p2"} />

                    <NodeCypherNoNumberLink target={this.state.label} property="See User within Domain/OU Tree" query="MATCH p = (d:Domain)-[r:Contains*1..]->(u:User {name:{name}}) RETURN p" />
                    
                    <h4>Group Membership</h4>
                    
                    <NodeCypherLink property="First Degree Group Memberships" target={this.state.label} baseQuery={"MATCH (m:User {name:{name}}), (n:Group), p=(m)-[:MemberOf]->(n)"} start={this.state.label} />
                    
                    <NodeCypherLink property="Unrolled Group Membership" target={this.state.label} baseQuery={"MATCH p = (m:User {name:{name}})-[r:MemberOf*1..]->(n:Group)"} start={this.state.label} distinct />
                    
                    <NodeCypherLink property="Foreign Group Membership" target={this.state.label} baseQuery={"MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) WITH n,m MATCH p=(m)-[r:MemberOf*1..]->(n)"} start={this.state.label} />
                    
                    <h4>
                        Local Admin Rights
                    </h4>

                    <NodeCypherLink property="First Degree Local Admin" target={this.state.label} baseQuery={"MATCH p=(m:User {name:{name}})-[r:AdminTo]->(n:Computer)"} start={this.state.label} distinct />

                    <NodeCypherLink property="Group Delegated Local Admin Rights" target={this.state.label} baseQuery={"MATCH p=(m:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(n:Computer)"} start={this.state.label} distinct />

                    <NodeCypherLink property="Derivative Local Admin Rights" target={this.state.label} baseQuery={"MATCH p=shortestPath((m:User {name:{name}})-[r:HasSession|AdminTo|MemberOf*1..]->(n:Computer))"} start={this.state.label} distinct />
                    
                    <h4>
                        Outbound Object Control
                    </h4>

                    <NodeCypherLink property="First Degree Object Control" target={this.state.label} baseQuery={"MATCH p=(u:User {name:{name}})-[r1]->(n) WHERE r1.isACL=true"} end={this.state.label} distinct />

                    <NodeCypherLink property="Group Delegated Object Control" target={this.state.label} baseQuery={"MATCH p=(u:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2]->(n) WHERE r2.isACL=true"} start={this.state.label} distinct />
                    
                    <NodeCypherLink property="Transitive Object Control" target={this.state.label} baseQuery={"MATCH (n) WHERE NOT n.name={name} WITH n MATCH p=shortestPath((u:User {name:{name}})-[r1:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(n))"} start={this.state.label} distinct />
                    
                    <h4>Inbound Object Control</h4>

                    <NodeCypherLink property="Explicit Object Controllers" target={this.state.label} baseQuery={"MATCH p=(n)-[r]->(u1:User {name: {name}}) WHERE r.isACL=true"} end={this.state.label} distinct />

                    <NodeCypherLink property="Unrolled Object Controllers" target={this.state.label} baseQuery={"MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1:AddMember|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(u:User {name: {name}}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = u.name) AND NOT n.name = u.name"} end={this.state.label} distinct />
                    
                    <NodeCypherLink property="Transitive Object Controllers" target={this.state.label} baseQuery={"MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((n)-[r1:MemberOf|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:User {name: {name}}))"} end={this.state.label} distinct />
                </dl>
            </div>
        );
    }
}

UserNodeData.propTypes = {
    visible : PropTypes.bool.isRequired
};
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
