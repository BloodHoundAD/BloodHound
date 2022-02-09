import React, {useEffect, useState} from 'react';
import BaseModal from './BaseModal';
import {Button, Modal} from 'react-bootstrap';
import styles from './GraphErrorModal.module.css';

const GraphErrorModal = () => {
    const [show, setShow] = useState(false);
    const [error, setError] = useState(null);

    const handleClose = () => {
        setShow(false);
    };

    const handleError = error => {
        setError(error);
        setShow(true);
    };

    useEffect(() => {
        emitter.on('showGraphError', handleError);
        return () => {
            emitter.removeListener('showGraphError', handleError);
        };
    }, []);

    return (
        <BaseModal
            className={styles.width}
            show={show}
            onHide={() => handleClose()}
        >
            <Modal.Header closeButton>
                <Modal.Title>Graph Error</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>An error occurred in the graph query:</p>
                <div className={styles.error}>{error}</div>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    bsStyle='primary'
                    onClick={() => {
                        handleClose();
                    }}
                >
                    Close
                </Button>
            </Modal.Footer>
        </BaseModal>
    );
};

GraphErrorModal.propTypes = {};
export default GraphErrorModal;
