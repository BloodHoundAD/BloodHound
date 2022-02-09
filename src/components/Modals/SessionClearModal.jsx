import React, { Component } from 'react';
import { clearSessions } from 'utils';

import { Modal } from 'react-bootstrap';
import BaseModal from './BaseModal';

export default class SessionClearModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        emitter.on('openSessionClearModal', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    openModal() {
        this.setState({ open: true });
    }

    closeAndClear() {
        this.setState({ open: false });
        clearSessions();
    }

    render() {
        return (
            <BaseModal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                label='SessionModalHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='SessionModalHeader'>
                        Clear Sessions
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure you want to clear sessions?</p>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        onClick={this.closeAndClear.bind(this)}
                        type='button'
                        className='btn btn-danger'
                    >
                        Clear Sessions
                    </button>
                    <button
                        onClick={this.closeModal.bind(this)}
                        type='button'
                        className='btn btn-primary'
                    >
                        Cancel
                    </button>
                </Modal.Footer>
            </BaseModal>
        );
    }
}
