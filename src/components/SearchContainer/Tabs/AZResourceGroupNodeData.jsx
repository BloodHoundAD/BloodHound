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

const AZResourceGroupNodeData = () => {
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
        if (type === 'AZResourceGroup') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:AZResourceGroup {objectid: $objectid}) RETURN n AS node`, {
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
    };

    return objectid === null ? (
        <div></div>
    ) : (
        <div className={clsx(!visible && 'displaynone')}>
            <dl className={'dl-horizontal'}>
                <h4>{label || objectid}</h4>
                
                <MappedNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />

                <CollapsibleSection header='Descendent Objects'>
                    <NodeCypherLink
                        property='Descendent VMs'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (g:AZResourceGroup {objectid: $objectid})-[r:AZContains]->(n:AZVM)'
                        }
                        end={label}
                    />

                    <NodeCypherLink
                        property='Descendent KeyVaults'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (g:AZResourceGroup {objectid: $objectid})-[r:AZContains]->(n:AZKeyVault)'
                        }
                        end={label}
                        distinct
                    />

                </CollapsibleSection>

                <CollapsibleSection header='Inbound Object Control'>
                    <NodeCypherLink
                        property='Explicit Object Controllers'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (n)-[r:AZOwns|AZUserAccessAdministrator]->(g:AZResourceGroup {objectid: $objectid})'
                        }
                        end={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Unrolled Object Controllers'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (n)-[r:MemberOf*1..]->(g1:Group)-[r1:AZOwns|AZUserAccessAdministrator]->(g2:AZResourceGroup {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = g2.objectid) AND NOT n.objectid = g2.objectid'
                        }
                        end={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Transitive Object Controllers'
                        target={objectid}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.objectid=$objectid WITH n MATCH p = shortestPath((n)-[r*1..]->(g:AZResourceGroup {objectid: $objectid}))'
                        }
                        end={label}
                        distinct
                    />
                </CollapsibleSection>
                <Notes objectid={objectid} type='AZResourceGroup' />
                <NodeGallery
                    objectid={objectid}
                    type='AZResourceGroup'
                    visible={visible}
                />
            </dl>
        </div>
    );
};

AZResourceGroupNodeData.propTypes = {};
export default AZResourceGroupNodeData;
