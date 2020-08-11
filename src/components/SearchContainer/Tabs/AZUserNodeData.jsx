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

const AZUserNodeData = () => {
    const [visible, setVisible] = useState(false);
    const [objectId, setObjectId] = useState(null);
    const [label, setLabel] = useState(null);
    const [domain, setDomain] = useState(null);
    const [nodeProps, setNodeProps] = useState({});

    useEffect(() => {
        emitter.on('nodeClicked', nodeClickEvent);

        return () => {
            emitter.removeListener('nodeClicked', nodeClickEvent);
        };
    }, []);

    const nodeClickEvent = (type, id, blocksinheritance, domain) => {
        if (type === 'AZUser') {
            setVisible(true);
            setObjectId(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:AZUser {objectid: $objectid}) RETURN n AS node`, {
                    objectid: id,
                })
                .then(r => {
                    let props = r.records[0].get('node').properties;
                    setNodeProps(props);
                    setLabel(props.name || objectid);
                    session.close();
                });
        } else {
            setObjectId(null);
            setVisible(false);
        }
    };

    const displayMap = {
        displayname: 'Display Name',
        objectid: 'Object ID',
    };

    return objectId === null ? (
        <div></div>
    ) : (
        <div className={clsx(!visible && 'displaynone')}>
            <dl className={'dl-horizontal'}>
                <h4>{label || objectId}</h4>

                <NodeCypherLink
                    property='Reachable High Value Targets'
                    target={objectId}
                    baseQuery={
                        'MATCH (m:AZUser {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                    }
                    start={label}
                />

                <NodeCypherNoNumberLink
                    target={objectId}
                    property='See user within Domain/OU Tree'
                    query='MATCH p = (d:Domain)-[r:Contains*1..]->(u:User {objectid: $objectid}) RETURN p'
                />
                <MappedNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />

                <CollapsibleSection header={'Group Membership'}>
                    <NodeCypherLink
                        property='First Degree Group Memberships'
                        target={objectId}
                        baseQuery={
                            'MATCH (m:AZUser {objectid: $objectid}), (n:Group), p=(m)-[:MemberOf*1..]->(n)'
                        }
                        start={label}
                    />

                    <NodeCypherLink
                        property='Unrolled Group Membership'
                        target={objectId}
                        baseQuery={
                            'MATCH p = (m:AZUser {objectid: $objectid})-[r:MemberOf*1..]->(n)'
                        }
                        start={label}
                        distinct
                    />

                </CollapsibleSection>

                <CollapsibleSection header={'Outbound Object Control'}>
                    <NodeCypherLink
                        property='First Degree Object Control'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(m:AZUser {objectid: $objectid})-[r:AZAddMembers|AZAvereContributor|AZContributor|AZGetCertificates|AZGetKeys|AZGetSecrets|AZGlobalAdmin|AZOwns|AZPrivilegedRoleAdmin|AZResetPassword|AZUserAccessAdministrator|AZVMContributor]->(n)'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Object Control'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(m:AZUser {objectid: $objectid})-[r1:MemberOf*1..]->(g)-[r2:AZAddMembers|AZAvereContributor|AZContributor|AZGetCertificates|AZGetKeys|AZGetSecrets|AZGlobalAdmin|AZOwns|AZPrivilegedRoleAdmin|AZResetPassword|AZUserAccessAdministrator|AZVMContributor]->(n)'
                        }
                        start={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Transitive Object Control'
                        target={objectId}
                        baseQuery={
                            'MATCH p=shortestPath((m:AZUser {objectid: $objectid})-[r*1..]->(n)) WHERE NOT m = n'
                        }
                        start={label}
                        distinct
                    />
                </CollapsibleSection>

                <CollapsibleSection header={'Inbound Object Control'}>
                    <NodeCypherLink
                        property='First Degree Object Controllers'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(u:AZUser {objectid: $objectid})<-[r1:AZAddMembers|AZAvereContributor|AZContributor|AZGetCertificates|AZGetKeys|AZGetSecrets|AZGlobalAdmin|AZOwns|AZPrivilegedRoleAdmin|AZResetPassword|AZUserAccessAdministrator|AZVMContributor]-(n)'
                        }
                        end={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Object Controllers'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(u:User {objectid: $objectid})<-[r1:MemberOf*1..]->(g)-[r2:AZAddMembers|AZAvereContributor|AZContributor|AZGetCertificates|AZGetKeys|AZGetSecrets|AZGlobalAdmin|AZOwns|AZPrivilegedRoleAdmin|AZResetPassword|AZUserAccessAdministrator|AZVMContributor]-(n)'
                        }
                        start={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Transitive Object Controllers'
                        target={objectId}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.objectid=$objectid MATCH p=shortestPath((u:AZUser {objectid: $objectid})<-[r1*1..]-(n))'
                        }
                        start={label}
                        distinct
                    />
                </CollapsibleSection>

                <Notes objectid={objectId} type={'AZUser'} />
                <NodeGallery
                    objectid={objectId}
                    type={'AZUser'}
                    visible={visible}
                />
            </dl>
        </div>
    );
};

AZUserNodeData.propTypes = {};
export default withAlert()(AZUserNodeData);
