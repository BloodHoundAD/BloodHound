import React, { Component } from 'react';
import { ListGroupItem } from 'react-bootstrap'

export default class QueryNodeSelectItem extends Component {

	render() {
		return (
			<ListGroupItem href="#" onClick={this.props.click}>{this.props.label}</ListGroupItem>
		);
	}
}
