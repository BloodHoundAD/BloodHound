import React, { Component } from 'react';

import { Modal } from 'react-bootstrap';
import BaseModal from './BaseModal';

export default class CancelUploadModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        emitter.on('showCancelUpload', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    closeAndCancel() {
        this.setState({ open: false });
        emitter.emit('cancelUpload');
    }

    openModal() {
        this.setState({ open: true });
    }

    render() {
        return (
            <BaseModal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                label='CanceulUploadHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='CancelUploadHeader'>
                        Cancel Upload
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure you want to cancel the upload?</p>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type='button'
                        className='btn btn-danger'
                        onClick={this.closeAndCancel.bind(this)}
                    >
                        Stop Upload
                    </button>
                    <button
                        type='button'
                        className='btn btn-primary'
                        onClick={this.closeModal.bind(this)}
                    >
                        Cancel
                    </button>
                </Modal.Footer>
            </BaseModal>
        );
    }
}
