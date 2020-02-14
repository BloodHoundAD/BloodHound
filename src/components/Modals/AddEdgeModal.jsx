import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    Modal,
    FormGroup,
    FormControl,
    Button,
    ControlLabel,
} from 'react-bootstrap';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import styles from './AddEdgeModal.module.css';
import SearchRow from '../SearchContainer/SearchRow';
import { buildSearchQuery, buildSelectQuery } from 'utils';
import BaseModal from './BaseModal';
import { motion } from 'framer-motion';

const AddEdgeModal = () => {
    const [open, setOpen] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const [source, setSource] = useState(null);
    const [target, setTarget] = useState(null);
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
        if (selection.length === 0) {
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
            let properties = record._fields[0].properties;
            properties.type = record._fields[0].labels[0];
            data.push(properties);
        }

        if (source === 'main') {
            setSourceSearchResults(data);
            setSourceLoading(false);
        } else {
            setTargetSearchResults(data);
            setTargetLoading(false);
        }
        session.close();
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
        session.close();

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
            edgeValue === 'ReadLAPSPassword'
        ) {
            edgepart = `[r:${edgeValue} {isacl: true}]`;
        } else if (edgeValue === 'SQLAdmin') {
            edgepart = `[r:${edgeValue} {isacl: false, port: 1433}]`;
        } else {
            edgepart = `[r:${edgeValue} {isacl: false}]`;
        }

        session = driver.session();
        statement = `MATCH (n:${source.type} {objectid: $sourceid}) MATCH (m:${target.type} {objectid: $targetid}) MERGE (n)-${edgepart}->(m) RETURN r`;

        results = await session.run(statement, {
            sourceid: source.objectid,
            targetid: target.objectid,
        });
        session.close();
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
                            onSearch={() => {}}
                            placeholder={'Source Node'}
                            delay={500}
                            renderMenuItemChildren={SearchRow}
                            labelKey={option => {
                                return option.name || option.objectid;
                            }}
                            useCache={false}
                            options={sourceSearchResults}
                            filterBy={(option, props) => {
                                let name = (
                                    option.name || option.objectid
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
                            onChange={selection =>
                                setSelection(selection, 'main')
                            }
                            onSearch={query => doSearch(query, 'main')}
                            onInputChange={() => {
                                setSource(null);
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
                            onChange={event => {
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
                            onSearch={() => {}}
                            placeholder={'Target Node'}
                            delay={500}
                            renderMenuItemChildren={SearchRow}
                            labelKey={option => {
                                return option.name || option.objectid;
                            }}
                            useCache={false}
                            options={targetSearchResults}
                            filterBy={(option, props) => {
                                let name = (
                                    option.name || option.objectid
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
                            onChange={selection =>
                                setSelection(selection, 'target')
                            }
                            onSearch={query => doSearch(query, 'target')}
                            onInputChange={() => {
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
