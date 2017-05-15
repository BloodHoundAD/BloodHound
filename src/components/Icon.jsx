import React, { Component } from 'react';
import PropTypes from 'prop-types'

export default class Icon extends Component {
	constructor(props){
		super(props);
	}

	render() {
		return (
			<i className={"glyphicon glyphicon-" + this.props.glyph + " " + this.props.extraClass}></i>
		);
	}
}

Icon.propTypes =  {
	glyph : React.PropTypes.string.isRequired,
	extraClass : React.PropTypes.string
}