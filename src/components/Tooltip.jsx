import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export default class Tooltip extends Component {
	propTypes: {
		node : React.PropTypes.object.isRequired
	}

	constructor(props){
		super(props);
	}

	componentDidMount() {
	}

	render() {
		return (
			<div className="hidden">
				<div className="header">
					{this.props.node.label}
				</div>
				<ul>
					<li onClick={function(){console.log('blah')}}>Test</li>
				</ul>
			</div>
		);
	}
}
