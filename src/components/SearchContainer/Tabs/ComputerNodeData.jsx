import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLinkComplex from './Components/NodeCypherLinkComplex';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import MappedNodeProps from './MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import Notes from './Components/Notes';
import { withAlert } from 'react-alert';
import NodeGallery from './Components/NodeGallery';

const ComputerNodeData = () => {
    const [visible, setVisible] = useState(false);
    const [objectid, setObjectid] = useState(null);
    const [label, setLabel] = useState(null);
    const [domain, setDomain] = useState(null);
    const [nodeProps, setNodeProps] = useState({});

    useEffect(() => {
        emitter.on('nodeClicked', nodeClickEvent);

        return () => {
            emitter.removeListener('nodeClicked', nodeClickEvent);
        };
    }, []);

    const nodeClickEvent = (type, id, blocksinheritance) => {
        if (type === 'Computer') {
            setVisible(true);
            setObjectId(id);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:Computer {objectid: $objectid}) RETURN n AS node`,
                    {
                        objectid: id,
                    }
                )
                .then(r => {
                    let props = r.records[0].get('node').properties;
                    setNodeProps(props);
                    setLabel(props.name);
                    setDomain(props.domain);
                    session.close();
                });
        } else {
            setObjectId(null);
            setVisible(false);
        }
    };

    const displayMap = {
        operatingsystem: 'OS',
        enabled: 'Enabled',
        unconstraineddelegation: 'Allows Unconstrained Delegation',
        owned: 'Compromised',
        haslaps: 'LAPS Enabled',
        pwdlastset: 'Password Last Changed',
        lastlogon: 'Last Logon',
    };

    return objectid === null ? (
        <div></div>
    ) : (
        <div className={clsx(!visible && 'displaynone')}>
            <NodeCypherLink
                property='Sessions'
                target={objectid}
                baseQuery={
                    "MATCH p=(m:Computer {objectid: $objectid})-[r:HasSession]->(n:User) WHERE NOT n.objectid ENDS WITH '$'"
                }
                start={label}
                distinct
            />

            <NodeCypherLink
                property='Reachable High Value Targets'
                target={objectid}
                baseQuery={
                    'MATCH (m:Computer {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                }
                start={label}
            />

            <NodeCypherLinkComplex
                property='Sibling Objects in the Same OU'
                target={objectid}
                countQuery={
                    'MATCH (o1)-[r1:Contains]->(o2:Computer {objectid: $objectid}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN count(distinct(n))'
                }
                graphQuery={
                    'MATCH (o1)-[r1:Contains]->(o2:Computer {objectid: $objectid}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN p1,p2'
                }
            />

            <NodeCypherLinkComplex
                property='Effective Inbound GPOs'
                target={objectid}
                countQuery={
                    'MATCH (c:Computer {objectid: $objectid}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN count(g1)+count(g2)'
                }
                graphQuery={
                    'MATCH (c:Computer {objectid: $objectid}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN p1,p2'
                }
            />

            <NodeCypherNoNumberLink
                target={objectid}
                property='See Computer within Domain/OU Tree'
                query='MATCH p = (d:Domain)-[r:Contains*1..]->(u:Computer {objectid: $objectid}) RETURN p'
            />

            <MappedNodeProps
                displayMap={displayMap}
                properties={nodeProps}
                label={label}
            />
            <ExtraNodeProps
                displayMap={displayMap}
                properties={nodeProps}
                label={label}
            />
        </div>
    );
};

ComputerNodeData.propTypes = {};
export default ComputerNodeData;
