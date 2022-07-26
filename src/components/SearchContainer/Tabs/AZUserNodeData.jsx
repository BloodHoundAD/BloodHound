import React, { useContext, useEffect, useState } from 'react';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLink from './Components/NodeCypherLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import { withAlert } from 'react-alert';
import { Table } from 'react-bootstrap';
import styles from './NodeData.module.css';
import { AppContext } from '../../../AppContext';

const AZUserNodeData = () => {
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
        if (type === 'AZUser') {
            setVisible(true);
            setobjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(
                    `MATCH (n:AZUser {objectid: $objectid}) RETURN n AS node`,
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
            setobjectid(null);
            setVisible(false);
        }
    };

    const displayMap = {
        displayname: 'Display Name',
        objectid: 'Object ID',
        enabled: 'Enabled',
        whencreated: 'Creation Time',
        title: 'Job Title',
        pwdlastset: 'Password Last Set',
        mail: 'Email',
        usertype: 'User Type',
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
                                    property='Sessions'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:AZUser {objectid: $objectid}),(n:Computer),p = ((n)-[r:HasSession*1..]->(m))'
                                    }
                                    start={label}
                                />
                                <NodeCypherLink
                                    baseQuery={
                                        'MATCH p=(:AZUser {objectid: $objectid})-[:AZMemberOf|AZHasRole*1..]->(n:AZRole)'
                                    }
                                    property={'Azure AD Admin Roles'}
                                    target={objectid}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Reachable High Value Targets'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (m:AZUser {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
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

                <CollapsibleSection header='GROUP MEMBERSHIP'>
                    <div className={styles.itemlist}>
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <NodeCypherLink
                                    property='First Degree Group Membership'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p=(m:AZUser {objectid: $objectid})-[r:AZMemberOf]->(n)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Member Of'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (m:AZUser {objectid: $objectid})-[r:AZMemberOf*1..]->(n)'
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
                                        'MATCH p = (g:AZUser {objectid: $objectid})-[r:AZPrivilegedAuthAdmin|AZPrivilegedRoleAdmin|AZGlobalAdmin|AZGetCertificates|AZGetKeys|AZGetSecrets|AZVMAdminLogin|AZContributor|AZAvereContributor|AZUserAccessAdministrator|AZOwns|AZAddMembers|AZResetPassword|AZAppAdmin|AZCloudAppAdmin|AZVMContributor|AZAddSecret]->(n)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Group Delegated Object Control'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (g1:AZUser {objectid: $objectid})-[r1:AZMemberOf*1..]->(g2)-[r2:AZPrivilegedAuthAdmin|AZPrivilegedRoleAdmin|AZGlobalAdmin|AZGetCertificates|AZGetKeys|AZGetSecrets|AZVMAdminLogin|AZContributor|AZAvereContributor|AZUserAccessAdministrator|AZOwns|AZAddMembers|AZResetPassword|AZAppAdmin|AZCloudAppAdmin|AZVMContributor|AZAddSecret]->(n)'
                                    }
                                    start={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Control'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((g:AZUser {objectid: $objectid})-[r*1..]->(n))'
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
                                        'MATCH p = (n)-[r:AZResetPassword]->(g:AZUser {objectid: $objectid})'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodeCypherLink
                                    property='Unrolled Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH p = (n)-[r:AZMemberOf]->(g1)-[r1:AZResetPassword]->(g2:AZUser {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = g2.objectid) AND NOT n.objectid = g2.objectid'
                                    }
                                    end={label}
                                    distinct
                                />
                                <NodePlayCypherLink
                                    property='Transitive Object Controllers'
                                    target={objectid}
                                    baseQuery={
                                        'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[*1..]->(g:AZUser {objectid: $objectid}))'
                                    }
                                    end={label}
                                    distinct
                                />
                            </tbody>
                        </Table>
                    </div>
                </CollapsibleSection>

                {/* <Notes objectid={objectid} type={'AZUser'} />
                <NodeGallery
                    objectid={objectid}
                    type={'AZUser'}
                    visible={visible}
                /> */}
            </div>
        </div>
    );
};

AZUserNodeData.propTypes = {};
export default withAlert()(AZUserNodeData);
