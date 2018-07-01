import React, { Component } from 'react';
<<<<<<< HEAD
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
			effectiveInboundTrusts: -1
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
=======
import LoadLabel from './LoadLabel.jsx';
import PropTypes from 'prop-types';
import NodeCypherLink from './NodeCypherLink.jsx';
import NodeCypherNoNumberLink from './NodeCypherNoNumberLink';
import NodeCypherLinkComplex from './NodeCypherLinkComplex';

export default class DomainNodeData extends Component {
    constructor(){
        super();

        this.state = {
            label: "",
            users: -1,
            groups: -1,
            computers: -1,
            ous: -1,
            gpos: -1,
            driversessions: []
        };

        emitter.on('domainNodeClicked', this.getNodeData.bind(this));
    }

    getNodeData(payload){
        $.each(this.state.driversessions, function(index, record){
            record.close();
        });
        this.setState({
            label: payload,
            users: -1,
            groups: -1,
            computers: -1,
            ous: -1,
            gpos: -1
        });

        let s1 = driver.session();
        let s2 = driver.session();
        let s3 = driver.session();
        let s4 = driver.session();
        let s5 = driver.session();

        s1.run("MATCH (a:User) WHERE a.domain={name} RETURN COUNT(a)", {name:payload})
            .then(function(result){
                this.setState({'users':result.records[0]._fields[0].low});
                s1.close();
            }.bind(this));

        s2.run("MATCH (a:Group) WHERE a.domain={name} RETURN COUNT(a)", {name:payload})
            .then(function(result){
                this.setState({'groups':result.records[0]._fields[0].low});
                s2.close();
            }.bind(this));

        s3.run("MATCH (n:Computer) WHERE n.domain={name} RETURN count(n)", {name:payload})
            .then(function(result){
                this.setState({'computers':result.records[0]._fields[0].low});
                s3.close();
            }.bind(this));
        
        s4.run("MATCH (n:OU {domain:{name}}) RETURN COUNT(n)", { name: payload })
            .then(function (result) {
                this.setState({ 'ous': result.records[0]._fields[0].low });
                s4.close();
            }.bind(this));
        
        s5.run("MATCH (n:GPO {domain:{name}}) RETURN COUNT(n)", { name: payload })
            .then(function (result) {
                this.setState({ 'gpos': result.records[0]._fields[0].low });
                s5.close();
            }.bind(this));
        
        this.setState({'driversessions': [s1,s2,s3]});
    }

