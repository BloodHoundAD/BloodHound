import React, { Component } from 'react';

export default class SpotlightRow extends Component {
	propTypes: {
	 	nodeId : React.PropTypes.number.isRequired,
	 	parentNodeId : React.PropTypes.number.isRequired,
	 	nodeLabel : React.PropTypes.string.isRequired,
	 	parentNodeLabel : React.PropTypes.string.isRequired
	}

	_handleClick(){
		emitter.emit('spotlightClick', this.props.nodeId, this.props.parentNodeId)
	}

	render() {
		return (
			<tr onClick={this._handleClick.bind(this)} data-id={this.props.nodeId} data-parent-id={this.props.parentNodeId}>
				<td>{this.props.nodeLabel}</td>
				<td>{this.props.parentNodeLabel}</td>
			</tr>
		);
	}
}
