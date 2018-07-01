import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';

export default class GenericAlert extends Component {
<<<<<<< HEAD
	constructor(){
		super()
		this.state = {
			visible: false,
			text: "No data returned from query",
			timeout: null
		}

		emitter.on('showAlert', this._show.bind(this))
		emitter.on('hideAlert', this._dismiss.bind(this))
	}

	_dismiss(){
		this.setState({visible: false});
	}

	_show(val){
		clearTimeout(this.state.timeout)
		var t = setTimeout(function(){
            this._dismiss()
        }.bind(this), 2500)
		
		this.setState({
			visible: true,
			text: val,
			timeout: t
		})
        
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
=======
    constructor(){
        super();
        this.state = {
            visible: false,
            text: "No data returned from query",
            timeout: null
        };

        emitter.on('showAlert', this._show.bind(this));
        emitter.on('hideAlert', this._dismiss.bind(this));
    }

    _dismiss(){
        this.setState({visible: false});
    }

    _show(val){
        clearTimeout(this.state.timeout);
        var t = setTimeout(function(){
            this._dismiss();
        }.bind(this), 2500);
        
        this.setState({
            visible: true,
            text: val,
            timeout: t
        });
        
    }

    render() {
        if (this.state.visible){
            return (
                <Alert className="alertdiv" bsStyle="danger" onDismiss={this._dismiss.bind(this)}>
                    {this.state.text}
                </Alert>
            );
        }else{
            return null;
        }
        
    }
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
}
