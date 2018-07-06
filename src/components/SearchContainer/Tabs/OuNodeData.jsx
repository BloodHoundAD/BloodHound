import React, { Component } from 'react';
import LoadLabel from './LoadLabel.jsx';
import PropTypes from 'prop-types';
import NodeCypherLink from './NodeCypherLink.jsx';
import NodeCypherNoNumberLink from './NodeCypherNoNumberLink';

export default class OuNodeData extends Component {
    constructor() {
        super();

        this.state = {
            label: "",
            guid: "",
            blocks: ""
        };

        emitter.on('ouNodeClicked', this.getNodeData.bind(this));
    }

    getNodeData(payload, guid, blocksInheritance) {
        let bi = ''+blocksInheritance;
        bi = bi.toTitleCase()

        this.setState({
            label: payload,
            guid: guid,
            blocks: bi
        });
    }

    render() {
        return (
            <div className={this.props.visible ? "" : "displaynone"}>
                <dl className='dl-horizontal'>
                    <dt>
                        Ou
                    </dt>
                    <dd>
                        {this.state.label}
                    </dd>
                    <dt>
                        GUID
                    </dt>
                    <dd>
                        {this.state.guid}
                    </dd>
                    <dt>
                        Blocks Inheritance
                    </dt>
                    <dd>
                        {this.state.blocks}
                    </dd>
                    <NodeCypherNoNumberLink query="MATCH p = (d)-[r:Contains*1..]->(o:OU {guid:{name}}) RETURN p" target={this.state.guid} property="See OU Within Domain Tree" />
                    
                    <br />

                    <h4>Affecting GPOs</h4>
                    <NodeCypherLink property="GPOs Directly Affecting This OU" target={this.state.guid} baseQuery={"MATCH p=(n:GPO)-[r:GpLink]->(o:OU {guid:{name}})"} />
                    <NodeCypherLink property="GPOs Affecting This OU" target={this.state.guid} baseQuery={"MATCH p=(n:GPO)-[r:GpLink|Contains*1..]->(o:OU {guid:{name}})"} />

                    <h4>Descendant Objects</h4>
                    <NodeCypherLink property="Total User Objects" target={this.state.guid} baseQuery={"MATCH p=(o:OU {guid:{name}})-[r:Contains*1..]->(n:User)"} distinct />

                    <NodeCypherLink property="Total Group Objects" target={this.state.guid} baseQuery={"MATCH p=(o:OU {guid:{name}})-[r:Contains*1..]->(n:Group)"} distinct />

                    <NodeCypherLink property="Total Computer Objects" target={this.state.guid} baseQuery={"MATCH p=(o:OU {guid:{name}})-[r:Contains*1..]->(n:Computer)"} distinct />
                    
                    <NodeCypherLink property="Sibling Objects within OU" target={this.state.guid} baseQuery={"MATCH (o1)-[r1:Contains]->(o2:OU {guid:{name}}) WITH o1 MATCH p=(d)-[r2:Contains*1..]->(o1)-[r3:Contains]->(n)"} distinct />
                </dl>
            </div>
        );
    }
}

OuNodeData.propTypes = {
    visible: PropTypes.bool.isRequired
};