import React, { Component } from 'react';
import { If, Then, Else } from 'react-if';
import PropTypes from 'prop-types'

export default class NodeALink extends Component {
	constructor(props){
		super(props);
	}
	render() {
		return (
			<If condition={this.props.ready}>
				<Then><a href="#" onClick={this.props.click}>{this.props.value}</a></Then>
				<Else>{() =>
					<div className="spinner">
					  <div className="bounce1"></div>
					  <div className="bounce2"></div>
					  <div className="bounce3"></div>
					</div>
				}</Else>
			</If>
		);
	}
}

NodeALink.propTypes = {
	ready : React.PropTypes.bool.isRequired,
	click : React.PropTypes.func,
	value : React.PropTypes.number
}