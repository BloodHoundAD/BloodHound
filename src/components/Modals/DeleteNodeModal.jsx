import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import BaseModal from './BaseModal';

export default class DeleteNodeModal extends Component {
    constructor() {
        super();
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        emitter.on('deleteNode', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    confirmDelete() {
        this.closeModal();
        emitter.emit('deleteNodeConfirm', this.state.id);
    }

    openModal(id) {
        closeTooltip();

        this.setState({ open: true, id: id });
    }

    render() {
        return (
            <BaseModal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                label='DeleteNodeModalHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='DeleteNodeModalHeader'>
                        Delete Node
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure you want to delete this node?</p>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type='button'
                        className='btn btn-danger'
                        onClick={this.confirmDelete.bind(this)}
                    >
                        Confirm
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
