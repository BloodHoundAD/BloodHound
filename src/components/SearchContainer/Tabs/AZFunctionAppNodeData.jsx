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

const AZFunctionAppNodeData = () => {
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
        if (type === 'AZFunctionApp') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:AZFunctionApp {objectid: $objectid}) RETURN n AS node`, {
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
                                    property='See Function App within Tenant'
                                    query='MATCH p = (d:AZTenant)-[r:AZContains*1..]->(u:AZFunctionApp {objectid: $objectid}) RETURN p'
                                />
                                <NodeCypherNoNumberLink
                                    target={objectid}
                                    property='See Function App within Resource group'
                                    query='MATCH p = (d:AZResourceGroup)-[r:AZContains*1..]->(u:AZFunctionApp {objectid: $objectid}) RETURN p'
                                />
                                <NodeCypherLinkComplex
                                    countQuery={
                                        'MATCH p=(:AZFunctionApp {objectid:$objectid})-[:AZManagedIdentity]->(n) RETURN COUNT(p)'
                                    }
                                    graphQuery={
                                        'MATCH p=(:AZFunctionApp {objectid:$objectid})-[:AZManagedIdentity]->(n) RETURN p'
                                    }
                                    start={label}
                                    property={'Managed Identities'}
                                    target={objectid}
                                    distinct
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

                <CollapsibleSection header='Role Assignments'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLinkComplex
                                    countQuery={
                                        'MATCH p = (d)-[r:AZOwns*1..]->(u:AZFunctionApp {objectid: $objectid}) RETURN COUNT(p)'
                                    }
                                    graphQuery={
                                        'MATCH p = (d)-[r:AZOwns*1..]->(u:AZFunctionApp {objectid: $objectid}) RETURN p'
                                    }
                                    property={'Function App Owners'}
                                    target={objectid}
                                />
                                <NodeCypherLinkComplex
                                    countQuery={
                                        'MATCH p = (d)-[r:AZContributor*1..]->(u:AZFunctionApp {objectid: $objectid}) RETURN COUNT(p)'
                                    }
                                    graphQuery={
                                        'MATCH p = (d)-[r:AZContributor*1..]->(u:AZFunctionApp {objectid: $objectid}) RETURN p'
                                    }
                                    property={'Function App Contributors'}
                                    target={objectid}
                                />
                                <NodeCypherLinkComplex
                                    countQuery={
                                        'MATCH p = (d)-[r:AZUserAccessAdministrator*1..]->(u:AZFunctionApp {objectid: $objectid}) RETURN COUNT(p)'
                                    }
                                    graphQuery={
                                        'MATCH p = (d)-[r:AZUserAccessAdministrator*1..]->(u:AZFunctionApp {objectid: $objectid}) RETURN p'
                                    }
                                    property={'Function App User Access Administrators'}
                                    target={objectid}
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>
                
            </div>
        </div>
    );
};

AZFunctionAppNodeData.propTypes = {};
export default AZFunctionAppNodeData;
