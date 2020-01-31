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

const OUNodeData = () => {
    const [visible, setVisible] = useState(false);
    const [objectid, setObjectid] = useState(null);
    const [label, setLabel] = useState(null);
    const [domain, setDomain] = useState(null);
    const [nodeProps, setNodeProps] = useState({});
    const [blocksInheritance, setBlocksInheritance] = useState(false);

    useEffect(() => {
        emitter.on('nodeClicked', nodeClickEvent);

        return () => {
            emitter.removeListener('nodeClicked', nodeClickEvent);
        };
    }, []);

    const nodeClickEvent = (type, id, blocksinheritance, domain) => {
        if (type === 'OU') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            setBlocksInheritance(blocksinheritance);
            let session = driver.session();
            session
                .run(`MATCH (n:OU {objectid: $objectid}) RETURN n AS node`, {
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
        blocksinheritance: 'Blocks Inheritance',
    };

    return objectid === null ? (
        <div></div>
    ) : (
        <div className={clsx(!visible && 'displaynone')}>
            <dl className={'dl-horizontal'}>
                <h4>{label || objectid}</h4>
                <NodeCypherNoNumberLink
                    query='MATCH p = (d)-[r:Contains*1..]->(o:OU {objectid: $objectid}) RETURN p'
                    target={objectid}
                    property='See OU Within Domain Tree'
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
                <CollapsibleSection header='Affecting GPOs'>
                    <NodeCypherLink
                        property='GPOs Directly Affecting This OU'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(n:GPO)-[r:GpLink]->(o:OU {objectid: $objectid})'
                        }
                    />
                    <NodeCypherLink
                        property='GPOs Affecting This OU'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(n:GPO)-[r:GpLink|Contains*1..]->(o:OU {objectid: $objectid})'
                        }
                    />
                </CollapsibleSection>
                <CollapsibleSection header='Descendant Objects'>
                    <NodeCypherLink
                        property='Total User Objects'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(o:OU {objectid: $objectid})-[r:Contains*1..]->(n:User)'
                        }
                        distinct
                    />

                    <NodeCypherLink
                        property='Total Group Objects'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(o:OU {objectid: $objectid})-[r:Contains*1..]->(n:Group)'
                        }
                        distinct
                    />

                    <NodeCypherLink
                        property='Total Computer Objects'
                        target={objectid}
                        baseQuery={
                            'MATCH p=(o:OU {objectid: $objectid})-[r:Contains*1..]->(n:Computer)'
                        }
                        distinct
                    />

                    <NodeCypherLink
                        property='Sibling Objects within OU'
                        target={objectid}
                        baseQuery={
                            'MATCH (o1)-[r1:Contains]->(o2:OU {objectid: $objectid}) WITH o1 MATCH p=(d)-[r2:Contains*1..]->(o1)-[r3:Contains]->(n)'
                        }
                        distinct
                    />
                </CollapsibleSection>
                <Notes objectid={objectid} type='OU' />
                <NodeGallery objectid={objectid} type='OU' visible={visible} />
            </dl>
        </div>
    );
};

OUNodeData.propTypes = {};
export default OUNodeData;
