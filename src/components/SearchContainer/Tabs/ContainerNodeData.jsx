import React, {useContext, useEffect, useState} from 'react';
import {AppContext} from '../../../AppContext';
import CollapsibleSection from './Components/CollapsibleSection';
import ExtraNodeProps from './Components/ExtraNodeProps';
import MappedNodeProps from './Components/MappedNodeProps';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import styles from './NodeData.module.css';
import clsx from 'clsx';
import {Table} from "react-bootstrap";

const ContainerNodeData = ({}) => {
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
        if (type === 'Container') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:Container {objectid: $objectid}) RETURN n AS node`, {
                    objectid: id,
                })
                .then((r) => {
                    let props = r.records[0].get('node').properties;
                    setNodeProps(props);
                    setLabel([...props.name] || objectid);
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
    };

    return objectid == null ? (<div></div>) : (
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
                                query='MATCH p = ()-[r:Contains*1..]->(:Container {objectid: $objectid}) RETURN p'
                                target={objectid}
                                property='See Container Within Domain Tree'
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

                <CollapsibleSection header='Affecting GPOs'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                            <NodeCypherLink
                                property='GPOs Directly Affecting This Container'
                                target={objectid}
                                baseQuery={
                                    'MATCH p=(n:GPO)-[r:GpLink]->(o:Container {objectid: $objectid})'
                                }
                            />
                            <NodeCypherLink
                                property='GPOs Affecting This Container'
                                target={objectid}
                                baseQuery={
                                    'MATCH p=(n:GPO)-[r:GpLink|Contains*1..]->(o:Container {objectid: $objectid})'
                                }
                            />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='Descendant Objects'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                            <NodeCypherLink
                                property='Total User Objects'
                                target={objectid}
                                baseQuery={
                                    'MATCH p=(o:Container {objectid: $objectid})-[r:Contains*1..]->(n:User)'
                                }
                                distinct
                            />
                            <NodeCypherLink
                                property='Total Group Objects'
                                target={objectid}
                                baseQuery={
                                    'MATCH p=(o:Container {objectid: $objectid})-[r:Contains*1..]->(n:Group)'
                                }
                                distinct
                            />
                            <NodeCypherLink
                                property='Total Computer Objects'
                                target={objectid}
                                baseQuery={
                                    'MATCH p=(o:Container {objectid: $objectid})-[r:Contains*1..]->(n:Computer)'
                                }
                                distinct
                            />
                            <NodeCypherLink
                                property='Sibling Objects within Container'
                                target={objectid}
                                baseQuery={
                                    'MATCH (o1)-[r1:Contains]->(o2:Container {objectid: $objectid}) WITH o1 MATCH p=(d)-[r2:Contains*1..]->(o1)-[r3:Contains]->(n)'
                                }
                                distinct
                            />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>
            </div>
        </div>
    )
}

export default ContainerNodeData;