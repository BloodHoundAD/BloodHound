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
	classes : React.PropTypes.string,
	tooltipDir : React.PropTypes.string,
	tooltipTitle : React.PropTypes.string,
	tooltip : React.PropTypes.bool.isRequired,
	click: React.PropTypes.func
}
