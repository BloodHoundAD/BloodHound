import React, { Component } from 'react';
import NodeALink from './NodeALink';
import NodePropItem from './NodePropItem';
import PropTypes from 'prop-types';

import { If, Then, Else } from 'react-if';

export default class UserNodeData extends Component {
    constructor(){
        super();

        this.state = {
            label: "",
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
            transitiveControl: -1,
            driversessions : [],
            propertyMap: {ServicePrincipalNames: []}
        };

        emitter.on('userNodeClicked', this.getNodeData.bind(this));
    }

    getNodeData(payload){
        $.each(this.state.driversessions,function(index, record){
            record.close();
        });

        this.setState({
            label: payload,
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
            transitiveControl: -1,
            propertyMap: {ServicePrincipalNames: []}
        });

        var domain = '@' + payload.split('@').last();
        
        var s1 = driver.session();
        var s2 = driver.session();
        var s3 = driver.session();
        var s4 = driver.session();
        var s5 = driver.session();
        var s6 = driver.session();
        var s7 = driver.session();
        var s8 = driver.session();
        var s9 = driver.session();
        var s10 = driver.session();
        var s11 = driver.session();
        var s12 = driver.session();
        var s13 = driver.session();

        var props = driver.session();
        props.run("MATCH (n:User {name:{name}}) RETURN n", {name: payload})
            .then(function(result){
                var properties = result.records[0]._fields[0].properties;
                if (typeof properties.ServicePrincipalNames === 'undefined'){
                    properties.ServicePrincipalNames = [];
                }
                this.setState({propertyMap: properties});
                props.close();
            }.bind(this));

        s1.run("MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) MATCH (m)-[r:MemberOf*1..]->(n) RETURN count(n)", {name:payload, domain: domain})
            .then(function(result){
                this.setState({'foreignGroupMembership':result.records[0]._fields[0].low});
                s1.close();
            }.bind(this));

        s2.run("MATCH (n:User {name:{name}}), (m:Group), p=(n)-[:MemberOf]->(m) RETURN count(m)", {name:payload})
            .then(function(result){
                this.setState({'firstDegreeGroupMembership':result.records[0]._fields[0].low});
                s2.close();
            }.bind(this));

        s3.run("MATCH p = (n:User {name:{name}})-[r:MemberOf*1..]->(g:Group) RETURN COUNT(DISTINCT(g))", {name:payload})
            .then(function(result){
                this.setState({'unrolledGroupMembership':result.records[0]._fields[0].low});
                s3.close();
            }.bind(this));

        s4.run("MATCH p = (n:User {name:{name}})-[r:AdminTo]->(c:Computer) RETURN COUNT(DISTINCT(c))", {name:payload})
            .then(function(result){
                this.setState({'firstDegreeLocalAdmin':result.records[0]._fields[0].low});
                s4.close();
            }.bind(this));

        s5.run("MATCH p=(n:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(c:Computer) RETURN count(distinct(c))", {name:payload})
            .then(function(result){
                this.setState({'groupDelegatedLocalAdmin':result.records[0]._fields[0].low});
                s5.close();
            }.bind(this));

        s6.run("MATCH (c:Computer) WHERE NOT c.name={name} WITH c MATCH p = shortestPath((n:User {name:{name}})-[r:HasSession|AdminTo|MemberOf*1..]->(c)) RETURN COUNT(c)", {name:payload})
            .then(function(result){
                this.setState({'derivativeLocalAdmin':result.records[0]._fields[0].low});
                s6.close();
            }.bind(this));

        s7.run("MATCH p = (n:Computer)-[r:HasSession]->(m:User {name:{name}}) RETURN COUNT(DISTINCT(n))", {name:payload})
            .then(function(result){
                this.setState({'sessions':result.records[0]._fields[0].low});
                s7.close();
            }.bind(this));

        s8.run("MATCH p = (n)-[r:AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(u1:User {name: {name}}) RETURN COUNT(DISTINCT(n))", {name:payload})
            .then(function(result){
                this.setState({'firstdegreeControllers':result.records[0]._fields[0].low});
                s8.close();
            }.bind(this));

        s9.run("MATCH p = (n1)-[r:MemberOf*1..]->(g:Group)-[r1:AddMembers|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(u:User {name: {name}}) WITH LENGTH(p) as pathLength, p, n1 WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = u.name) AND NOT n1.name = u.name RETURN COUNT(DISTINCT(n1))", {name:payload})
            .then(function(result){
                this.setState({'unrolledControllers':result.records[0]._fields[0].low});
                s9.close();
            }.bind(this));

        s10.run("MATCH (n1) WHERE NOT n1.name={name} WITH n1 MATCH p = shortestPath((n1)-[r1:MemberOf|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:User {name: {name}})) RETURN COUNT(DISTINCT(n1))", {name:payload})
            .then(function(result){
                this.setState({'transitiveControllers':result.records[0]._fields[0].low});
                s10.close();
            }.bind(this));

        s11.run("MATCH p = (u:User {name:{name}})-[r1:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN COUNT(DISTINCT(n))", {name:payload})
            .then(function(result){
                this.setState({'firstdegreeControl':result.records[0]._fields[0].low});
                s11.close();
            }.bind(this));

        s12.run("MATCH p = (u:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN COUNT(DISTINCT(n))", {name:payload})
            .then(function(result){
                this.setState({'unrolledControl':result.records[0]._fields[0].low});
                s12.close();
            }.bind(this));

        s13.run("MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((u:User {name:{name}})-[r1:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(n)) RETURN COUNT(DISTINCT(n))", {name:payload})
            .then(function(result){
                this.setState({'transitiveControl':result.records[0]._fields[0].low});
                s13.close();
            }.bind(this));
        
        this.setState({'driversessions': [s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,props]});
    }

