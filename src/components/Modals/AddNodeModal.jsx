import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import {
    Modal,
    Button,
    FormGroup,
    ControlLabel,
    FormControl,
} from 'react-bootstrap';
import styles from './AddNodeModal.module.css';
import { motion } from 'framer-motion';

const AddNodeModal = () => {
    const [open, setOpen] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const [value, setValue] = useState('');
    const [typeValue, setTypeValue] = useState('User');
    const [error, setError] = useState('');

    useEffect(() => {
        emitter.on('addNode', handleOpen);
        return () => {
            emitter.removeListener('addNode', handleOpen);
        };
    }, []);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = e => {
        setValue(e.target.value);
        setError('');
    };

    const validateAndSubmit = () => {
        if (value === '') {
            setError('Name cannot be blank');
            return;
        }
        let name = value;
        let type = typeValue;

        if (type === 'Computer') {
            if (!name.includes('.') || name.split('.').length < 3) {
                setError(
                    'Computer name must be similar to COMPUTER.DOMAIN.COM'
                );
                return;
            }
        } else {
            if (!name.includes('@') || name.split('@').length > 2) {
                setError('Name must be similar to NAME@DOMAIN.COM');
                return;
            }

            let dpart = name.split('@')[1];
            if (!dpart.includes('.')) {
                setError('Name must be similar to NAME@DOMAIN.COM');
                return;
            }
        }

        name = name.toUpperCase();
        emitter.emit('addNodeFinal', name, type);
        setShowComplete(true);
        setTimeout(() => {
            handleClose();
            setShowComplete(false);
        }, 500);
    };

    return (
        <BaseModal
            show={open}
            onHide={handleClose}
            label={'AddNodeModalHeader'}
        >
            <Modal.Header closeButton>
                <Modal.Title id='AddNodeModalHeader'>Add Node</Modal.Title>

                <Modal.Body>
                    <form
                        noValidate
                        onSubmit={() => {
                            return false;
                        }}
                    >
                        <FormGroup>
                            <ControlLabel>Node Name</ControlLabel>
                            <FormControl
                                type='text'
                                value={value}
                                onChange={handleChange}
                            />
                            {error.length > 0 && (
                                <span className={styles.error}>{error}</span>
                            )}
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel>Node Type</ControlLabel>
                            <FormControl
                                value={typeValue}
                                componentClass='select'
                                onChange={event => {
                                    setTypeValue(event.target.value);
                                }}
                            >
                                <option value='User'>User</option>
                                <option value='Group'>Group</option>
                                <option value='Computer'>Computer</option>
                                <option value='Domain'>Domain</option>
                                <option value='OU'>OU</option>
                                <option value='GPO'>GPO</option>
                            </FormControl>
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
            </Modal.Header>
        </BaseModal>
    );
};

AddNodeModal.propTypes = {};
export default AddNodeModal;
