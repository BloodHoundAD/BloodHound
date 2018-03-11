import React, { Component } from 'react';
import NodePropItem from './NodePropItem';
import PropTypes from 'prop-types';
import NodeProps from './NodeProps';
import NodeCypherLink from './NodeCypherLink';

import { If, Then, Else } from 'react-if';

export default class UserNodeData extends Component {
    constructor(){
        super();

        this.state = {
            label: "",
            driversessions : [],
            propertyMap: {},
            ServicePrincipalNames: [],
            displayMap: {"DisplayName":"Display Name", "PwdLastSet":"Password Last Changed", "LastLogon": "Last Logon", "Enabled":"Enabled","Email":"Email"}
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