    isArray(object){
        return object && typeof object === 'object' && object.constructor === Array;
    }

    convertToDisplayProp(propName){
        var obj = this.state.propertyMap[propName];
        var type = typeof obj;
        if (type === 'undefined'){
            return "No Data";
        }else if (obj.hasOwnProperty('low')){
            var t = obj.low;
            if (t === 0){
                return "Never";
            }else{
                return new Date(obj.low * 1000).toUTCString();
            }
        }else if (type === 'boolean'){
            return obj.toString().toTitleCase();
        }else if (obj === ""){
            return "None";
        }else{
            return obj;
        }
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
                    <dt>
                        Display Name
                    </dt>
                    <dd>
                        {this.convertToDisplayProp("DisplayName")}
                    </dd>
                    <dt>
                        Password Last Changed
                    </dt>
                    <dd>
                        {this.convertToDisplayProp("PwdLastSet")}
                    </dd>
                    <dt>
                        Last Logon
                    </dt>
                    <dd>
                        {this.convertToDisplayProp("LastLogon")}
                    </dd>
                    <dt>
                        Enabled
                    </dt>
                    <dd>
                        {this.convertToDisplayProp("Enabled")}
                    </dd>
                    <dt>
                        Email
                    </dt>
                    <dd>
                        {this.convertToDisplayProp("Email")}
                    </dd>
                    <dt>
                        Service Principal Names
                    </dt>
                    {(() => {
                        if (this.state.propertyMap.ServicePrincipalNames.length === 0){
                            return <dd>None</dd>;
                        }
                    })()}
                    {Object.keys(this.state.propertyMap.ServicePrincipalNames).map(function(key){
                        var x = <dd key={key}>{this.state.propertyMap.ServicePrincipalNames[key]}</dd>;
                        return x;
                    }.bind(this))}
                    <dt>
                        Sessions
                    </dt>
                    <dd>
                        <NodeALink
                            ready={this.state.sessions !== -1}
                            value={this.state.sessions}
                            click={function(){
                                emitter.emit('query', "MATCH (n:Computer)-[r:HasSession]->(m:User {name:{name}}) RETURN n,r,m", {name:this.state.label}
                                    ,this.state.label);
                            }.bind(this)}
                        />
                    </dd>
                    
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
                                    );
                            }.bind(this)}
                        />
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
                                    this.state.label);
                            }.bind(this)}
                        />
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
                                    "MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) WITH n,m MATCH p = (m)-[r:MemberOf*1..]->(n) RETURN p", {name: this.state.label, domain: domain});
                            }.bind(this)}
                        />
                    </dd>
                    
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
                                emitter.emit('query', "MATCH p = (n:User {name:{name}})-[r:AdminTo]->(c:Computer) RETURN p", {name:this.state.label});
                            }.bind(this)}
                        />
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
                                    ,this.state.label);
                            }.bind(this)}
                        />
                    </dd>
                    <dt>
                        Derivative Local Admin Rights
                    </dt>
                    <dd>
                        <NodeALink
                            ready={this.state.derivativeLocalAdmin !== -1}
                            value={this.state.derivativeLocalAdmin}
                            click={function(){    
                                emitter.emit('query', "MATCH (c:Computer) WHERE NOT c.name={name} WITH c MATCH p = shortestPath((n:User {name:{name}})-[r:HasSession|AdminTo|MemberOf*1..]->(c)) RETURN p", {name:this.state.label}
                                    ,this.state.label);
                            }.bind(this)}
                        />
                    </dd>
                    
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
                                emitter.emit('query', "MATCH p = (u:User {name:{name}})-[r1:AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner]->(n) RETURN p", {name:this.state.label});
                            }.bind(this)}
                        />
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
                                    ,this.state.label);
                            }.bind(this)}
                        />
                    </dd>
                    <dt>
                        Transitive Object Control
                    </dt>
                    <dd>
                        <NodeALink
                            ready={this.state.transitiveControl !== -1}
                            value={this.state.transitiveControl}
                            click={function(){    
                                emitter.emit('query', "MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((u:User {name:{name}})-[r1:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(n)) RETURN p", {name:this.state.label}
                                    ,this.state.label);
                            }.bind(this)}
                        />
                    </dd>
                    
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
                                    ,this.state.label);
                            }.bind(this)}
                        />
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
                                    ,this.state.label);
                            }.bind(this)}
                        />
                    </dd>
                    <dt>
                        Transitive Object Controllers
                    </dt>
                    <dd>
                        <NodeALink
                            ready={this.state.transitiveControllers !== -1}
                            value={this.state.transitiveControllers}
                            click={function(){    
                                emitter.emit('query', "MATCH (n1) WHERE NOT n1.name={name} WITH n1 MATCH p = shortestPath((n1)-[r1:MemberOf|AddMembers|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:User {name: {name}})) RETURN p", {name:this.state.label}
                                    ,this.state.label);
                            }.bind(this)}
                        />
                    </dd>
                </dl>
            </div>
        );
    }
}

UserNodeData.propTypes = {
    visible : PropTypes.bool.isRequired
};