import React, { useEffect, useState, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';

const ConfirmDrawModal = (props, ref) => {
    const [show, setShow] = useState(false);
    const [resolve, setResolve] = useState(null);
    const [reject, setReject] = useState(null);

    useImperativeHandle(ref, () => {
        open: () => {
            return new Promise((res, rej) => {
                setResolve(res);
                setReject(rej);
                setShow(true);
            });
        };
    });
    const handleClose = () => {
        promise.resolve(false);
        setShow(false);
    };

    const handleConfirm = () => {
        promise.resolve(true);
        setShow(false);
    };

    return (
        <Modal show={show} onHide={() => handleClose()}>
            <Modal.Header closeButton>
                <Modal.Title>Confirm Graph Draw</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>
                    This graph will likely take a long time to render. Do you
                    want to continue?
                </p>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant='secondary'
                    onClick={() => {
                        handleClose();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant='primary'
                    onClick={() => {
                        handleConfirm();
                    }}
                >
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmDrawModal;
