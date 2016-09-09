import React, { Component } from 'react';
import { If, Then, Else } from 'react-if';

export default class LoadLabel extends Component {
	propTypes: {
		ready : React.PropTypes.bool.isRequired,
		value : React.PropTypes.number
	}
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
