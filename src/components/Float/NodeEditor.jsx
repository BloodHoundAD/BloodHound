import React, { useEffect, useState, useContext } from 'react';
import { withAlert } from 'react-alert';
import NodeEditorRow from './NodeEditorRow.jsx';
import { Button, Panel, Table } from 'react-bootstrap';
import styles from './NodeEditor.module.css';
import PoseContainer from '../PoseContainer';
import clsx from 'clsx';
import { AppContext } from '../../AppContext.jsx';
import { useDragControls } from 'framer-motion';

const NodeEditor = () => {
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [id, setId] = useState('');
    const [properties, setProperties] = useState({});
    const [visible, setVisible] = useState(false);
    const [newAttrName, setNewAttrName] = useState('');
    const [newAttrType, setNewAttrType] = useState('boolean');
    const [hasError, setHasError] = useState(false);
    const context = useContext(AppContext);
    const dragControl = useDragControls();

    const getNodeData = (node) => {
        setName(node.label);
        setType(node.type);
        setId(node.objectid);
        setVisible(true);

        let session = driver.session();
        let statement = `MATCH (n:${node.type} {objectid: $id}) RETURN n`;

        session.run(statement, { id: node.objectid }).then((result) => {
            let props = result.records[0].get(0).properties;
            let label = props.name;
            delete props.name;
            setName(label || props.objectid);
            setProperties(props);
            session.close();
        });
    };

    const addAttribute = () => {
        let newValue;
        if (newAttrType === 'boolean') {
            newValue = false;
        } else if (newAttrType === 'number') {
            newValue = 0;
        } else if (newAttrType === 'string') {
            newValue = 'placeholder';
        } else {
            newValue = [];
        }

        if (Object.keys(properties).includes(newAttrName)) {
            setHasError(true);
            return;
        }

        let session = driver.session();
        let statement = `MATCH (n:${type} {objectid:  $id}) SET n.${newAttrName}=$newprop RETURN n`;
        session.run(statement, { id: id, newprop: newValue }).then((result) => {
            let props = result.records[0].get(0).properties;
            let label = props.name;
            delete props.name;
            setName(label || props.objectid);
            setProperties(props);
            session.close();
        });
    };

    const updateAttribute = (attributeName, newValue) => {
        let statement;
        if (attributeName === 'serviceprincipalnames' && type === 'User') {
            if (newValue === '' && newValue.length === 1) {
                newValue = [];
            }

            if (newValue.length > 0) {
                statement = `MATCH (n:${type} {objectid:  $id}) SET n.${attributeName}=$newprop, n.hasspn=true RETURN n`;
            } else {
                statement = `MATCH (n:${type} {objectid:  $id}) SET n.${attributeName}=$newprop, n.hasspn=false RETURN n`;
            }
        } else {
            statement = `MATCH (n:${type} {objectid:  $id}) SET n.${attributeName}=$newprop RETURN n`;
        }

        let session = driver.session();
        session.run(statement, { id: id, newprop: newValue }).then((result) => {
            let props = result.records[0].get(0).properties;
            let label = props.name;
            delete props.name;
            setName(label || props.objectid);
            setProperties(props);
            session.close();
        });
    };

    const deleteAttribute = (attributeName) => {
        let statement = `MATCH (n:${type} {objectid: $id}) REMOVE n.${attributeName} RETURN n`;

        let session = driver.session();
        session.run(statement, { id: id }).then((result) => {
            let props = result.records[0].get(0).properties;
            let label = props.name;
            delete props.name;
            setName(label || props.objectid);
            setProperties(props);
            session.close();
        });
    };

    useEffect(() => {
        emitter.on('editnode', getNodeData);
    }, []);

    return (
        <PoseContainer
            visible={visible}
            className={clsx(
                styles.container,
                context.darkMode ? styles.dark : null
            )}
            dragHandle={dragControl}
        >
            <Panel>
                <Panel.Heading
                    onMouseDown={(e) => {
                        dragControl.start(e);
                    }}
                >
                    {name}
                    <Button
                        onClick={() => setVisible(false)}
                        className='close'
                        aria-label='Close'
                    >
                        <span aria-hidden='true'>&times;</span>
                    </Button>
                </Panel.Heading>

                <Panel.Body>
                    <div className='nodeEditTableContainer'>
                        <Table>
                            <thead align='center'>
                                <tr>
                                    <td>Delete</td>
                                    <td>Edit</td>
                                    <td>Name</td>
                                    <td>Value</td>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(properties).map(function (key) {
                                    let val = properties[key];
                                    return (
                                        <NodeEditorRow
                                            key={key}
                                            attributeName={key}
                                            val={val}
                                            deleteHandler={deleteAttribute}
                                            updateHandler={updateAttribute}
                                        />
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>

                    <form
                        onSubmit={(x) => x.preventDefault()}
                        className='form-inline pull-right'
                    >
                        <div
                            onFocus={() => setHasError(false)}
                            className='form-group'
                        >
                            <input
                                type='text'
                                className={`${
                                    hasError ? styles.error : ''
                                } form-control form-override`}
                                value={newAttrName}
                                onChange={(e) => setNewAttrName(e.target.value)}
                                placeholder='Internal Name'
                                required
                            />
                            <select
                                className='form-control'
                                onChange={(e) => setNewAttrType(e.target.value)}
                            >
                                <option value='boolean'>boolean</option>
                                <option value='string'>string</option>
                                <option value='number'>number</option>
                                <option value='array'>array</option>
                            </select>
                            <button
                                className='form-control formButtonFix'
                                onClick={() => addAttribute()}
                            >
                                <span className='fa fa-plus' /> Add
                            </button>
                        </div>
                    </form>
                </Panel.Body>
            </Panel>
        </PoseContainer>
    );
};
NodeEditor.propTypes = {};
export default withAlert()(NodeEditor);
