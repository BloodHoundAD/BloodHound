import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import BaseModal from './BaseModal';

export default class ClearingModal extends Component {
    constructor() {
        super();
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        emitter.on('openClearingModal', this.openModal.bind(this));
        emitter.on('hideDBClearModal', this.closeModal.bind(this));
    }

    openModal() {
        this.setState({ open: true });
    }

    closeModal() {
        this.setState({ open: false });
    }

    render() {
        return (
            <BaseModal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                label='ClearingModalHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='ClearingModalHeader'>
                        Clearing Data
                    </Modal.Title>
                </Modal.Header>
            </BaseModal>
        );
    }
}
