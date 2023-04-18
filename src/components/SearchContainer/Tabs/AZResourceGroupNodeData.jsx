import React, { useContext, useEffect, useState } from 'react';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLink from './Components/NodeCypherLink';
import MappedNodeProps from './Components/MappedNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import { Table } from 'react-bootstrap';
import styles from './NodeData.module.css';
import { AppContext } from '../../../AppContext';

const AZResourceGroupNodeData = () => {
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
        if (type === 'AZResourceGroup') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:AZResourceGroup {objectid: $objectid}) RETURN n AS node`,
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

    const displayMap = {
        objectid: 'Object ID',
        tenantid: 'Tenant ID',
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

                <MappedNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />

                <hr></hr>

                <CollapsibleSection header='DESCENDANT OBJECTS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Total Automation Account Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZAutomationAccount)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Container Registry Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZContainerRegistry)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Function App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZFunctionApp)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Key Vault Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZKeyVault)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Logic App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZLogicApp)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Managed Cluster Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZManagedCluster)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total VM Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZVM)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total VM Scale Set Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZVMScaleSet)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Web App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZResourceGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZWebApp)'
                                    }
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='INBOUND OBJECT CONTROL'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Explicit Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (n)-[r:AZOwns|AZUserAccessAdministrator]->(g:AZResourceGroup {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (n)-[r:AZMemberOf]->(g1)-[r1:AZOwns|AZUserAccessAdministrator]->(g2:AZResourceGroup {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = g2.objectid) AND NOT n.objectid = g2.objectid'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r*1..]->(g:AZResourceGroup {objectid: $objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>
                {/* <Notes objectid={objectid} type='AZResourceGroup' />
                <NodeGallery
                    objectid={objectid}
                    type='AZResourceGroup'
                    visible={visible}
                /> */}
            </div>
        </div>
    );
};

AZResourceGroupNodeData.propTypes = {};
export default AZResourceGroupNodeData;