    render() {
        return (
            <div className={this.props.visible ? "" : "displaynone"}>
                <dl className='dl-horizontal'>
                    <dt>
                        Domain
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
                            value={this.state.users}
                        />
                    </dd>
                    <dt>
                        Groups
                    </dt>
                    <dd>
                        <LoadLabel
                            ready={this.state.groups !== -1}
                            value={this.state.groups}
                        />
                    </dd>
                    <dt>
                        Computers
                    </dt>
                    <dd>
                        <LoadLabel
                            ready={this.state.computers !== -1}
                            value={this.state.computers}
                        />
                    </dd>
                    <dt>
                        OUs
                    </dt>
                    <dd>
                        <LoadLabel
                            ready={this.state.ous !== -1}
                            value={this.state.ous}
                        />
                    </dd>
                    <dt>
                        GPOs
                    </dt>
                    <dd>
                        <LoadLabel
                            ready={this.state.gpos !== -1}
                            value={this.state.gpos}
                        />
                    </dd>
                    <NodeCypherNoNumberLink target={this.state.label} property="Map OU Structure" query="MATCH p = (d:Domain {name:{name}})-[r:Contains*1..]->(n) RETURN p" />
                    <br />
                    <h4>Foreign Members</h4>

                    <NodeCypherLink property="Foreign Users" target={this.state.label} baseQuery={"MATCH (n:User) WHERE NOT n.domain={name} WITH n MATCH (b:Group) WHERE b.domain={name} WITH n,b MATCH p=(n)-[r:MemberOf]->(b)"}  />
                    
                    <NodeCypherLink property="Foreign Groups" target={this.state.label} baseQuery={"MATCH (n:Group) WHERE NOT n.domain={name} WITH n MATCH (b:Group) WHERE b.domain={name} WITH n,b MATCH p=(n)-[r:MemberOf]->(b)"}  />

                    <NodeCypherLink property="Foreign Admins" target={this.state.label} baseQuery={"MATCH (n) WHERE NOT n.domain={name} WITH n MATCH (b:Computer) WHERE b.domain={name} WITH n,b MATCH p=shortestPath((n)-[r:AdminTo|MemberOf*1..]->(b))"} />

                    <NodeCypherLink property="Foreign GPO Controllers" target={this.state.label} baseQuery={"MATCH (n) WHERE NOT n.domain={name} WITH n MATCH (b:GPO) WHERE b.domain={name} WITH n,b MATCH p=(n)-[r]->(b) WHERE r.isACL=true"} />

                    <h4>Inbound Trusts</h4>
                    <NodeCypherLink property="First Degree Trusts" target={this.state.label} baseQuery={"MATCH p=(a:Domain {name:{name}})<-[r:TrustedBy]-(n:Domain)"} />
                    
                    <NodeCypherLink property="Effective Inbound Trusts" target={this.state.label} baseQuery={"MATCH (n:Domain) WHERE NOT n.name={name} WITH n MATCH p=shortestPath((a:Domain {name:{name}})<-[r:TrustedBy*1..]-(n))"}/>

                    <h4>Outbound Trusts</h4>
                    <NodeCypherLink property="First Degree Trusts" target={this.state.label} baseQuery={"MATCH p=(a:Domain {name:{name}})-[r:TrustedBy]->(n:Domain)"} />

                    <NodeCypherLink property="Effective Outbound Trusts" target={this.state.label} baseQuery={"MATCH (n:Domain) WHERE NOT n.name={name} MATCH p=shortestPath((a:Domain {name:{name}})-[r:TrustedBy*1..]->(n))"} />

                    <h4>Inbound Controllers</h4>

                    <NodeCypherLink property="First Degree Controllers" target={this.state.label} baseQuery={"MATCH p=(n)-[r]->(u:Domain {name: {name}}) WHERE r.isACL=true"} distinct />

                    <NodeCypherLink property="Unrolled Controllers" target={this.state.label} baseQuery={"MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1]->(u:Domain {name: {name}}) WHERE r1.isACL=true"} distinct />

                    <NodeCypherLink property="Transitive Controllers" target={this.state.label} baseQuery={"MATCH p=shortestPath((n)-[r1:MemberOf|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns|DCSync*1..]->(u:Domain {name: {name}})) WHERE NOT n.name={name}"} distinct />

                    <NodeCypherLinkComplex property="Calculated Principals with DCSync Privileges" target={this.state.label} countQuery={"MATCH (n1)-[:MemberOf|GetChanges*1..]->(u:Domain {name: {name}}) WITH n1 MATCH (n1)-[:MemberOf|GetChangesAll*1..]->(u:Domain {name: {name}}) WITH n1 MATCH (n2)-[:MemberOf|DCSync*1..]->(u:Domain {name: {name}}) WITH collect(distinct(n1))+collect(distinct(n2)) as results UNWIND results as x WITH x WHERE x:User OR x:Computer RETURN count(distinct(x))"} graphQuery={"MATCH p=(n1)-[:MemberOf|GetChanges*1..]->(u:Domain {name: {name}}) WITH p,n1 MATCH p2=(n1)-[:MemberOf|GetChangesAll*1..]->(u:Domain {name: {name}}) WITH p,p2 MATCH p3=(n2)-[:MemberOf|DCSync*1..]->(u:Domain {name: {name}}) RETURN p,p2,p3"} />
                </dl>
            </div>
        );
    }
}

DomainNodeData.propTypes = {
    visible : PropTypes.bool.isRequired
};
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
