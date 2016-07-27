import React, { Component } from 'react';

export default class NoNodeData extends Component {
	propTypes: {
		visible : React.PropTypes.bool.isRequired
	}

	render() {
		return (
			<div className={this.props.visible ? "" : "hidden"}>
				<h3>
					Node Properties
				</h3>
				<p>
					Select a node for more information
				</p>	
			</div>
		);
	}
}
