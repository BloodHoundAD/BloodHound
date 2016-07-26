import React, { Component } from 'react';
import { If, Then, Else } from 'react-if';

export default class NodeALink extends Component {
	propTypes: {
		ready : React.PropTypes.bool.isRequired,
		click : React.PropTypes.func,
		value : React.PropTypes.number
	}
	constructor(props){
		super(props);
	}
	render() {
		return (
			<If condition={this.props.ready}>
				<Then><a href="#" onClick={this.props.click}>{this.props.value}</a></Then>
				<Else>{() =>
					<a style={{color:'black'}}>-</a>
				}</Else>
			</If>
		);
	}
}
