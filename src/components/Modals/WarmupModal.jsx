import React, { Component } from "react";

import { Modal } from "react-bootstrap";

export default class WarmupModal extends Component {
    constructor() {
        super();
        this.state = {
            open: false
        };
    }

    closeModal() {
        this.setState({ open: false });
    }

    closeAndWarmup() {
        this.setState({open: false});
        var session = driver.session();
        session.run("MATCH (n) OPTIONAL MATCH (n)-[r]->() RETURN count(n.name) + count(r.isacl)")
            .then(function(){
                session.close()
                emitter.emit("showAlert", "Database Warmup Complete!")
            })
    }

    openModal() {
        this.setState({ open: true });
    }

    componentDidMount() {
        emitter.on("openWarmupModal", this.openModal.bind(this));
    }

    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby="WarmupModalHeader"
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title id="WarmupModalHeader">Warmup Database</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Warming up the database will speed up queries at the cost of putting the entire database into memory. This will likely take some time. Do you want to continue?</p>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={this.closeAndWarmup.bind(this)}
                    >
                        Do it!
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={this.closeModal.bind(this)}
                    >
                        Cancel
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
