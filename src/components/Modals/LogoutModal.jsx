import React, { Component } from 'react';

import { Modal } from 'react-bootstrap';
import BaseModal from './BaseModal';

export default class LogoutModal extends Component {
    constructor() {
        super();
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        emitter.on('showLogout', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    closeAndLogout() {
        conf.delete('databaseInfo');
        appStore.databaseInfo = null;
        this.setState({ open: false });
        emitter.emit('doLogout');
        driver.close();
        renderEmit.emit('logout');
    }

    openModal() {
        this.setState({ open: true });
    }

    render() {
        return (
            <BaseModal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                label='LogoutModalHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='LogoutModalHeader'>Logout</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure you want to logout?</p>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type='button'
                        className='btn btn-danger'
                        onClick={this.closeAndLogout.bind(this)}
                    >
                        Logout
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
