import React, { Component } from 'react';

export default class Settings extends Component {
	constructor(){
		super();
	}

	componentDidMount() {
		emitter.on('openSettings', function(){
			this.openSettings()
		}.bind(this))

		$(this.refs.edge).simpleSlider({
			range: [0,20],
			step: 1,
			theme: 'volume slideinline'
		})

		$(this.refs.sibling).simpleSlider({
			range: [0,20],
			step: 1,
			theme: 'volume slideinline'
		})

		$(this.refs.edge).bind('slider:changed', this.edgeChange.bind(this))
		$(this.refs.sibling).bind('slider:changed', this.siblingChange.bind(this))

		$(this.refs.edge).simpleSlider('setValue', appStore.performance.edge)
		$(this.refs.sibling).simpleSlider('setValue', appStore.performance.sibling)

		$(this.refs.check).prop('checked', appStore.performance.lowGraphics)
		$(this.refs.debug).prop('checked', appStore.performance.debug)

		$(this.refs.outer).fadeToggle(0)
		$(this.refs.outer).draggable()
	}

	edgeChange(event, data){
		appStore.performance.edge = data.value;
		$(this.refs.edgeinput).val(data.value)
		conf.set('performance', appStore.performance)
	}

	siblingChange(event, data){
		appStore.performance.sibling = data.value;
		$(this.refs.siblinginput).val(data.value)
		conf.set('performance', appStore.performance)
	}

	onGfxChange(event){
		$(this.refs.check).prop('checked', event.target.checked)
		appStore.performance.lowGraphics = event.target.checked
		conf.set('performance', appStore.performance)
		emitter.emit('changeGraphicsMode')
	}

	onDebugChange(event){
		$(this.refs.debug).prop('checked', event.target.checked)
		appStore.performance.debug = event.target.checked
		conf.set('performance', appStore.performance)
	}

	closeSettings(){
		$(this.refs.outer).fadeToggle(false)
	}

	openSettings(){
		$(this.refs.outer).fadeToggle(false)
	}

	updateSibling(event){
		$(this.refs.sibling).simpleSlider('setValue', event.target.value)
	}

	updateEdge(event){
		$(this.refs.edge).simpleSlider('setValue', event.target.value)
	}

	render() {
		return (
			<div ref="outer" className="settingsDiv panel panel-default">
				<div className="panel-heading">
					Settings
					<button type="button" className="close" onClick={this.closeSettings.bind(this)} aria-label="Close">
					<span aria-hidden="true">&times;</span>
					</button>
				</div>

				<div className="panel-body sliderfix">
					<div>
						<strong>Sibling Collapse Threshold</strong> 
						<i data-toggle="tooltip" 
							data-placement="right" 
							title="Merge nodes that have the same parent. 0 to Disable, Default 10" 
							className="glyphicon glyphicon-question-sign"></i>
						<br/>
						<input type="text" ref="sibling" />
						<span>
							<input onChange={this.updateSibling.bind(this)} type="number" min="0" max="20" className="sliderinput" ref="siblinginput" />
						</span>
					</div>

					<div>
						<strong>Node Collapse Threshold</strong> 
						<i data-toggle="tooltip" 
							data-placement="right" 
							title="Collapse nodes at the end of paths that only have one relationship. 0 to Disable, Default 5" 
							className="glyphicon glyphicon-question-sign"></i>
						<br />
						<input type="text" ref="edge" />
						<span>
							<input type="number" min="0" max="20" className="sliderinput" ref="edgeinput" />
						</span>
					</div>
					<div className="checkbox-inline">
						<label>
							<input ref="debug" type="checkbox" onChange={this.onDebugChange.bind(this)}/> Query Debug Mode
						</label>
					</div>
					<i data-toggle="tooltip" 
							data-placement="right" 
							title="Dump queries run into the Raw Query Box" 
							className="glyphicon glyphicon-question-sign"></i>
					<br />
					<div className="checkbox-inline">
						<label>
							<input ref="check" type="checkbox" onChange={this.onGfxChange.bind(this)}/> Low Detail Mode
						</label>
					</div>
					<i data-toggle="tooltip" 
						data-placement="right" 
						title="Lower detail of graph to improve performance" 
						className="glyphicon glyphicon-question-sign"></i>
				</div>
			</div>
		);
	}
}
