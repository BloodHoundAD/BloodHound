import React, {useContext, useEffect, useState} from 'react';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLinkComplex from './Components/NodeCypherLinkComplex';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import {Table} from 'react-bootstrap';
import styles from './NodeData.module.css';
import {AppContext} from '../../../AppContext';

const ComputerNodeData = () => {
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
        if (type === 'Computer') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:Computer {objectid: $objectid}) RETURN n AS node`,
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
        operatingsystem: 'OS',
        enabled: 'Enabled',
        unconstraineddelegation: 'Allows Unconstrained Delegation',
        owned: 'Compromised',
        haslaps: 'LAPS Enabled',
        pwdlastset: 'Password Last Changed',
        lastlogon: 'Last Logon',
        lastlogontimestamp: 'Last Logon (Replicated)',
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
                                    property='Sessions'
                                    target={objectid}
                                    baseQuery={
                                        "MATCH p=(m:Computer {objectid: $objectid})-[r:HasSession]->(n:User) WHERE NOT n.objectid ENDS WITH '$'"
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Reachable High Value Targets'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:Computer {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r:{}*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                                    }
                                    start={label}
                                />
                                <NodeCypherLinkComplex
                                    property='Sibling Objects in the Same OU'
                                    target={objectid}
                                    countQuery={
                                        'MATCH (o1)-[r1:Contains]->(o2:Computer {objectid: $objectid}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN count(distinct(n))'
                                    }
                                    graphQuery={
                                        'MATCH (o1)-[r1:Contains]->(o2:Computer {objectid: $objectid}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN p1,p2'
                                    }
                                />
                                <NodeCypherLinkComplex
                                    property='Effective Inbound GPOs'
                                    target={objectid}
                                    countQuery={
                                        'MATCH (c:Computer {objectid: $objectid}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) WITH COLLECT(g1) + COLLECT(g2) AS tempVar UNWIND tempVar AS GPOs RETURN COUNT(DISTINCT(GPOs))'
                                    }
                                    graphQuery={
                                        'MATCH (c:Computer {objectid: $objectid}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN p1,p2'
                                    }
                                />
                                <NodeCypherNoNumberLink
                                    target={objectid}
                                    property='See Computer within Domain/OU Tree'
                                    query='MATCH p = (d:Domain)-[r:Contains*1..]->(u:Computer {objectid: $objectid}) RETURN p'
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

                <CollapsibleSection header={'Local Admins'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Explicit Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[b:AdminTo]->(c:Computer {objectid: $objectid})'
                                    }
                                    end={label}
                                />
                                <NodeCypherLink
                                    property='Unrolled Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:MemberOf|AdminTo*1..]->(m:Computer {objectid: $objectid}) WHERE NOT n:Group'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLinkComplex
                                    property='Foreign Admins'
                                    target={objectid}
                                    countQuery={
                                        'MATCH (c:Computer {objectid: $objectid}) OPTIONAL MATCH (u1)-[:AdminTo]->(c) WHERE NOT u1.domain = c.domain WITH u1,c OPTIONAL MATCH (u2)-[:MemberOf*1..]->(:Group)-[:AdminTo]->(c) WHERE NOT u2.domain = c.domain WITH COLLECT(u1) + COLLECT(u2) as tempVar,c UNWIND tempVar as principals RETURN COUNT(DISTINCT(principals))'
                                    }
                                    graphQuery={
                                        'MATCH (c:Computer {objectid: $objectid}) OPTIONAL MATCH p1 = (u1)-[:AdminTo]->(c) WHERE NOT u1.domain = c.domain WITH p1,c OPTIONAL MATCH p2 = (u2)-[:MemberOf*1..]->(:Group)-[:AdminTo]->(c) WHERE NOT u2.domain = c.domain RETURN p1,p2'
                                    }
                                />
                                <NodePlayCypherLink
                                    property='Derivative Local Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r:AdminTo|MemberOf|HasSession*1..]->(m:Computer {objectid: $objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection header={'INBOUND EXECUTION RIGHTS'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Remote Desktop Users'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:CanRDP]->(m:Computer {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated Remote Desktop Users'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r1:MemberOf*1..]->(g:Group)-[r:CanRDP]->(m:Computer {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='First Degree Distributed COM Users'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:ExecuteDCOM]->(m:Computer {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated Distributed COM Users'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r1:MemberOf*1..]->(g:Group)-[r:ExecuteDCOM]->(m:Computer {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='SQL Admins'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n:User)-[r:SQLAdmin]->(m:Computer {objectid: $objectid})'
                                    }
                                    start={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection header={'GROUP MEMBERSHIP'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Group Membership'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:Computer {objectid: $objectid}),(n:Group), p=(m)-[r:MemberOf]->(n)'
                                    }
                                    start={label}
                                />
                                <NodeCypherLink
                                    property='Unrolled Group Membership'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(c:Computer {objectid: $objectid})-[r:MemberOf*1..]->(n:Group)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Foreign Group Membership'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(c:Computer {objectid: $objectid})-[r:MemberOf*1..]->(n:Group) WHERE NOT n.domain = c.domain'
                                    }
                                    start={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection header={'LOCAL ADMIN RIGHTS'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Local Admin'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:Computer {objectid: $objectid}), (n:Computer), p=(m)-[r:AdminTo]->(n)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated Local Admin'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(m:Computer {objectid: $objectid})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(n:Computer) WHERE NOT n.objectid=$objectid'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Derivative Local Admin'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:Computer {objectid: $objectid}), (n:Computer) WHERE NOT n.objectid=$objectid MATCH p=shortestPath((m)-[r:AdminTo|MemberOf*1..]->(n))'
                                    }
                                    start={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection header={'OUTBOUND EXECUTION RIGHTS'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree RDP Privileges'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(m:Computer {objectid: $objectid})-[r:CanRDP]->(n:Computer)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated RDP Privileges'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(m:Computer {objectid: $objectid})-[r1:MemberOf*1..]->(g:Group)-[r2:CanRDP]->(n:Computer)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='First Degree DCOM Privileges'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(m:Computer {objectid: $objectid})-[r:ExecuteDCOM]->(n:Computer)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated DCOM Privileges'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(m:Computer {objectid: $objectid})-[r1:MemberOf*1..]->(g:Group)-[r2:ExecuteDCOM]->(n:Computer)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Constrained Delegation Privileges'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(m:Computer {objectid: $objectid})-[r:AllowedToDelegate]->(n:Computer)'
                                    }
                                    start={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection header={'INBOUND CONTROL RIGHTS'}>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Explicit Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r]->(u1:Computer {objectid:$objectid}) WHERE r.isacl=true'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1:AddMember|AddSelf|WriteSPN|AddKeyCredentialLink|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(u:Computer {objectid:$objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = u.objectid) AND NOT n.objectid = u.objectid'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r1:MemberOf|AllExtendedRights|AddSelf|WriteSPN|AddKeyCredentialLink|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:Computer {objectid:$objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection header='OUTBOUND OBJECT CONTROL'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Object Control'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (c:Computer {objectid: $objectid})-[r]->(n) WHERE r.isacl=true'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated Object Control'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (c:Computer {objectid: $objectid})-[r1:MemberOf*1..]->(g:Group)-[r2]->(n) WHERE r2.isacl=true'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Control'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((c:Computer {objectid: $objectid})-[r:MemberOf|AddMember|AddSelf|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(n))'
                                    }
                                    start={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>
                {/* <Notes objectid={objectid} type='Computer' />
                <NodeGallery
                    objectid={objectid}
                    type='Computer'
                    visible={visible}
                /> */}
            </div>
        </div>
    );
};

ComputerNodeData.propTypes = {};
export default ComputerNodeData;
