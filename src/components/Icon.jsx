import React, { Component } from 'react';

export default class Icon extends Component {
	propTypes: {
		glyph : React.PropTypes.string.isRequired,
		extraClass : React.PropTypes.string
	}

	constructor(props){
		super(props);
	}

	render() {
		return (
			<i className={"glyphicon glyphicon-" + this.props.glyph + " " + this.props.extraClass}></i>
		);
	}
}
