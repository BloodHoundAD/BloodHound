import React, { Component } from 'react';

var Modal = require('react-bootstrap').Modal;

export default class LogoutModal extends Component {
	constructor(){
		super();
		this.state = {
			open: false
		}
	}

	closeModal(){
		this.setState({ open: false })
	}

	closeAndLogout(){
		this.setState({ open: false })
	}

	openModal(){
		this.setState({open: true})
	}

	componentDidMount() {
		
	}

	render() {
		return (
			<Modal
				show={this.state.open}
				onHide={this.closeModal}
				aria-labelledby="LogoutModalHeader"
				ref="logoutModal">

				<Modal.Header closeButton={true}>
					<Modal.Title id="LogoutModalHeader">Logout</Modal.Title>
				</Modal.Header>

				<Modal.Body>
					<p>Are you sure you want to logout?</p>
				</Modal.Body>

				<Modal.Footer>
					<button type="button" className="btn btn-danger" onClick={this.closeAndLogout.bind(this)}>
						Logout
					</button>
					<button type="button" className="btn btn-primary" onClick={this.closeModal.bind(this)}>
						Cancel
					</button>
				</Modal.Footer>
			</Modal>
		);
	}
}
