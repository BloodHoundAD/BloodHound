import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../AppContext';
import clsx from 'clsx';
import styles from './NodeData.module.css';
import NodeCypherLink from './Components/NodeCypherLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import { withAlert } from 'react-alert';
import CollapsibleSectionTable from './Components/CollapsibleSectionNew';

const AZRoleNodeData = ({}) => {
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
        if (type === 'AZRole') {
            setVisible(true);
            setobjectid(id);
            setDomain(domain);
            let loadData = async () => {
                let session = driver.session();
                let results = await session.run(
                    `MATCH (n:AZRole {objectid: $objectid}) RETURN n AS node`,
                    {
                        objectid: id,
                    }
                );

                let props = results.records[0].get('node').properties;
                setNodeProps(props);
                setLabel(props.name || props.azname || objectid);
            };

            loadData();
        } else {
            setobjectid(null);
            setVisible(false);
        }
    };

    const displayMap = {
        objectid: 'Object ID',
        displayname: 'Display Name',
        enabled: 'Enabled',
        description: 'Description',
        templateid: 'Template ID',
        tenantid: 'Tenant ID'
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

                <CollapsibleSectionTable header={'ASSIGNMENTS'}>
                    <NodeCypherLink
                        baseQuery={
                            'MATCH p=(n)-[:AZHasRole|AZMemberOf*1..2]->(:AZRole {objectid:$objectid})'
                        }
                        property={'Active Assignments'}
                        target={objectid}
                    />
                </CollapsibleSectionTable>

            </div>
        </div>
    );
};

export default withAlert()(AZRoleNodeData);
