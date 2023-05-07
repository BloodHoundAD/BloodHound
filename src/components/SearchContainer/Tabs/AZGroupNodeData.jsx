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

const AZGroupNodeData = () => {
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
        if (type === 'AZGroup') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:AZGroup {objectid: $objectid}) RETURN n AS node`,
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
        description: 'Description',
        isassignabletorole: 'Is Role Eligible',
        displayname: 'Display Name',
        whencreated: 'Creation Time',
        securityenabled: 'Security Enabled',
        groupTypes: 'Group Types',
        membershipRule: 'Membership Rule',
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
                                        'MATCH (m:AZGroup {objectid: $objectid}),(n),p = ((n)-[r:HasSession*1..]->(u)-[:AZMemberOf*1..]->(m))'
                                    }
                                    start={label}
                                />
                                <NodeCypherLink
                                    baseQuery={
                                        'MATCH p=(:AZGroup {objectid: $objectid})-[:AZMemberOf|AZHasRole*1..]->(n:AZRole)'
                                    }
                                    property={'Azure AD Admin Roles'}
                                    target={objectid}
                                />
                                <NodeCypherLink
                                    property='Reachable High Value Targets'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:AZGroup {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
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

                <CollapsibleSection header='GROUP MEMBERS'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='Direct Members'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(n)-[b:AZMemberOf]->(c:AZGroup {objectid: $objectid}) WHERE n:AZUser OR n:AZGroup OR n:AZDevice'
                                    }
                                    end={label}
                                />
                                <NodeCypherLink
                                    property='Unrolled Members'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p =(n)-[r:AZMemberOf*1..]->(g:AZGroup {objectid: $objectid}) WHERE n:AZUser OR n:AZGroup OR n:AZDevice'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='On-Prem Members'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (n)-[r:MemberOf*1..]->(g:AZGroup {objectid: $objectid}) WHERE n:User OR n:Group OR n:Computer'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='GROUP MEMBERSHIP'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Group Membership'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(g1:AZGroup {objectid: $objectid})-[r:AZMemberOf]->(n:AZGroup)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Member Of'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (g1:AZGroup {objectid: $objectid})-[r:AZMemberOf*1..]->(n:AZGroup)'
                                    }
                                    start={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                <hr></hr>

                <CollapsibleSection header='OUTBOUND OBJECT CONTROL'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Object Control'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (g:AZGroup {objectid: $objectid})-[r:AZAddMembers|AZAddOwner|AZAddSecret|AZAppAdmin|AZAvereContributor|AZCloudAppAdmin|AZContributor|AZExecuteCommand|AZGetCertificates|AZGetKeys|AZGetSecrets|AZGlobalAdmin|AZOwns|AZPrivilegedRoleAdmin|AZResetPassword|AZUserAccessAdministrator|AZVMAdminLogin|AZVMContributor]->(n)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated Object Control'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (g1:AZGroup {objectid: $objectid})-[r1:AZMemberOf*1..]->(g2:AZGroup)-[r2:AZAddMembers|AZAddOwner|AZAddSecret|AZAppAdmin|AZAvereContributor|AZCloudAppAdmin|AZContributor|AZExecuteCommand|AZGetCertificates|AZGetKeys|AZGetSecrets|AZGlobalAdmin|AZOwns|AZPrivilegedRoleAdmin|AZResetPassword|AZUserAccessAdministrator|AZVMAdminLogin|AZVMContributor]->(n)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Control'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((g:AZGroup {objectid: $objectid})-[r*1..]->(n))'
                                    }
                                    start={label}
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
                                        'MATCH p = (n)-[r:AZAddMembers|AZMGAddMember|AZMGAddOwner|AZOwns]->(g:AZGroup {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (n)-[r:AZMemberOf*1..]->(g1:AZGroup)-[r1:AZAddMembers|AZMGAddMember|AZMGAddOwner|AZOwns]->(g2:AZGroup {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = g2.objectid) AND NOT n.objectid = g2.objectid'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r*1..]->(g:AZGroup {objectid: $objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>
                {/* <Notes objectid={objectid} type='AZGroup' />
                <NodeGallery
                    objectid={objectid}
                    type='AZGroup'
                    visible={visible}
                /> */}
            </div>
        </div>
    );
};

AZGroupNodeData.propTypes = {};
export default AZGroupNodeData;
