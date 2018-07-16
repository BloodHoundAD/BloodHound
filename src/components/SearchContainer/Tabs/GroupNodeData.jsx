import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeCypherLink from "./NodeCypherLink";

export default class GroupNodeData extends Component {
    constructor() {
        super();

        this.state = {
            label: "",
            driversessions: []
        };

        emitter.on("groupNodeClicked", this.getNodeData.bind(this));
    }

    getNodeData(payload) {
        $.each(this.state.driversessions, function(index, record) {
            record.close();
        });

        this.setState({
            label: payload
        });
    }

    render() {
        return (
            <div className={this.props.visible ? "" : "displaynone"}>
                <dl className="dl-horizontal">
                    <h4>Node Info</h4>
                    <dt>Name</dt>
                    <dd>{this.state.label}</dd>
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
            </div>
        );
    }
}

GroupNodeData.propTypes = {
    visible: PropTypes.bool.isRequired
};
