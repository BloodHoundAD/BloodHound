import React, { Component } from 'react';

import { Modal } from 'react-bootstrap';
import { withAlert } from 'react-alert';
import BaseModal from './BaseModal';

class WarmupModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        emitter.on('openWarmupModal', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    closeAndWarmup() {
        this.setState({ open: false });
        let session = driver.session();
        session
            .run(
                'MATCH (n) OPTIONAL MATCH (n)-[r]->() RETURN count(n.name) + count(r.isacl)'
            )
            .then(() => {
                session.close();
                this.props.alert.success('Database Warmup Complete!');
            });
    }

    openModal() {
        this.setState({ open: true });
    }

    render() {
        return (
            <BaseModal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                label='WarmupModalHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='WarmupModalHeader'>
                        Warm Up Database
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        Warming up the database will speed up queries at the
                        cost of putting the entire database into memory. This
                        will likely take some time. Do you want to continue?
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type='button'
                        className='btn'
                        onClick={this.closeAndWarmup.bind(this)}
                    >
                        Do it!
                    </button>
                    <button
                        type='button'
                        className='btn'
                        onClick={this.closeModal.bind(this)}
                    >
                        Cancel
                    </button>
                </Modal.Footer>
            </BaseModal>
        );
    }
}

export default withAlert()(WarmupModal);
