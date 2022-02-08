import React, {useEffect, useState} from 'react';
import {Button, Modal} from 'react-bootstrap';
import {writeFile} from 'fs';
import {remote} from 'electron';
import BaseModal from './BaseModal';

const { dialog } = remote;

const ConfirmDrawModal = ({ promise }) => {
    const [data, setData] = useState(null);
    const [params, setParams] = useState(null);
    const [show, setShow] = useState(false);

    const handleClose = () => {
        emitter.emit('confirmGraphDraw', false);
        setData(null);
        setShow(false);
    };

    const handleOpen = (data, params) => {
        setData(data);
        setParams(params);
        setShow(true);
    };

    const handleConfirm = () => {
        emitter.emit('confirmGraphDraw', true, data, params);
        setData(null);
        setShow(false);
    };

    const handleSave = () => {
        let target = dialog.showSaveDialogSync({
            defaultPath: 'data.json',
        });

        if (target !== undefined) {
            writeFile(target, JSON.stringify(data, null, 2), (err) => {
                if (err) console.log(err);
                else console.log('Saved ' + target + ' successfully');
            });
        }
        setShow(false);
        setData(null);
        emitter.emit('confirmGraphDraw', false);
    };

    useEffect(() => {
        emitter.on('showGraphConfirm', handleOpen);
        return () => {
            emitter.removeListener('showGraphConfirm', handleOpen);
        };
    }, []);

    const nodeCount = data == null ? 0 : data.nodes.length;
    const edgeCount = data == null ? 0 : data.edges.length;

    return (
        <BaseModal show={show} onHide={() => handleClose()}>
            <Modal.Header closeButton>
                <Modal.Title>Confirm Graph Draw</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>
                    This graph has will likely take a long time to render. Do
                    you want to continue, cancel, or save the data to json?
                    <br />
                    <br />
                    Total nodes to draw: {nodeCount}
                    <br />
                    Total edges to draw: {edgeCount}
                </p>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    bsStyle='danger'
                    onClick={() => {
                        handleClose();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    bsStyle='primary'
                    onClick={() => {
                        handleSave();
                    }}
                >
                    Save Data
                </Button>
                <Button
                    bsStyle='success'
                    onClick={() => {
                        handleConfirm();
                    }}
                >
                    Draw Graph
                </Button>
            </Modal.Footer>
        </BaseModal>
    );
};

ConfirmDrawModal.propTypes = {};
export default ConfirmDrawModal;
