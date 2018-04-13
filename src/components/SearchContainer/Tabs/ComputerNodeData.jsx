import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NodeProps from './NodeProps';
import NodeCypherLink from './NodeCypherLink';
import NodeCypherNoNumberLink from './NodeCypherNoNumberLink';
import NodeCypherLinkComplex from './NodeCypherLinkComplex';

export default class ComputerNodeData extends Component {
    constructor(){
        super();

        this.state = {
            label: "",
            driversessions: [],
            propertyMap: {},
            ServicePrincipalNames: [],
            displayMap: { "OperatingSystem": "OS", "Enabled": "Enabled", "UnconstrainedDelegation": "Allows Unconstrained Delegation"}
        };

        emitter.on('computerNodeClicked', this.getNodeData.bind(this));
    }

    getNodeData(payload){
        $.each(this.state.driversessions, function(index, record){
            record.close();
        });
        this.setState({
            label: payload,
            propertyMap: {},
            driversessions: []
        });

        var propCollection = driver.session();
        propCollection.run("MATCH (c:Computer {name:{name}}) RETURN c", {name:payload})
            .then(function(result){
                var properties = result.records[0]._fields[0].properties;                
                this.setState({propertyMap: properties});
                propCollection.close();
            }.bind(this));
        
        this.setState({'driversessions': [propCollection]});
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
                    <NodeProps properties={this.state.propertyMap} displayMap={this.state.displayMap} ServicePrincipalNames={this.state.ServicePrincipalNames} />

                    <NodeCypherLink property="Sessions" target={this.state.label} baseQuery={"MATCH p=(m:Computer {name:{name}})-[r:HasSession]->(n:User) WHERE NOT n.name ENDS WITH '$'"} start={this.state.label} distinct />

                    <NodeCypherLinkComplex property="Sibling Objects in the Same OU" target={this.state.label} countQuery={"MATCH (o1)-[r1:Contains]->(o2:Computer {name:{name}}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN count(distinct(n))"} graphQuery={"MATCH (o1)-[r1:Contains]->(o2:Computer {name:{name}}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN p1,p2"} />

                    <NodeCypherLinkComplex property="Effective Inbound GPOs" target={this.state.label} countQuery={"MATCH (c:Computer {name:{name}}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksInheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN count(g1)+count(g2)"} graphQuery={"MATCH (c:Computer {name:{name}}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksInheritance = true AND 'OU' IN LABELS(x) AND NOT (g2)-->(x)) RETURN p1,p2"} />

                    <NodeCypherNoNumberLink target={this.state.label} property="See Computer within Domain/OU Tree" query="MATCH p = (d:Domain)-[r:Contains*1..]->(u:Computer {name:{name}}) RETURN p" />
                    <h4>Local Admins</h4>

                    <NodeCypherLink property="Explicit Admins" target={this.state.label} baseQuery={"MATCH p=(n)-[b:AdminTo]->(c:Computer {name:{name}})"} end={this.state.label} />

                    <NodeCypherLink property="Unrolled Admins" target={this.state.label} baseQuery={"MATCH p=(n)-[r:MemberOf|AdminTo*1..]->(m:Computer {name:{name}}) WHERE NOT n:Group"} end={this.state.label} distinct />

                    <NodeCypherLink property="Derivative Local Admins" target={this.state.label} baseQuery={"MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((n)-[r:AdminTo|MemberOf|HasSession*1..]->(m:Computer {name:{name}}))"} end={this.state.label} distinct />

                    <h4>Group Memberships</h4>
                    
                    <NodeCypherLink property="First Degree Group Membership" target={this.state.label} baseQuery={"MATCH (m:Computer {name:{name}}),(n:Group), p=(m)-[r:MemberOf]->(n)"} start={this.state.label} />

                    <NodeCypherLink property="Unrolled Group Membership" target={this.state.label} baseQuery={"MATCH p=(c:Computer {name:{name}})-[r:MemberOf*1..]->(n:Group)"} start={this.state.label} />

                    <NodeCypherLink property="Foreign Group Membership" target={this.state.label} baseQuery={"MATCH p=(c:Computer {name:{name}})-[r:MemberOf*1..]->(n:Group) WHERE NOT n.domain = c.domain"} start={this.state.label} />

                    <h4>Local Admin Rights</h4>

                    <NodeCypherLink property="First Degree Local Admin" target={this.state.label} baseQuery={"MATCH (m:Computer {name:{name}}), (n:Computer), p=(m)-[r:AdminTo]->(n)"} start={this.state.label} distinct />

                    <NodeCypherLink property="Group Delegated Local Admin" target={this.state.label} baseQuery={"MATCH p=(m:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(n:Computer) WHERE NOT n.name={name}"} start={this.state.label} distinct />

                    <NodeCypherLink property="Derivative Local Admin" target={this.state.label} baseQuery={"MATCH (m:Computer {name:{name}}), (n:Computer) WHERE NOT n.name={name} MATCH p=shortestPath((m)-[r:AdminTo|MemberOf*1..]->(n))"} start={this.state.label} distinct />

                    <h4>Outbound Object Control</h4>
                    <NodeCypherLink property="First Degree Object Control" target={this.state.label} baseQuery={"MATCH p = (c:Computer {name:{name}})-[r]->(n) WHERE r.isACL=true"} start={this.state.label} distinct />

                    <NodeCypherLink property="Group Delegated Object Control" target={this.state.label} baseQuery={"MATCH p = (c:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2]->(n) WHERE r2.isACL=true"} start={this.state.label} distinct />

                    <NodeCypherLink property="Transitive Object Control" target={this.state.label} baseQuery={"MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((c:Computer {name:{name}})-[r:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(n))"} start={this.state.label} distinct />
                </dl>
            </div>
        );
    }
}

ComputerNodeData.propTypes= {
    visible : PropTypes.bool.isRequired
};
