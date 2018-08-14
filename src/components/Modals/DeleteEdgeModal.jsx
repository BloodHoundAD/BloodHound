import React, { Component } from "react";
import { Modal } from "react-bootstrap";

export default class DeleteEdgeModal extends Component {
    constructor() {
        super();
        this.state = {
            open: false
        };
    }

    closeModal() {
        this.setState({ open: false });
    }

    confirmDelete() {
        this.closeModal();
        emitter.emit("deleteEdgeConfirm", this.state.id);
    }

    openModal(id) {
        closeTooltip()
        this.setState({ open: true,  id: id });
    }

    componentDidMount() {
        emitter.on("deleteEdge", this.openModal.bind(this));
    }

    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby="DeleteEdgeModalHeader"
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title id="DeleteEdgeModalHeader">Delete Edge</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure you want to delete this edge?</p>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={this.confirmDelete.bind(this)}
                    >
                        Confirm
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
