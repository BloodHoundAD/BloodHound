import React, { useEffect, useState, useRef, useContext } from 'react';
import { AppContext } from '../../../AppContext';
import clsx from 'clsx';
import styles from './NodeData.module.css';
import CollapsibleSection from './Components/CollapsibleSection';
import { Table } from 'react-bootstrap';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeDisplayLink from './Components/NodeDisplayLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import { withAlert } from 'react-alert';

const AZManagementGroupNodeData = ({}) => {
    const [visible, setVisible] = useState(false);
    const [objectid, setobjectid] = useState(null);
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
        if (type === 'AZManagementGroup') {
            setVisible(true);
            setobjectid(id);
            setDomain(domain);
            let loadData = async () => {
                let session = driver.session();
                let results = await session.run(
                    `MATCH (n:AZManagementGroup {objectid: $objectid}) RETURN n AS node`,
                    {
                        objectid: id,
                    }
                );

                let props = results.records[0].get('node').properties;
                setNodeProps(props);
                setLabel(props.name || props.azname || objectid);
            };

            loadData();
        } else {
            setobjectid(null);
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

                <CollapsibleSection header='OVERVIEW'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Reachable High Value Targets'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:AZManagementGroup {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
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

                <CollapsibleSection header='DESCENDANT OBJECTS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Total Management Groups'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZManagementGroup)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Subscription Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZSubscription)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Resource Group Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZResourceGroup)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Automation Account Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZAutomationAccount)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Container Registry Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZContainerRegistry)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Function App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZFunctionApp)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Key Vault Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZKeyVault)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Logic App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZLogicApp)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Managed Cluster Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZManagedCluster)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total VM Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZVM)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total VM Scale Set Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZVMScaleSet)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Web App Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZManagementGroup {objectid: $objectid})-[r:AZContains*1..]->(n:AZWebApp)'
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
                                        'MATCH p = (n)-[r:AZOwns|AZUserAccessAdministrator]->(g:AZManagementGroup {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (n)-[r:AZMemberOf]->(g1)-[r1:AZOwns|AZUserAccessAdministrator]->(g2:AZManagementGroup {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = g2.objectid) AND NOT n.objectid = g2.objectid'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r*1..]->(g:AZManagementGroup {objectid: $objectid}))'
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

export default withAlert()(AZManagementGroupNodeData);
