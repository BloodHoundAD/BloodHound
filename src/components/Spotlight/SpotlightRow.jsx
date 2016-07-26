import React, { Component } from 'react';

export default class SpotlightRow extends Component {
	propTypes: {
	 	node-id : React.PropTypes.number.isRequired,
	 	parent-node-id : React.PropTypes.number.isRequired,
	 	node-label : React.PropTypes.string.isRequired,
	 	parent-node-label : React.PropTypes.string.isRequired
	}

	render() {
		return (
			<tr data-id={this.props.node-id} data-parent-id={this.props.parent-node-id}>
				<td>{this.props.node-label}</td>
				<td>{this.props.parent-node-label}</td>
			</tr>
		);
	}
}
