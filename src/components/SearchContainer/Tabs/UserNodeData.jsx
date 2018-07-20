import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeProps from "./NodeProps";
import NodeCypherLink from "./NodeCypherLink";
import NodeCypherNoNumberLink from "./NodeCypherNoNumberLink";
import NodeCypherLinkComplex from "./NodeCypherLinkComplex";

export default class UserNodeData extends Component {
    constructor() {
        super();

        this.state = {
            label: "",
            driversessions: [],
            propertyMap: {},
            ServicePrincipalNames: [],
            AllowedToDelegate: [],
            displayMap: {
                displayname: "Display Name",
                pwdlastset: "Password Last Changed",
                lastlogon: "Last Logon",
                enabled: "Enabled",
                email: "Email",
                title: "Title",
                homedirectory: "Home Directory",
                description: "Description",
                userpassword: "User Password",
                admincount: "AdminCount",
                owned: "Compromised"
            },
            notes: null
        };

        emitter.on("userNodeClicked", this.getNodeData.bind(this));
    }

    getNodeData(payload) {
        jQuery(this.refs.complete).hide();
        $.each(this.state.driversessions, function(index, record) {
            record.close();
        });

        this.setState({
            label: payload,
            propertyMap: {},
            ServicePrincipalNames: [],
            driversessions: []
        });

        var props = driver.session();
        props
            .run("MATCH (n:User {name:{name}}) RETURN n", { name: payload })
            .then(
                result => {
                    var properties = result.records[0]._fields[0].properties;
                    let spn;
                    if (!properties.serviceprincipalnames){
                        spn = [];
                    }else{
                        spn = properties.serviceprincipalnames;
                    }
                    let notes;
                    if (!properties.notes){
                        notes = null;
                    }else{
                        notes = properties.notes;
                    }

                    let del;
                    if (!properties.allowedtodelegate){
                        del = []
                    }else{
                        del = properties.allowedtodelegate;
                    }
                    this.setState({
                        ServicePrincipalNames:spn,
                        AllowedToDelegate: del,
                        propertyMap: properties,
                        notes: notes
                    });
                
                    props.close();
                }
            );
        this.setState({ driversessions: [props] });
    }

    notesChanged(event){
        this.setState({notes: event.target.value})
    }

    notesBlur(event){
        let notes = this.state.notes === null || this.state.notes === "" ? null : this.state.notes;
        let q = driver.session();
        if (notes === null){
            q.run("MATCH (n:User {name:{name}}) REMOVE n.notes", {name: this.state.label}).then(x => {
                q.close();
            });
        }else{
            q.run("MATCH (n:User {name:{name}}) SET n.notes = {notes}", {name: this.state.label, notes: this.state.notes}).then(x =>{
                q.close();
            });
        }
        let check = jQuery(this.refs.complete);
        check.show();
        check.fadeOut(2000);
    }

    render() {
        var domain = "@" + this.state.label.split("@").last();
        return (
            <div className={this.props.visible ? "" : "displaynone"}>
                <dl className="dl-horizontal">
                    <h4>User Info</h4>
                    <dt>Name</dt>
                    <dd>{this.state.label}</dd>
                    <NodeProps
                        properties={this.state.propertyMap}
                        displayMap={this.state.displayMap}
                        ServicePrincipalNames={this.state.ServicePrincipalNames}
                        AllowedToDelegate={this.state.AllowedToDelegate}
                    />

                    <NodeCypherLink
                        property="Sessions"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(m:Computer)-[r:HasSession]->(n:User {name:{name}})"
                        }
                        end={this.state.label}
                    />

                    <NodeCypherLinkComplex
                        property="Sibling Objects in the Same OU"
                        target={this.state.label}
                        countQuery={
                            "MATCH (o1)-[r1:Contains]->(o2:User {name:{name}}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN count(distinct(n))"
                        }
                        graphQuery={
                            "MATCH (o1)-[r1:Contains]->(o2:User {name:{name}}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN p1,p2"
                        }
                    />

                    <NodeCypherLinkComplex
                        property="Effective Inbound GPOs"
                        target={this.state.label}
                        countQuery={
                            "MATCH (c:User {name:{name}}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN count(g1)+count(g2)"
                        }
                        graphQuery={
                            "MATCH (c:User {name:{name}}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN p1,p2"
                        }
                    />

                    <NodeCypherNoNumberLink
                        target={this.state.label}
                        property="See User within Domain/OU Tree"
                        query="MATCH p = (d:Domain)-[r:Contains*1..]->(u:User {name:{name}}) RETURN p"
                    />

                    <h4>Group Membership</h4>

                    <NodeCypherLink
                        property="First Degree Group Memberships"
                        target={this.state.label}
                        baseQuery={
                            "MATCH (m:User {name:{name}}), (n:Group), p=(m)-[:MemberOf]->(n)"
                        }
                        start={this.state.label}
                    />

                    <NodeCypherLink
                        property="Unrolled Group Membership"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (m:User {name:{name}})-[r:MemberOf*1..]->(n:Group)"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Foreign Group Membership"
                        target={this.state.label}
                        baseQuery={
                            "MATCH (n:Group) WHERE NOT n.name ENDS WITH {domain} WITH n MATCH (m:User {name:{name}}) WITH n,m MATCH p=(m)-[r:MemberOf*1..]->(n)"
                        }
                        start={this.state.label}
                    />

                    <h4>Local Admin Rights</h4>

                    <NodeCypherLink
                        property="First Degree Local Admin"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(m:User {name:{name}})-[r:AdminTo]->(n:Computer)"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Group Delegated Local Admin Rights"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(m:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(n:Computer)"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Derivative Local Admin Rights"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=shortestPath((m:User {name:{name}})-[r:HasSession|AdminTo|MemberOf*1..]->(n:Computer))"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <h4>Outbound Object Control</h4>

                    <NodeCypherLink
                        property="First Degree Object Control"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(u:User {name:{name}})-[r1]->(n) WHERE r1.isacl=true"
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Group Delegated Object Control"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(u:User {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2]->(n) WHERE r2.isacl=true"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Transitive Object Control"
                        target={this.state.label}
                        baseQuery={
                            "MATCH (n) WHERE NOT n.name={name} WITH n MATCH p=shortestPath((u:User {name:{name}})-[r1:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(n))"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <h4>Inbound Object Control</h4>

                    <NodeCypherLink
                        property="Explicit Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(n)-[r]->(u1:User {name: {name}}) WHERE r.isacl=true"
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Unrolled Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1:AddMember|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(u:User {name: {name}}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = u.name) AND NOT n.name = u.name"
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Transitive Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((n)-[r1:MemberOf|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:User {name: {name}}))"
                        }
                        end={this.state.label}
                        distinct
                    />
                </dl>
                <div>
                    <h4 className={"inline"}>Notes</h4>
                    <i
                        ref="complete"
                        className="fa fa-check-circle green-icon-color notes-check-style"
                    />
                </div>
                <textarea onBlur={this.notesBlur.bind(this)} onChange={this.notesChanged.bind(this)} value={this.state.notes === null ? "" : this.state.notes} className={"node-notes-textarea"} ref="notes" />
            </div>
        );
    }
}

UserNodeData.propTypes = {
    visible: PropTypes.bool.isRequired
};
