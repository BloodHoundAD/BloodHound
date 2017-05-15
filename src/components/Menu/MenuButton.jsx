import React, { Component } from 'react';
import PropTypes from 'prop-types'

export default class MenuButton extends Component {
	_leave(e){
		var target = $(e.target)
		target.css('width', 'auto')
		var oldWidth = target.width();
		target.html('<span class="{}"></span>'.format(this.props.glyphicon))
		var newWidth = target.outerWidth();
		target.width(oldWidth);
		target.animate({
			width: newWidth + 'px'
		}, 100)
	}

	_enter(e){
		var target = $(e.target)
		target.css('width', 'auto')
		var oldWidth = target.width();
		target.html('{} <span class="{}"> </span>'.format(this.props.hoverVal, this.props.glyphicon))
		var newWidth = target.outerWidth();
		target.width(oldWidth);
		target.animate({
			width: newWidth + 'px'
		}, 100)
	}

	componentDidMount(){
		$(this.refs.btn).html('<span class="{}"></span>'.format(this.props.glyphicon))
	}

	render() {
		var c = "glyphicon glyphicon-" + this.props.glyphicon
		return (
			<button ref="btn" onClick={this.props.click} onMouseLeave={this._leave.bind(this)} onMouseEnter={this._enter.bind(this)} className="btn">
				<span className={c} />
			</button>
		);
	}
}

MenuButton.propTypes =  {
	hoverVal : React.PropTypes.string.isRequired,
	glyphicon : React.PropTypes.string.isRequired,
	click : React.PropTypes.func.isRequired
}