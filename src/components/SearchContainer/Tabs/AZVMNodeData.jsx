import React, { useContext, useEffect, useState } from 'react';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLinkComplex from './Components/NodeCypherLinkComplex';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import { Table } from 'react-bootstrap';
import styles from './NodeData.module.css';
import { AppContext } from '../../../AppContext';

const AZVMNodeData = () => {
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
        if (type === 'AZVM') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:AZVM {objectid: $objectid}) RETURN n AS node`, {
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
        operatingsystem: 'OS',
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
                                <NodeCypherNoNumberLink
                                    target={objectid}
                                    property='See VM within Tenant'
                                    query='MATCH p = (d:AZTenant)-[r:AZContains*1..]->(u:AZVM {objectid: $objectid}) RETURN p'
                                />
                                <NodeCypherLink
                                    baseQuery={
                                        'MATCH p=(:AZVM {objectid:$objectid})-[:AZManagedIdentity]->(n)'
                                    }
                                    property={'Managed Identities'}
                                    target={objectid}
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

                <CollapsibleSection header={'LOCAL ADMINS'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Explicit Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[b:AdminTo]->(c:AZVM {objectid: $objectid})'
                                    }
                                    end={label}
                                />
                                <NodeCypherLink
                                    property='Unrolled Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:MemberOf|AdminTo*1..]->(m:AZVM {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLinkComplex
                                    property='Foreign Admins'
                                    target={objectid}
                                    countQuery={
                                        'MATCH (c:AZVM {objectid: $objectid}) OPTIONAL MATCH (u1)-[:AdminTo]->(c) WHERE NOT u1.domain = c.domain WITH u1,c OPTIONAL MATCH (u2)-[:MemberOf*1..]->(:Group)-[:AdminTo]->(c) WHERE NOT u2.domain = c.domain WITH COLLECT(u1) + COLLECT(u2) as tempVar,c UNWIND tempVar as principals RETURN COUNT(DISTINCT(principals))'
                                    }
                                    graphQuery={
                                        'MATCH (c:AZVM {objectid: $objectid}) OPTIONAL MATCH p1 = (u1)-[:AdminTo]->(c) WHERE NOT u1.domain = c.domain WITH p1,c OPTIONAL MATCH p2 = (u2)-[:MemberOf*1..]->(:Group)-[:AdminTo]->(c) WHERE NOT u2.domain = c.domain RETURN p1,p2'
                                    }
                                />
                                <NodePlayCypherLink
                                    property='Derivative Local Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r:AdminTo|MemberOf|HasSession*1..]->(m:AZVM {objectid: $objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header={'INBOUND EXECUTION PRIVILEGES'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Execution Rights'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:AZAvereContributor|AZVMContributor|AZContributor]->(m:AZVM {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated Execution Rights'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r1:AZMemberOf]->(g)-[r:AZAvereContributor|AZVMContributor|AZContributor]->(m:AZVM {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header={'INBOUND OBJECT CONTROL'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Explicit Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:AZAvereContributor|AZVMContributor|AZContributor|AZUserAccessAdministrator|AZOwns]->(c:AZVM {objectid:$objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:AZMemberOf]->(g)-[r1:AZAvereContributor|AZVMContributor|AZContributor|AZUserAccessAdministrator|AZOwns]->(c:AZVM {objectid:$objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r1*1..]->(c:AZVM {objectid:$objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                {/* <Notes objectid={objectid} type='AZVM' />
                <NodeGallery
                    objectid={objectid}
                    type='AZVM'
                    visible={visible}
                /> */}
            </div>
        </div>
    );
};

AZVMNodeData.propTypes = {};
export default AZVMNodeData;
