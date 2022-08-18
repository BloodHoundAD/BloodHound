import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../AppContext';
import clsx from 'clsx';
import styles from './NodeData.module.css';
import NodeCypherLink from './Components/NodeCypherLink';
import CollapsibleSection from './Components/CollapsibleSection';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import { withAlert } from 'react-alert';
import { Table } from 'react-bootstrap';
import CollapsibleSectionTable from './Components/CollapsibleSectionNew';
import NodeDisplayLink from './Components/NodeDisplayLink';

const AZAppRoleNodeData = ({}) => {
    const [visible, setVisible] = useState(false);
    const [objectid, setobjectid] = useState(null);
    const [label, setLabel] = useState(null);
    const [domain, setDomain] = useState(null);
    const [nodeProps, setNodeProps] = useState({});
    const [servicePrincipal, setServicePrincipal] = useState(null);

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
                    `MATCH (n:AZAppRole {objectid: $objectid}) OPTIONAL MATCH (m:AZServicePrincipal)-[:AZExposeAppRole]->(n) RETURN n AS node, m AS serviceprincipal`,
                    {
                        objectid: id,
                    }
                );

                let props = results.records[0].get('node').properties;
                setNodeProps(props);
                setLabel(props.name || props.azname || objectid);
                let sp = results.records[0].get('serviceprincipal');
                if (sp !== null) {
                    setServicePrincipal(sp.properties.objectid);
                }
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
        value: 'Value',
        tenantid: 'Tenant ID',
        allowedMemberTypes: 'Allowed member types',
        origin: "Origin",
        id: "Id"
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
                                <NodeDisplayLink
                                    graphQuery={
                                        'MATCH p=(:AZServicePrincipal)-[:AZExposeAppRole]->(:AZAppRole {objectid: $objectid}) RETURN p'
                                    }
                                    queryProps={{ objectid: objectid }}
                                    title={'Service Principal'}
                                    value={servicePrincipal}
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

                <CollapsibleSectionTable header={'ASSIGNMENTS'}>
                    <NodeCypherLink
                        baseQuery={
                            'MATCH p=(n)-[:AZHasAppRole]->(:AZAppRole {objectid:$objectid})'
                        }
                        property={'Active Assignments'}
                        target={objectid}
                    />
                </CollapsibleSectionTable>

            </div>
        </div>
    );
};

export default withAlert()(AZAppRoleNodeData);
