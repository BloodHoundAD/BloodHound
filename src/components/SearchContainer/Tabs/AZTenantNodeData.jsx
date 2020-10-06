import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLinkComplex from './Components/NodeCypherLinkComplex';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import Notes from './Components/Notes';
import { withAlert } from 'react-alert';
import NodeGallery from './Components/NodeGallery';
import { Table } from 'react-bootstrap';
import styles from './NodeData.module.css';
import { useContext } from 'react';
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
                    setLabel(props.name || objectid);
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
                                    property='Subscriptions'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZSubscription)'
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
                                    property='Total Resource Group Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZResourceGroup)'
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
                                    property='Total User Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZTenant {objectid: $objectid})-[r:AZContains*1..]->(n:AZUser)'
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
