import React, { Component } from 'react';
import { If, Then, Else } from 'react-if';
import PropTypes from 'prop-types'

export default class GlyphiconSpan extends Component {	
	constructor(props){
		super(props);
	}

	render() {
		return (
			<If condition={ this.props.tooltip }>
				<Then> 
					<span onClick={this.props.click} className={this.props.classes} data-toggle="tooltip" data-placement={this.props.tooltipDir} title={this.props.tooltipTitle}> 
						{this.props.children}
					</span>
				</Then>
				<Else>{() =>
					<span onClick={this.props.click} className={this.props.classes}>
						{this.props.children}
					</span>
				}</Else>
			</If>
		);
	}
}

GlyphiconSpan.propTypes = {
<<<<<<< HEAD
	classes : React.PropTypes.string,
	tooltipDir : React.PropTypes.string,
	tooltipTitle : React.PropTypes.string,
	tooltip : React.PropTypes.bool.isRequired,
	click: React.PropTypes.func
=======
	classes : PropTypes.string,
	tooltipDir : PropTypes.string,
	tooltipTitle : PropTypes.string,
	tooltip : PropTypes.bool.isRequired,
	click: PropTypes.func
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
}
