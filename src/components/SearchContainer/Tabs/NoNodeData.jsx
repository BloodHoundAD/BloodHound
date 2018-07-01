import React, { Component } from 'react';
import PropTypes from 'prop-types'

export default class NoNodeData extends Component {
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


NoNodeData.propTypes = {
<<<<<<< HEAD
	visible : React.PropTypes.bool.isRequired
=======
	visible : PropTypes.bool.isRequired
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
}