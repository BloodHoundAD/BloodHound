import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeCypherLink from "./NodeCypherLink.jsx";
import NodeCypherLinkComplex from "./NodeCypherLinkComplex.jsx";

export default class GpoNodeData extends Component {
    constructor() {
        super();

        this.state = {
            label: "",
            guid: ""
        };

        emitter.on("gpoNodeClicked", this.getNodeData.bind(this));
    }

    getNodeData(payload, guid) {
        this.setState({
            label: payload,
            guid: guid
        });
    }

    render() {
        return (
            <div className={this.props.visible ? "" : "displaynone"}>
                <dl className="dl-horizontal">
                    <dt>Domain</dt>
                    <dd>{this.state.label}</dd>
                    <dt>GUID</dt>
                    <dd>{this.state.guid}</dd>
                    <br />
                    <h4>Affected Objects</h4>
                    <NodeCypherLink
                        property="Directly Affected OUs"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (m:GPO {name:{name}})-[r:GpLink]->(n)"
                        }
                        start={this.state.label}
                    />

                    <NodeCypherLink
                        property="Affected OUs"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (m:GPO {name:{name}})-[r:GpLink|Contains*1..]->(n) WHERE n:OU OR n:Domain"
                        }
                        start={this.state.label}
                    />

                    <NodeCypherLinkComplex
                        property="Computer Objects"
                        target={this.state.label}
                        countQuery={
                            "MATCH (g:GPO {name:{name}}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:Computer) WHERE NONE(x in NODES(p1) WHERE x.blocksInheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:Computer) RETURN count(n1) + count(n2)"
                        }
                        graphQuery={
                            "MATCH (g:GPO {name:{name}}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:Computer) WHERE NONE(x in NODES(p1) WHERE x.blocksInheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:Computer) RETURN p1,p2"
                        }
                    />

                    <NodeCypherLinkComplex
                        property="User Objects"
                        target={this.state.label}
                        countQuery={
                            "MATCH (g:GPO {name:{name}}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:User) WHERE NONE(x in NODES(p1) WHERE x.blocksInheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:User) RETURN count(n1) + count(n2)"
                        }
                        graphQuery={
                            "MATCH (g:GPO {name:{name}}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:User) WHERE NONE(x in NODES(p1) WHERE x.blocksInheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:User) RETURN p1,p2"
                        }
                    />

                    <h4>Inbound Object Control</h4>

                    <NodeCypherLink
                        property="Explicit Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (n)-[r:AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(g:GPO {name:{name}})"
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Unrolled Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH p = (n)-[r:MemberOf*1..]->(g1:Group)-[r1]->(g2:GPO {name: {name}}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = g2.name) AND NOT n.name = g2.name AND r1.isacl=true"
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property="Transitive Object Controllers"
                        target={this.state.label}
                        baseQuery={
                            "MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((n)-[r:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(g:GPO {name:{name}}))"
                        }
                        end={this.state.label}
                        distinct
                    />
                </dl>
            </div>
        );
    }
}

GpoNodeData.propTypes = {
    visible: PropTypes.bool.isRequired
};
