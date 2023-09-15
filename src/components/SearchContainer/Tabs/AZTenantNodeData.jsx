import React, { useContext, useEffect, useState } from 'react';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLink from './Components/NodeCypherLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import { Table } from 'react-bootstrap';
import styles from './NodeData.module.css';
import { AppContext } from '../../../AppContext';

const AZTenantNodeData = () => {
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
        if (type === 'AZTenant') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:AZTenant {objectid: $objectid}) RETURN n AS node`,
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
        displayname: 'Display Name',
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

                <ExtraNodeProps
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
                                    property='Total Management Groups'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZManagementGroup)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Subscription Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZSubscription)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Resource Group Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZResourceGroup)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Automation Account Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZAutomationAccount)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Container Registry Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZContainerRegistry)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Function App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZFunctionApp)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Key Vault Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZKeyVault)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Logic App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZLogicApp)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Managed Cluster Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZManagedCluster)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total VM Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZVM)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total VM Scale Set Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZVMScaleSet)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Web App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZWebApp)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZApp)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Device Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZDevice)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Group Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZGroup)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Role Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZRole)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Service Principal Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZServicePrincipal)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total User Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZUser)'
                                    }
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='INBOUND CONTROL'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Global Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:AZGlobalAdmin]->(o:AZTenant {objectid: $objectid})'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Privileged Role Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:AZPrivilegedRoleAdmin]->(o:AZTenant {objectid: $objectid})'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='MS Graph Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:AZMGGrantAppRoles]->(o:AZTenant {objectid: $objectid})'
                                    }
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r*1..]->(g:AZTenant {objectid: $objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                {/* <Notes objectid={objectid} type='AZTenant' />
                <NodeGallery objectid={objectid} type='AZTenant' visible={visible} /> */}
            </div>
        </div>
    );
};

AZTenantNodeData.propTypes = {};
export default AZTenantNodeData;
