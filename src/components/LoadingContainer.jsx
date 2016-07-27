import React, { Component } from 'react';

export default class LoadingContainer extends Component {
	constructor(){
		super();

		this.state = {
			text: "Loading"
		}

		emitter.on('updateLoadingText', function(payload){
			this.setState({text: payload})
		}.bind(this))

		emitter.on('showLoadingIndicator', function(payload){
			if (payload){
				jQuery(this.refs.load).fadeIn()
			}else{
				jQuery(this.refs.load).fadeOut()
			}
		}.bind(this))
	}

	componentDidMount() {
		jQuery(this.refs.load).fadeToggle(0)
	}

	render() {
		return (
			<div className="loadingIndicator" ref="load">
				<div>{this.state.text}</div>
				<img src="src/img/loading.gif" />
			</div>
		);
	}
}
