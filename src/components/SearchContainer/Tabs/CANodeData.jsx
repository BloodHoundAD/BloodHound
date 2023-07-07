/******************************************************************************************
* The credit goes to https://github.com/ly4k/BloodHound. Thank you for the excellent work!
*/
import clsx from 'clsx';
import React, { useContext, useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import { AppContext } from '../../../AppContext';
import CollapsibleSection from './Components/CollapsibleSection';
import ExtraNodeProps from './Components/ExtraNodeProps';
import MappedNodeProps from './Components/MappedNodeProps';
import NodeCypherLink from './Components/NodeCypherLink';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import styles from './NodeData.module.css';

const CANodeData = () => {
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
        if (type === 'CA') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            setBlocksInheritance(blocksinheritance);
            let session = driver.session();
            session
                .run(`MATCH (n:CA {objectid: $objectid}) RETURN n AS node`, {
                    objectid: id,
                })
                .then((r) => {
                    let props = r.records[0].get('node').properties;
                    setNodeProps(props);
                    setLabel(props.name);
                    session.close();
                });
        } else {
            setObjectid(null);
            setVisible(false);
        }
    };

    const displayMap = {
        objectid: 'Object ID',
        'CA Name': 'CA Name',
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
                                    query='MATCH p = (c:CA {objectid: $objectid})<-[r:EnabledBy]-(t:CertificateTemplate) RETURN p'
                                    target={objectid}
                                    property='See Enabled Templates'
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

                <CollapsibleSection header={'INBOUND CONTROL RIGHTS'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Explicit Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:ManageCa|ManageCertificates|Auditor|Operator|Owns]->(u1:CA {objectid: $objectid}) WHERE r.isacl=true'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1:ManageCa|ManageCertificates|Auditor|Operator|Owns]->(u:CA {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = u.objectid) AND NOT n.objectid = u.objectid'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header={'INBOUND ACCESS RIGHTS'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Access Rights'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:Read|Enroll]->(u1:CA {objectid: $objectid}) WHERE r.isacl=true'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated Access Rights'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1:Read|Enroll]->(u:CA {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = u.objectid) AND NOT n.objectid = u.objectid'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>
            </div>
        </div>
    );
};

CANodeData.propTypes = {};
export default CANodeData;
