import React, {useContext, useEffect, useState} from 'react';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLinkComplex from './Components/NodeCypherLinkComplex';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import NodeCypherLabel from './Components/NodeCypherLabel';
import {Table} from 'react-bootstrap';
import styles from './NodeData.module.css';
import {AppContext} from '../../../AppContext';

const DomainNodeData = () => {
    const [visible, setVisible] = useState(false);
    const [objectid, setObjectid] = useState(null);
    const [label, setLabel] = useState(null);
    const [domain, setDomain] = useState('');
    const [nodeProps, setNodeProps] = useState({});
    const context = useContext(AppContext);

    useEffect(() => {
        emitter.on('nodeClicked', nodeClickEvent);

        return () => {
            emitter.removeListener('nodeClicked', nodeClickEvent);
        };
    }, []);

    const nodeClickEvent = (type, id, blocksinheritance, domain) => {
        if (type === 'Domain') {
            setVisible(true);
            setObjectid(id);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:Domain {objectid: $objectid}) RETURN n AS node`,
                    {
                        objectid: id,
                    }
                )
                .then((r) => {
                    let props = r.records[0].get('node').properties;
                    setNodeProps(props);
                    setLabel(props.name || props.azname || objectid);
                    setDomain(props.name || objectid);
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
        functionallevel: 'Domain Functional Level',
        'ms-ds-machineaccountquota': 'Machine Account Quota',
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
                                <NodeCypherLabel
                                    property={'Users'}
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n:User) WHERE n.domain=$domain'
                                    }
                                    domain={domain}
                                />
                                <NodeCypherLabel
                                    property={'Groups'}
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n:Group) WHERE n.domain=$domain'
                                    }
                                    domain={domain}
                                />
                                <NodeCypherLabel
                                    property={'Computers'}
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n:Computer) WHERE n.domain=$domain'
                                    }
                                    domain={domain}
                                />
                                <NodeCypherLabel
                                    property={'OUs'}
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n:OU) WHERE n.domain=$domain'
                                    }
                                    domain={domain}
                                />
                                <NodeCypherLabel
                                    property={'GPOs'}
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n:GPO) WHERE n.domain=$domain'
                                    }
                                    domain={domain}
                                />
                                <NodeCypherNoNumberLink
                                    target={objectid}
                                    property='Map OU Structure'
                                    query='MATCH p = (d:Domain {objectid: $objectid})-[r:Contains*1..]->(n) RETURN p'
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>
                <MappedNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />
                <ExtraNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />

                <hr></hr>

                <CollapsibleSection header='FOREIGN MEMBERS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Foreign Users'
                                    target={domain}
                                    baseQuery={
                                        'MATCH (n:User) WHERE NOT n.domain=$objectid WITH n MATCH (b:Group) WHERE b.domain=$objectid WITH n,b MATCH p=(n)-[r:MemberOf]->(b)'
                                    }
                                />
                                <NodeCypherLink
                                    property='Foreign Groups'
                                    target={domain}
                                    baseQuery={
                                        'MATCH (n:Group) WHERE NOT n.domain=$objectid WITH n MATCH (b:Group) WHERE b.domain=$objectid WITH n,b MATCH p=(n)-[r:MemberOf]->(b)'
                                    }
                                />
                                <NodeCypherLinkComplex
                                    property='Foreign Admins'
                                    target={domain}
                                    countQuery={
                                        'OPTIONAL MATCH (u)-[:AdminTo]->(c {domain:$objectid}) WHERE NOT u.domain=$objectid OPTIONAL MATCH (u)-[:MemberOf*1..]->(:Group)-[:AdminTo]->(c {domain:$objectid}) WHERE NOT u.domain=$objectid RETURN count(distinct(u))'
                                    }
                                    graphQuery={
                                        'MATCH (u:User) WHERE NOT u.domain = $objectid OPTIONAL MATCH p1 = (u)-[:AdminTo]->(c {domain:$objectid}) OPTIONAL MATCH p2 = (u)-[:MemberOf*1..]->(:Group)-[:AdminTo]->(c {domain:$objectid}) RETURN p1,p2'
                                    }
                                />
                                <NodeCypherLink
                                    property='Foreign GPO Controllers'
                                    target={domain}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.domain=$objectid WITH n MATCH (b:GPO) WHERE b.domain=$objectid WITH n,b MATCH p=(n)-[r]->(b) WHERE r.isacl=true'
                                    }
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='INBOUND TRUSTS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Trusts'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(a:Domain {objectid: $objectid})<-[r:TrustedBy]-(n:Domain)'
                                    }
                                />
                                <NodeCypherLink
                                    property='Effective Inbound Trusts'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n:Domain) WHERE NOT n.objectid=$objectid WITH n MATCH p=shortestPath((a:Domain {objectid: $objectid})<-[r:TrustedBy*1..]-(n))'
                                    }
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='OUTBOUND TRUSTS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Trusts'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(a:Domain {objectid: $objectid})-[r:TrustedBy]->(n:Domain)'
                                    }
                                />
                                <NodeCypherLink
                                    property='Effective Outbound Trusts'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n:Domain) WHERE NOT n.objectid=$objectid MATCH p=shortestPath((a:Domain {objectid: $objectid})-[r:TrustedBy*1..]->(n))'
                                    }
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='INBOUND CONTROL RIGHTS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r]->(u:Domain {objectid: $objectid}) WHERE r.isacl=true'
                                    }
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1]->(u:Domain {objectid: $objectid}) WHERE r1.isacl=true'
                                    }
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=shortestPath((n)-[r1:MemberOf|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(u:Domain {objectid: $objectid})) WHERE NOT n.objectid=$objectid'
                                    }
                                    distinct
                                />
                                <NodeCypherLinkComplex
                                    property='Calculated Principals with DCSync Privileges'
                                    target={objectid}
                                    countQuery={
                                        'MATCH (n1)-[:MemberOf|GetChanges*1..]->(u:Domain {objectid: $objectid}) WITH n1,u MATCH (n1)-[:MemberOf|GetChangesAll*1..]->(u) WITH n1,u MATCH p = (n1)-[:MemberOf|GetChanges|GetChangesAll*1..]->(u) RETURN COUNT(DISTINCT(n1))'
                                    }
                                    graphQuery={
                                        'MATCH (n1)-[:MemberOf|GetChanges*1..]->(u:Domain {objectid: $objectid}) WITH n1,u MATCH (n1)-[:MemberOf|GetChangesAll*1..]->(u) WITH n1,u MATCH p = (n1)-[:MemberOf|GetChanges|GetChangesAll*1..]->(u) RETURN p'
                                    }
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                {/* <Notes objectid={objectid} type={'Domain'} />
                <NodeGallery
                    objectid={objectid}
                    type={'Domain'}
                    visible={visible}
                /> */}
            </div>
        </div>
    );
};

DomainNodeData.propTypes = {};
export default DomainNodeData;
