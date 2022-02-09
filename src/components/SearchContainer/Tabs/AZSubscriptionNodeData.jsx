import React, {useContext, useEffect, useState} from 'react';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import {Table} from 'react-bootstrap';
import styles from './NodeData.module.css';
import {AppContext} from '../../../AppContext';

const AZSubscriptionNodeData = () => {
    const [visible, setVisible] = useState(false);
    const [objectid, setObjectid] = useState(null);
    const [label, setLabel] = useState(null);
    const [domain, setDomain] = useState(null);
    const [nodeProps, setNodeProps] = useState({});
    const [blocksInheritance, setBlocksInheritance] = useState(false);
    const context = useContext(AppContext);

    useEffect(() => {
        emitter.on('nodeClicked', nodeClickEvent);

        return () => {
            emitter.removeListener('nodeClicked', nodeClickEvent);
        };
    }, []);

    const nodeClickEvent = (type, id, blocksinheritance, domain) => {
        if (type === 'AZSubscription') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            setBlocksInheritance(blocksinheritance);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:AZSubscription {objectid: $objectid}) RETURN n AS node`,
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
                                    query='MATCH p = (d:AZTenant)-[r:AZContains*1..]->(o:AZSubscription {objectid: $objectid}) RETURN p'
                                    target={objectid}
                                    property='See Subscription Under Tenant'
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

                <CollapsibleSection header='DESCENDENT OBJECTS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Total VM Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZSubscription {objectid: $objectid})-[r:AZContains*1..]->(n:AZVM)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Resource Group Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZSubscription {objectid: $objectid})-[r:AZContains*1..]->(n:AZResourceGroup)'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Total Key Vault Objects'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(o:AZSubscription {objectid: $objectid})-[r:AZContains*1..]->(n:AZKeyVault)'
                                    }
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                {/* <Notes objectid={objectid} type='AZSubscription' />
                <NodeGallery objectid={objectid} type='AZSubscription' visible={visible} /> */}
            </div>
        </div>
    );
};

AZSubscriptionNodeData.propTypes = {};
export default AZSubscriptionNodeData;
