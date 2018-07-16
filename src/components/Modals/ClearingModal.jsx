import React, { Component } from "react";
import { Modal } from "react-bootstrap";

export default class ClearingModal extends Component {
    constructor() {
        super();
        this.state = {
            open: false
        };
    }

    openModal() {
        this.setState({ open: true });
    }

    closeModal() {
        this.setState({ open: false });
    }

    componentDidMount() {
        emitter.on("openClearingModal", this.openModal.bind(this));
        emitter.on("hideDBClearModal", this.closeModal.bind(this));
    }
    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby="ClearingModalHeader"
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title id="ClearingModalHeader">
                        Clearing Data
                    </Modal.Title>
                </Modal.Header>
            </Modal>
        );
    }
}
