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

const AZManagedClusterNodeData = () => {
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
        if (type === 'AZManagedCluster') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:AZManagedCluster {objectid: $objectid}) RETURN n AS node`, {
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
                                    property='See Managed Cluster within Tenant'
                                    query='MATCH p = (d:AZTenant)-[r:AZContains*1..]->(u:AZManagedCluster {objectid: $objectid}) RETURN p'
                                />
                                <NodeCypherLinkComplex
                                    property={'Managed Identities'}
                                    target={objectid}
                                    countQuery={
                                        'MATCH (n:AZManagedCluster {objectid: $objectid}) OPTIONAL MATCH p1 = (n)-[:AZManagedIdentity]->(sp1:AZServicePrincipal) OPTIONAL MATCH p2 = (n)-[:AZNodeResourceGroup]->(:AZResourceGroup)-[:AZContains]->(:AZVMScaleSet)-[:AZManagedIdentity]->(sp2:AZServicePrincipal) WITH COLLECT(sp1) + COLLECT(sp2) AS tempVar UNWIND tempVar AS ServicePrincipals RETURN COUNT(DISTINCT(ServicePrincipals))'
                                    }
                                    graphQuery={
                                        'MATCH (n:AZManagedCluster {objectid: $objectid}) OPTIONAL MATCH p1 = (n)-[:AZManagedIdentity]->(sp1:AZServicePrincipal) OPTIONAL MATCH p2 = (n)-[:AZNodeResourceGroup]->(:AZResourceGroup)-[:AZContains]->(:AZVMScaleSet)-[:AZManagedIdentity]->(sp2:AZServicePrincipal) RETURN p1,p2'
                                    }
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

                <CollapsibleSection header={'INBOUND OBJECT CONTROL'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Explicit Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:AZAKSClusterContributor|AZContributor|AZUserAccessAdministrator|AZOwns]->(c:AZManagedCluster {objectid:$objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:AZMemberOf]->(g)-[r1:AZManagedClusterContributor|AZContributor|AZUserAccessAdministrator|AZOwns]->(c:AZManagedCluster {objectid:$objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r1*1..]->(c:AZManagedCluster {objectid:$objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

            </div>
        </div>
    );
};

AZManagedClusterNodeData.propTypes = {};
export default AZManagedClusterNodeData;
