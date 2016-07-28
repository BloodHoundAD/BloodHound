import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';

export default class GenericAlert extends Component {
	constructor(){
		super()
		this.state = {
			visible: false,
			text: "No data returned from query"
		}

		emitter.on('showAlert', this._show.bind(this))
		emitter.on('hideAlert', this._dismiss.bind(this))
	}

	_dismiss(){
		this.setState({visible: false});
	}

	_show(val){
		this.setState({
			visible: true,
			text: val
		})

        setTimeout(function(){
            this._dismiss()
        }.bind(this), 2500)
	}

	render() {
		if (this.state.visible){
			return (
				<Alert className="alertdiv" bsStyle="danger" onDismiss={this._dismiss.bind(this)}>
					{this.state.text}
				</Alert>
			)
		}else{
			return null
		}
		
	}
}
