import React, {useContext, useEffect, useState} from 'react';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLinkComplex from './Components/NodeCypherLinkComplex';
import NodeCypherLink from './Components/NodeCypherLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import {Table} from 'react-bootstrap';
import styles from './NodeData.module.css';
import {AppContext} from '../../../AppContext';

const GPONodeData = () => {
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
        if (type === 'GPO') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:GPO {objectid: $objectid}) RETURN n AS node`, {
                    objectid: id,
                })
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

    const displayMap = {
        objectid: 'Object ID',
        description: 'Description',
        gpcpath: 'GPO File Path',
    };

    return objectid === null ? (
        <div></div>
    ) : (
        <div
            className={clsx(
                !visible && 'displaynone',
                context.darkMode ? styles.dark : styles.light
            )}
        >
            <div className={clsx(styles.dl)}>
                <h5>{label || objectid}</h5>

                <CollapsibleSection header='OVERVIEW'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Reachable High Value Targets'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:GPO {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r:{}*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                                    }
                                    start={label}
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <MappedNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />

                <hr></hr>

                <ExtraNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />

                <hr></hr>

                <CollapsibleSection header='AFFECTED OBJECTS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Directly Affected OUs'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (m:GPO {objectid: $objectid})-[r:GpLink]->(n)'
                                    }
                                    start={label}
                                />
                                <NodeCypherLink
                                    property='Affected OUs'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (m:GPO {objectid: $objectid})-[r:GpLink|Contains*1..]->(n) WHERE n:OU OR n:Domain'
                                    }
                                    start={label}
                                />
                                <NodeCypherLinkComplex
                                    property='Computer Objects'
                                    target={objectid}
                                    countQuery={
                                        "MATCH (g:GPO {objectid: $objectid}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:Computer) WHERE NONE(x in NODES(p1) WHERE x.blocksinheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:Computer) RETURN count(n1) + count(n2)"
                                    }
                                    graphQuery={
                                        "MATCH (g:GPO {objectid: $objectid}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:Computer) WHERE NONE(x in NODES(p1) WHERE x.blocksinheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:Computer) RETURN p1,p2"
                                    }
                                />
                                <NodeCypherLinkComplex
                                    property='User Objects'
                                    target={objectid}
                                    countQuery={
                                        "MATCH (g:GPO {objectid: $objectid}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:User) WHERE NONE(x in NODES(p1) WHERE x.blocksinheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:User) RETURN count(n1) + count(n2)"
                                    }
                                    graphQuery={
                                        "MATCH (g:GPO {objectid: $objectid}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:User) WHERE NONE(x in NODES(p1) WHERE x.blocksinheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:User) RETURN p1,p2"
                                    }
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='INBOUND CONTROL RIGHTS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Explicit Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (n)-[r:AddMember|AddSelf|WriteSPN|AddKeyCredentialLink|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(g:GPO {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (n)-[r:MemberOf*1..]->(g1:Group)-[r1]->(g2:GPO {objectid:  $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = g2.name) AND NOT n.name = g2.name AND r1.isacl=true'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid= $objectid WITH n MATCH p = shortestPath((n)-[r:MemberOf|AddSelf|WriteSPN|AddKeyCredentialLink|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(g:GPO {objectid: $objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                {/* <Notes objectid={objectid} type='GPO' />
                <NodeGallery objectid={objectid} type='GPO' visible={visible} /> */}
            </div>
        </div>
    );
};

GPONodeData.propTypes = {};
export default GPONodeData;
