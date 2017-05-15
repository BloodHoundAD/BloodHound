import React, { Component } from 'react';
import { If, Then, Else } from 'react-if';
import PropTypes from 'prop-types'

export default class LoadLabel extends Component {
	constructor(props){
		super(props);
	}
	render() {
		return (
			<If condition={this.props.ready}>
				<Then><div>{this.props.value}</div></Then>
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

LoadLabel.propTypes = {
	ready : React.PropTypes.bool.isRequired,
	value : React.PropTypes.number
}