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

const GroupNodeData = () => {
    const [visible, setVisible] = useState(false);
    const [objectid, setObjectid] = useState(null);
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
        if (type === 'Group') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:Group {objectid: $objectid}) RETURN n AS node`, {
                    objectid: id,
                })
                .then(r => {
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
        description: 'Description',
        admincount: 'Admin Count',
    };

    return objectid === null ? (
        <div></div>
    ) : (
        <div className={clsx(!visible && 'displaynone')}>
            <dl className={'dl-horizontal'}>
                <h4>{label || objectid}</h4>
                <NodeCypherLink
                    property='Sessions'
                    target={objectid}
                    baseQuery={
                        'MATCH p = (c:Computer)-[n:HasSession]->(u:User)-[r2:MemberOf*1..]->(g:Group {objectid: $objectid})'
                    }
                    end={label}
                />

                <NodeCypherLink
                    property='Reachable High Value Targets'
                    target={objectid}
                    baseQuery={
                        'MATCH (m:Group {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                    }
                    start={label}
                />
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
                <CollapsibleSection header='Group Members'>
                    <NodeCypherLink
                        property='Direct Members'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(n)-[b:MemberOf]->(c:Group {objectid: $objectid})'
                        }
                        end={label}
                    />

                    <NodeCypherLink
                        property='Unrolled Members'
                        target={objectid}
                        baseQuery={
                            'MATCH p =(n)-[r:MemberOf*1..]->(g:Group {objectid: $objectid})'
                        }
                        end={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Foreign Members'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (n)-[r:MemberOf*1..]->(g:Group {objectid: $objectid}) WHERE NOT g.domain = n.domain'
                        }
                        end={label}
                        distinct
                    />
                </CollapsibleSection>

                <CollapsibleSection header='Group Membership'>
                    <NodeCypherLink
                        property='First Degree Group Membership'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(g1:Group {objectid: $objectid})-[r:MemberOf]->(n:Group)'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Unrolled Member Of'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (g1:Group {objectid: $objectid})-[r:MemberOf*1..]->(n:Group)'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Foreign Group Membership'
                        target={objectid}
                        baseQuery={
                            'MATCH (m:Group {objectid: $objectid}) MATCH (n:Group) WHERE NOT m.domain=n.domain MATCH p=(m)-[r:MemberOf*1..]->(n)'
                        }
                        start={label}
                    />
                </CollapsibleSection>

                <CollapsibleSection header='Local Admin Rights'>
                    <NodeCypherLink
                        property='First Degree Local Admin'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(m:Group {objectid: $objectid})-[r:AdminTo]->(n:Computer)'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Local Admin Rights'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (g1:Group {objectid: $objectid})-[r1:MemberOf*1..]->(g2:Group)-[r2:AdminTo]->(n:Computer)'
                        }
                        start={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Derivative Local Admin Rights'
                        target={objectid}
                        baseQuery={
                            'MATCH p = shortestPath((g:Group {objectid: $objectid})-[r:MemberOf|AdminTo|HasSession*1..]->(n:Computer))'
                        }
                        start={label}
                        distinct
                    />
                </CollapsibleSection>
                <CollapsibleSection header='Execution Privileges'>
                    <NodeCypherLink
                        property='First Degree RDP Privileges'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(m:Group {objectid: $objectid})-[r:CanRDP]->(n:Computer)'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated RDP Privileges'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(m:Group {objectid: $objectid})-[r1:MemberOf*1..]->(g:Group)-[r2:CanRDP]->(n:Computer)'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='First Degree DCOM Privileges'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(m:Group {objectid: $objectid})-[r:ExecuteDCOM]->(n:Computer)'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated DCOM Privileges'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(m:Group {objectid: $objectid})-[r1:MemberOf*1..]->(g:Group)-[r2:ExecuteDCOM]->(n:Computer)'
                        }
                        start={label}
                        distinct
                    />
                </CollapsibleSection>

                <CollapsibleSection header='Outbound Object Control'>
                    <NodeCypherLink
                        property='First Degree Object Control'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (g:Group {objectid: $objectid})-[r]->(n) WHERE r.isacl=true'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Object Control'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (g1:Group {objectid: $objectid})-[r1:MemberOf*1..]->(g2:Group)-[r2]->(n) WHERE r2.isacl=true'
                        }
                        start={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Transitive Object Control'
                        target={objectid}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((g:Group {objectid: $objectid})-[r:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(n))'
                        }
                        start={label}
                        distinct
                    />
                </CollapsibleSection>
                <CollapsibleSection header='Inbound Object Control'>
                    <NodeCypherLink
                        property='Explicit Object Controllers'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (n)-[r:AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(g:Group {objectid: $objectid})'
                        }
                        end={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Unrolled Object Controllers'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (n)-[r:MemberOf*1..]->(g1:Group)-[r1]->(g2:Group {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = g2.objectid) AND NOT n.objectid = g2.objectid AND r1.isacl=true'
                        }
                        end={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Transitive Object Controllers'
                        target={objectid}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(g:Group {objectid: $objectid}))'
                        }
                        end={label}
                        distinct
                    />
                </CollapsibleSection>
                <Notes objectid={objectid} type='Group' />
                <NodeGallery
                    objectid={objectid}
                    type='Group'
                    visible={visible}
                />
            </dl>
        </div>
    );
};

GroupNodeData.propTypes = {};
export default GroupNodeData;
