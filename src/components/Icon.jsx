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
<<<<<<< HEAD
	glyph : React.PropTypes.string.isRequired,
	extraClass : React.PropTypes.string
=======
	glyph : PropTypes.string.isRequired,
	extraClass : PropTypes.string
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
}