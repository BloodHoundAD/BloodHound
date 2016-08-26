import React, { Component } from 'react';

export default class ProgressBarMenuButton extends Component {
	propTypes: {
		progress : React.PropTypes.number.isRequired,
		committed : React.PropTypes.number.isRequired,
		click : React.PropTypes.func.isRequired
	}

	constructor(){
		super()

		this.state = {
			expanded: false
		}
	}

	_leave(e){
		this.setState({expanded: false})
		var target = $(e.target)
		var oldWidth = target.width()
		target.html('{}%'.format(this.props.progress))
		target.animate({
			width: '41px'
		}, 100)
	}

	_enter(e){
		this.setState({expanded: true})
		var target = $(e.target)
		var oldWidth = target.width()
		var calcWidth = this.props.progress - this.props.committed
		var template = `
			<div class="progress" style="margin-bottom:0px"> 
				<div class="progress-bar progress-bar-success progress-bar-striped active" role="progressbar" aria-value-now={} aria-value-max="100" style="width:{}%">
				</div>
				<div class="progress-bar progress-bar-striped active" role="progressbar" aria-value-now={} aria-value-max="100" style="width:{}%">
				</div>
				<span>
					C {}%/ S {}%
				</span>
			</div>
		`.format(this.props.committed, this.props.committed, calcWidth, calcWidth, this.props.committed, this.props.progress )
		
		target.html(template)
		target.animate({
			width: '150px'
		}, 100)
	}

	componentWillReceiveProps(nextProps){
		if (this.state.expanded){
			var calcWidth = nextProps.progress - nextProps.committed
			var template = `<div class="progress" style="margin-bottom:0px"> 
				<div class="progress-bar progress-bar-success progress-bar-striped active" role="progressbar" aria-value-now={} aria-value-max="100" style="width:{}%">
				</div>
				<div class="progress-bar progress-bar-striped active" role="progressbar" aria-value-now={} aria-value-max="100" style="width:{}%">
				</div>
				<span>
					C {}%/ S {}%
				</span>
			</div>`.format(nextProps.committed, nextProps.committed, calcWidth, calcWidth, nextProps.committed, nextProps.progress )
			$(this.refs.btn).html(template)
		}else{
			$(this.refs.btn).html('{}%'.format(nextProps.progress))
		}

		this.forceUpdate()
	}

	shouldComponentUpdate(nextProps, nextState){
		return true
	}

	componentDidMount(){
		$(this.refs.btn).html('{}%'.format(this.props.progress))
		$(this.refs.btn).css('padding','6px 0px 6px 0px')
		$(this.refs.btn).css('width','41px')
	}

	render() {
		return (
			<button ref="btn" onClick={this.props.click} onMouseLeave={this._leave.bind(this)} onMouseEnter={this._enter.bind(this)} className="btn" />
		);
	}
}
