import React, { Component } from 'react';
import LoadLabel from './LoadLabel.jsx';
import PropTypes from 'prop-types';
import NodeCypherLink from './NodeCypherLink.jsx';
import NodeCypherNoNumberLink from './NodeCypherNoNumberLink';

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
        
        s4.run("MATCH (n:Ou {domain:{name}}) RETURN COUNT(n)", { name: payload })
            .then(function (result) {
                this.setState({ 'ous': result.records[0]._fields[0].low });
                s4.close();
            }.bind(this));
        
        s5.run("MATCH (n:Gpo {domain:{name}}) RETURN COUNT(n)", { name: payload })
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

                    <h4>Inbound Trusts</h4>
                    <NodeCypherLink property="First Degree Trusts" target={this.state.label} baseQuery={"MATCH p=(a:Domain {name:{name}})<-[r:TrustedBy]-(n:Domain)"} />
                    
                    <NodeCypherLink property="Effective Inbound Trusts" target={this.state.label} baseQuery={"MATCH (n:Domain) WHERE NOT n.name={name} WITH n MATCH p=shortestPath((a:Domain {name:{name}})<-[r:TrustedBy*1..]-(n))"}/>

                    <h4>Outbound Trusts</h4>
                    <NodeCypherLink property="First Degree Trusts" target={this.state.label} baseQuery={"MATCH p=(a:Domain {name:{name}})-[r:TrustedBy]->(n:Domain)"} />

                    <NodeCypherLink property="Effective Outbound Trusts" target={this.state.label} baseQuery={"MATCH (n:Domain) WHERE NOT n.name={name} MATCH p=shortestPath((a:Domain {name:{name}})-[r:TrustedBy*1..]->(n))"} />

                    <h4>Domain ACLs</h4>

                    <NodeCypherLink property="First Degree Controllers" target={this.state.label} baseQuery={"MATCH p=(n)-[r]->(u:Domain {name: {name}}) WHERE r.isACL=true"} distinct />

                    <NodeCypherLink property="Unrolled Controllers" target={this.state.label} baseQuery={"MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1]->(u:Domain {name: {name}}) WHERE r1.isACL=true"} distinct />

                    <NodeCypherLink property="Transitive Controllers" target={this.state.label} baseQuery={"MATCH p=shortestPath((n)-[r1:MemberOf|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns|DCSync*1..]->(u:Domain {name: {name}})) WHERE NOT n.name={name}"} distinct />
                </dl>
            </div>
        );
    }
}

DomainNodeData.propTypes = {
    visible : PropTypes.bool.isRequired
};