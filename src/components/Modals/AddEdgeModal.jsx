import React, {useContext, useEffect, useState} from 'react';
import {Button, ControlLabel, FormControl, FormGroup, Modal,} from 'react-bootstrap';
import {AsyncTypeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import styles from './AddEdgeModal.module.css';
import SearchRow from '../SearchContainer/SearchRow';
import {buildSearchQuery} from 'utils';
import BaseModal from './BaseModal';
import {motion} from 'framer-motion';
import clsx from 'clsx';
import {AppContext} from '../../AppContext';

const AddEdgeModal = () => {
    const [open, setOpen] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const [source, setSource] = useState(null);
    const [target, setTarget] = useState(null);
    const [sourceValue, setSourceValue] = useState('');
    const [targetValue, setTargetValue] = useState('');
    const [edgeValue, setEdgeValue] = useState('MemberOf');
    const defaultErrors = {
        sourceErrors: '',
        targetErrors: '',
        edgeErrors: '',
    };
    const [errors, setErrors] = useState(defaultErrors);

    const [sourceLoading, setSourceLoading] = useState(false);
    const [targetLoading, setTargetLoading] = useState(false);
    const [sourceSearchResults, setSourceSearchResults] = useState([]);
    const [targetSearchResults, setTargetSearchResults] = useState([]);

    const context = useContext(AppContext);

    useEffect(() => {
        emitter.on('addEdge', handleOpen);
        return () => {
            emitter.removeListener('addEdge', handleOpen);
        };
    }, []);

    const handleOpen = () => {
        setOpen(true);
        setShowComplete(false);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const setSelection = (selection, source) => {
        if (selection == null || selection.length === 0) {
            return;
        }

        if (source === 'main') {
            setSource(selection[0]);
        }

        if (source === 'target') {
            setTarget(selection[0]);
        }
    };

    const doSearch = async (query, source) => {
        let session = driver.session();
        let [statement, term] = buildSearchQuery(query);
        if (source === 'main') {
            setSourceLoading(true);
        } else {
            setTargetLoading(true);
        }

        let result = await session.run(statement, { name: term });

        let data = [];
        for (let record of result.records) {
            let node = record.get(0)
            let properties = node.properties;
            let fType = node.labels.filter((w) => w !== 'Base');
            properties.type = fType.length > 0 ? fType[0] : 'Base';
            data.push(properties);
        }

        if (source === 'main') {
            setSourceSearchResults(data);
            setSourceLoading(false);
        } else {
            setTargetSearchResults(data);
            setTargetLoading(false);
        }
        await session.close();
    };

    const validateAndSubmit = async () => {
        let errors = {
            sourceErrors: '',
            targetErrors: '',
            edgeErrors: '',
        };

        let cont = true;
        if (source === null) {
            errors.sourceErrors = 'Select a source node';
            cont = false;
        }

        if (target === null) {
            errors.targetErrors = 'Select a target node';
            cont = false;
        }

        if (cont === false) {
            setErrors(errors);
            return;
        }

        if (source.objectid === target.objectid) {
            errors.sourceErrors = 'Source and target cannot be identical!';
            errors.targetErrors = 'Source and target cannot be identical!';
            setErrors(errors);
            return;
        }

        let session = driver.session();
        let statement = `MATCH (n:${source.type} {objectid: $sourceid}) MATCH (m:${target.type} {objectid: $targetid}) MATCH (n)-[r:${edgeValue}]->(m) RETURN r`;
        let results = await session.run(statement, {
            sourceid: source.objectid,
            targetid: target.objectid,
        });
        await session.close();

        if (results.records.length > 0) {
            errors.edgeErrors = 'Edge already exists';
            setErrors(errors);
            return;
        }

        let edgepart;

        if (
            edgeValue === 'GenericAll' ||
            edgeValue === 'GenericWrite' ||
            edgeValue === 'AllExtendedRights' ||
            edgeValue === 'AddMember' ||
            edgeValue === 'ForceChangePassword' ||
            edgeValue === 'Owns' ||
            edgeValue === 'WriteDacl' ||
            edgeValue === 'WriteOwner' ||
            edgeValue === 'ReadLAPSPassword' ||
            edgeValue === 'WriteSPN' ||
            edgeValue === 'AddKeyCredentialLink' ||
            edgeValue === 'AddSelf'
        ) {
            edgepart = `[r:${edgeValue} {isacl: true}]`;
        } else if (edgeValue === 'SQLAdmin') {
            edgepart = `[r:${edgeValue} {isacl: false, port: 1433}]`;
        } else {
            edgepart = `[r:${edgeValue} {isacl: false}]`;
        }

        session = driver.session();
        statement = `MATCH (n:${source.type} {objectid: $sourceid}) MATCH (m:${target.type} {objectid: $targetid}) MERGE (n)-${edgepart}->(m) RETURN r`;

        await session.run(statement, {
            sourceid: source.objectid,
            targetid: target.objectid,
        });
        await session.close();
        setShowComplete(true);
        setTimeout(() => {
            handleClose();
        }, 500);
    };

    return (
        <BaseModal show={open} onHide={handleClose} label='AddEdgeModalHeader'>
            <Modal.Header closeButton>
                <Modal.Title id='AddEdgeModalHeader'>Add Edge</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <form
                    noValidate
                    onSubmit={() => {
                        return false;
                    }}
                >
                    <FormGroup>
                        <ControlLabel>Source Node</ControlLabel>
                        <AsyncTypeahead
                            id={'addEdgeSourceSearch'}
                            isLoading={sourceLoading}
                            placeholder={'Source Node'}
                            delay={500}
                            renderMenu={(results, menuProps, props) => {
                                return (
                                    <Menu
                                        {...menuProps}
                                        className={clsx(
                                            context.darkMode
                                                ? styles.darkmenu
                                                : null
                                        )}
                                    >
                                        {results.map((result, index) => {
                                            return (
                                                <MenuItem
                                                    option={result}
                                                    position={index}
                                                    key={index}
                                                >
                                                    <SearchRow
                                                        item={result}
                                                        search={sourceValue}
                                                    />
                                                </MenuItem>
                                            );
                                        })}
                                    </Menu>
                                );
                            }}
                            labelKey={(option) => {
                                return (
                                    option.name ||
                                    option.azname ||
                                    option.objectid
                                );
                            }}
                            useCache={false}
                            options={sourceSearchResults}
                            filterBy={(option, props) => {
                                let name = (
                                    option.name ||
                                    option.azname ||
                                    option.objectid
                                ).toLowerCase();
                                let id = option.objectid.toLowerCase();
                                let search;
                                if (props.text.includes(':')) {
                                    search = props.text.split(':')[1];
                                } else {
                                    search = props.text.toLowerCase();
                                }
                                return (
                                    name.includes(search) || id.includes(search)
                                );
                            }}
                            onChange={(selection) =>
                                setSelection(selection, 'main')
                            }
                            onSearch={(query) => doSearch(query, 'main')}
                            onInputChange={(event) => {
                                setSource(null);
                                setSourceValue(event);
                                setErrors(defaultErrors);
                            }}
                        />
                        {errors.sourceErrors.length > 0 && (
                            <span className={styles.error}>
                                {errors.sourceErrors}
                            </span>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Edge Type</ControlLabel>
                        <FormControl
                            value={edgeValue}
                            componentClass='select'
                            onChange={(event) => {
                                setEdgeValue(event.target.value);
                            }}
                        >
                            <option value='MemberOf'>MemberOf</option>
                            <option value='HasSession'>HasSession</option>
                            <option value='AdminTo'>AdminTo</option>
                            <option value='AllExtendedRights'>
                                AllExtendedRights
                            </option>
                            <option value='AddMember'>AddMember</option>
                            <option value='ForceChangePassword'>
                                ForceChangePassword
                            </option>
                            <option value='GenericAll'>GenericAll</option>
                            <option value='GenericWrite'>GenericWrite</option>
                            <option value='Owns'>Owns</option>
                            <option value='WriteDacl'>WriteDacl</option>
                            <option value='WriteOwner'>WriteOwner</option>
                            <option value='ReadLAPSPassword'>
                                ReadLAPSPassword
                            </option>
                            <option value='Contains'>Contains</option>
                            <option value='GpLink'>GpLink</option>
                            <option value='CanRDP'>CanRDP</option>
                            <option value='CanPSRemote'>CanPSRemote</option>
                            <option value='ExecuteDCOM'>ExecuteDCOM</option>
                            <option value='AllowedToDelegate'>
                                AllowedToDelegate
                            </option>
                            <option value='AddAllowedToAct'>
                                AddAllowedToAct
                            </option>
                            <option value='AllowedToAct'>AllowedToAct</option>
                            <option value='AddKeyCredentialLink'>
                                AddKeyCredentialLink
                            </option>
                            <option value='WriteSPN'>
                                WriteSPN
                            </option>
                            <option value='AddSelf'>
                                AddSelf
                            </option>
                            <option value='SQLAdmin'>SQLAdmin</option>
                            <option value='HasSIDHistory'>HasSIDHistory</option>
                        </FormControl>
                        {errors.edgeErrors.length > 0 && (
                            <span className={styles.error}>
                                {errors.edgeErrors}
                            </span>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Target Node</ControlLabel>
                        <AsyncTypeahead
                            id={'addEdgeTargetSearch'}
                            isLoading={targetLoading}
                            placeholder={'Target Node'}
                            delay={500}
                            renderMenu={(results, menuProps, props) => {
                                return (
                                    <Menu
                                        {...menuProps}
                                        className={clsx(
                                            context.darkMode
                                                ? styles.darkmenu
                                                : null
                                        )}
                                    >
                                        {results.map((result, index) => {
                                            return (
                                                <MenuItem
                                                    option={result}
                                                    position={index}
                                                    key={index}
                                                >
                                                    <SearchRow
                                                        item={result}
                                                        search={targetValue}
                                                    />
                                                </MenuItem>
                                            );
                                        })}
                                    </Menu>
                                );
                            }}
                            labelKey={(option) => {
                                return (
                                    option.name ||
                                    option.azname ||
                                    option.objectid
                                );
                            }}
                            useCache={false}
                            options={targetSearchResults}
                            filterBy={(option, props) => {
                                let name = (
                                    option.name ||
                                    option.azname ||
                                    option.objectid
                                ).toLowerCase();
                                let id = option.objectid.toLowerCase();
                                let search;
                                if (props.text.includes(':')) {
                                    search = props.text.split(':')[1];
                                } else {
                                    search = props.text.toLowerCase();
                                }
                                return (
                                    name.includes(search) || id.includes(search)
                                );
                            }}
                            onChange={(selection) =>
                                setSelection(selection, 'target')
                            }
                            onSearch={(query) => doSearch(query, 'target')}
                            onInputChange={(event) => {
                                setTargetValue(event);
                                setTarget(null);
                                setErrors(defaultErrors);
                            }}
                        />
                        {errors.targetErrors.length > 0 && (
                            <span className={styles.error}>
                                {errors.targetErrors}
                            </span>
                        )}
                    </FormGroup>
                </form>
            </Modal.Body>

            <Modal.Footer>
                <motion.div
                    animate={showComplete ? 'visible' : 'hidden'}
                    variants={{
                        visible: {
                            opacity: 1,
                        },
                        hidden: {
                            opacity: 0,
                        },
                    }}
                    initial={'hidden'}
                    className={styles.checkbox}
                >
                    <i className='fa fa-check-circle green-icon-color' />
                </motion.div>
                <Button onClick={validateAndSubmit}>Confirm</Button>
                <Button onClick={handleClose}>Cancel</Button>
            </Modal.Footer>
        </BaseModal>
    );
};

AddEdgeModal.propTypes = {};
export default AddEdgeModal;
