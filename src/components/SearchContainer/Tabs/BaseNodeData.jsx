import React, {useContext, useEffect, useState} from 'react';
import clsx from "clsx";
import styles from './NodeData.module.css';
import CollapsibleSection from "./Components/CollapsibleSection";
import {Table} from "react-bootstrap";
import NodeCypherLink from "./Components/NodeCypherLink";
import NodeCypherLinkComplex from "./Components/NodeCypherLinkComplex";
import NodeCypherNoNumberLink from "./Components/NodeCypherNoNumberLink";
import {AppContext} from '../../../AppContext';

const BaseNodeData = ({}) => {
    const [visible, setVisible] = useState(false);
    const [objectid, setObjectid] = useState(null);
    const [label, setLabel] = useState(null);
    const [domain, setDomain] = useState(null);
    const [nodeProps, setNodeProps] = useState({});
    const context = useContext(AppContext);

    useEffect(() => {
        emitter.on('nodeClicked', nodeClickEvent);

        return () => {
            emitter.removeListener('nodeClicked', nodeClickEvent);
        };
    }, []);

    const nodeClickEvent = (type, id, blocksinheritance, domain) => {
        if (type === 'Base') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:Base {objectid: $objectid}) RETURN n AS node`,
                    {
                        objectid: id,
                    }
                )
                .then((r) => {
                    let props = r.records[0].get('node').properties;
                    setNodeProps(props);
                    setLabel(props.name || props.azname || objectid);
                    session.close();
                });
        } else {
            setObjectid(null);
            setVisible(false);
        }
    };

    return objectid === null ? (
        <div>
        </div>
    ) : (
        <div className={clsx(!visible && 'displaynone', context.darkMode ? styles.dark : styles.light)}>
            <div className={styles.dl}>
                <h5>{label || objectid}</h5>
            </div>

            <CollapsibleSection header={'OVERVIEW'}>
                <div className={styles.itemlist}>
                    <Table>
                        <thead></thead>
                        <tbody className='searchable'>
                        <NodeCypherLink
                            property='Reachable High Value Targets'
                            target={objectid}
                            baseQuery={
                                'MATCH (m:Base {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r:{}*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                            }
                            start={label}
                        />
                        <NodeCypherLinkComplex
                            property='Sibling Objects in the Same OU'
                            target={objectid}
                            countQuery={
                                'MATCH (o1)-[r1:Contains]->(o2:Base {objectid: $objectid}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN count(distinct(n))'
                            }
                            graphQuery={
                                'MATCH (o1)-[r1:Contains]->(o2:Base {objectid: $objectid}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN p1,p2'
                            }
                        />
                        <NodeCypherLinkComplex
                            property='Effective Inbound GPOs'
                            target={objectid}
                            countQuery={
                                'MATCH (c:Base {objectid: $objectid}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) WITH COLLECT(g1) + COLLECT(g2) AS tempVar UNWIND tempVar AS GPOs RETURN COUNT(DISTINCT(GPOs))'
                            }
                            graphQuery={
                                'MATCH (c:Base {objectid: $objectid}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN p1,p2'
                            }
                        />
                        <NodeCypherNoNumberLink
                            target={objectid}
                            property='See Object within Domain/OU Tree'
                            query='MATCH p = (d:Domain)-[r:Contains*1..]->(u:Base {objectid: $objectid}) RETURN p'
                        />
                        </tbody>
                    </Table>
                </div>
            </CollapsibleSection>
        </div>
    )
}

export default BaseNodeData;