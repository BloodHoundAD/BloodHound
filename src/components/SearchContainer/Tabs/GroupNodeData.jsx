import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeCypherLink from "./NodeCypherLink";
import NodeProps from "./NodeProps";

export default class GroupNodeData extends Component {
    constructor() {
        super();

        this.state = {
            label: "",
            driversessions: [],
            propertyMap: {},
            displayMap: {"description":"Description","admincount":"Admin Count"},
            ServicePrincipalNames: [],
            notes: null
        };

        emitter.on("groupNodeClicked", this.getNodeData.bind(this));
    }

    getNodeData(payload) {
        jQuery(this.refs.complete).hide();
        $.each(this.state.driversessions, function(index, record) {
            record.close();
        });

        this.setState({
            label: payload
        });

        var propCollection = driver.session();
        propCollection
            .run("MATCH (c:Group {name:{name}}) RETURN c", { name: payload })
            .then(
                function(result) {
                    var properties = result.records[0]._fields[0].properties;
                    let notes;
                    if (!properties.notes){
                        notes = null;
                    }else{
                        notes = properties.notes;
                    }
                    this.setState({ propertyMap: properties, notes: notes });
                    propCollection.close();
                }.bind(this)
            );
    }

    notesChanged(event){
        this.setState({notes: event.target.value})
    }

    notesBlur(event){
        let notes = this.state.notes === null || this.state.notes === "" ? null : this.state.notes;
        let q = driver.session();
        if (notes === null){
            q.run("MATCH (n:Group {name:{name}}) REMOVE n.notes", {name: this.state.label}).then(x => {
                q.close();
            });
        }else{
            q.run("MATCH (n:Group {name:{name}}) SET n.notes = {notes}", {name: this.state.label, notes: this.state.notes}).then(x =>{
                q.close();
            });
        }
        let check = jQuery(this.refs.complete);
        check.show();
        check.fadeOut(2000);
    }

    render() {
        return (
            <div className={this.props.visible ? "" : "displaynone"}>
                <dl className="dl-horizontal">
                    <h4>Node Info</h4>
                    <dt>Name</dt>
                    <dd>{this.state.label}</dd>
                    <NodeProps
                        properties={this.state.propertyMap}
                        displayMap={this.state.displayMap}
                        ServicePrincipalNames={this.state.ServicePrincipalNames}
                    />
                    <NodeCypherLink
                        property="Sessions"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (c:Computer)-[n:HasSession]->(u:User)-[r2:MemberOf*1..]->(g:Group {name: {name}})"
                        }
                        end={this.state.label}
                    />

                    {/* <NodeCypherLink property="Sibling Objects in the Same OU" target={this.state.label} baseQuery={"MATCH (o1:OU)-[r1:Contains]->(g1:Group {name:{name}}) WITH o1 MATCH p= (d: Domain)-[r2:Contains*1..]->(o1)-[r3:Contains]->(n)"} /> */}

                    <h4>Group Members</h4>
                    <NodeCypherLink
                        property="Direct Members"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(n)-[b:MemberOf]->(c:Group {name: {name}})"
                        }
                        end={this.state.label}
                    />

                    <NodeCypherLink
                        property="Unrolled Members"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p =(n)-[r:MemberOf*1..]->(g:Group {name:{name}})"
                        }
                        end={this.state.label}
                    />

                    <NodeCypherLink
                        property="Foreign Members"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (n)-[r:MemberOf*1..]->(g:Group {name:{name}}) WHERE NOT g.domain = n.domain"
                        }
                        end={this.state.label}
                        distinct
                    />

                    <h4>Group Membership</h4>
                    <NodeCypherLink
                        property="First Degree Group Membership"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(g1:Group {name:{name}})-[r:MemberOf]->(n:Group)"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Unrolled Member Of"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (g1:Group {name:{name}})-[r:MemberOf*1..]->(n:Group)"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Foreign Group Membership"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(m:Group {name:{name}})-[r:MemberOf]->(n) WHERE NOT m.domain=n.domain"
                        }
                        start={this.state.label}
                    />

                    <h4>Local Admin Rights</h4>

                    <NodeCypherLink
                        property="First Degree Local Admin"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(m:Group {name: {name}})-[r:AdminTo]->(n:Computer)"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Group Delegated Local Admin Rights"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (g1:Group {name:{name}})-[r1:MemberOf*1..]->(g2:Group)-[r2:AdminTo]->(n:Computer)"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Derivative Local Admin Rights"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = shortestPath((g:Group {name:{name}})-[r:MemberOf|AdminTo|HasSession*1..]->(n:Computer))"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <h4>Outbound Object Control</h4>

                    <NodeCypherLink
                        property="First Degree Object Control"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (g:Group {name:{name}})-[r]->(n) WHERE r.isacl=true"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Group Delegated Object Control"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (g1:Group {name:{name}})-[r1:MemberOf*1..]->(g2:Group)-[r2]->(n) WHERE r2.isacl=true"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Transitive Object Control"
                        target={this.state.label}
                        baseQuery={
                            "MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((g:Group {name:{name}})-[r:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(n))"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <h4>Inbound Object Control</h4>

                    <NodeCypherLink
                        property="Explicit Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (n)-[r:AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(g:Group {name:{name}})"
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Unrolled Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (n)-[r:MemberOf*1..]->(g1:Group)-[r1]->(g2:Group {name: {name}}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = g2.name) AND NOT n.name = g2.name AND r1.isacl=true"
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Transitive Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((n)-[r:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(g:Group {name:{name}}))"
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

GroupNodeData.propTypes = {
    visible: PropTypes.bool.isRequired
};
