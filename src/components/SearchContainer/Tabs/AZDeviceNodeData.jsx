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

const AZDeviceNodeData = () => {
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
        if (type === 'AZDevice') {
            setVisible(true);
            setObjectid(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:AZDevice {objectid: $objectid}) RETURN n AS node`, {
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

                <CollapsibleSection header='Inbound Execution Privileges'>
                    <NodeCypherLink
                        property='Owners'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (n)-[r:AZOwns]->(g:AZDevice {objectid: $objectid})'
                        }
                        end={label}
                    />

                    <NodeCypherLink
                        property='InTune Admins'
                        target={objectid}
                        baseQuery={
                            'MATCH p = (n)-[r:AZOwns]->(g:AZDevice {objectid: $objectid})'
                        }
                        end={label}
                        distinct
                    />

                </CollapsibleSection>

                <Notes objectid={objectid} type='AZResourceGroup' />
                <NodeGallery
                    objectid={objectid}
                    type='AZDevice'
                    visible={visible}
                />
            </dl>
        </div>
    );
};

AZDeviceNodeData.propTypes = {};
export default AZDeviceNodeData;
