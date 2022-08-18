import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../AppContext';
import clsx from 'clsx';
import styles from './NodeData.module.css';
import NodeCypherLink from './Components/NodeCypherLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import { withAlert } from 'react-alert';
import CollapsibleSectionTable from './Components/CollapsibleSectionNew';

const AZAppRoleNodeData = ({}) => {
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
        if (type === 'AZAppRole') {
            setVisible(true);
            setobjectid(id);
            setDomain(domain);
            let loadData = async () => {
                let session = driver.session();
                let results = await session.run(
                    `MATCH (n:AZAppRole {objectid: $objectid}) RETURN n AS node`,
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
        objectid: 'Role ID',
        displayname: 'Display Name',
        enabled: 'Enabled',
        description: 'Description',
        value: 'Value',
        tenantid: 'Tenant ID',
        allowedMemberTypes: 'Allowed member types',
        origin: "Origin"
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
{/* TODO
                <CollapsibleSectionTable header={'ASSIGNMENTS'}>
                    <NodeCypherLink
                        baseQuery={
                            'MATCH p=(n)-[:AZHasRole|AZMemberOf*1..2]->(:AZAppRole {objectid:$objectid})'
                        }
                        property={'Active Assignments'}
                        target={objectid}
                    />
                    <NodeCypherLink
                        baseQuery={
                            'MATCH p=(n)-[:AZCanGrant|AZGrantSelf|AZMemberOf*1..2]->(:AZAppRole {objectid:$objectid})'
                        }
                        property={'PIM Assignments'}
                        target={objectid}
                    />
                </CollapsibleSectionTable>
*/}
            </div>
        </div>
    );
};

export default withAlert()(AZAppRoleNodeData);
