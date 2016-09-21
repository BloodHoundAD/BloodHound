import React, { Component } from 'react';

export default class PrebuiltQueryNode extends Component {
	render() {
		var c;
		if (this.props.info.requireNodeSelect){
			c = function(){
				emitter.emit('nodeSelectQuery', this.props.info.nodeSelectQuery)
			}.bind(this)
		}else{
			c = function(){
				emitter.emit('query', this.props.info.query, this.props.info.props, "", "", this.props.info.allowCollapse)
			}.bind(this)
		}
		return (
			<div>
				<a href="#" onClick={c}>{this.props.info.name}</a>
				<br />
			</div>
		);
	}
}
