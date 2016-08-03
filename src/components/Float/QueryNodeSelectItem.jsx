import React, { Component } from 'react';

export default class QueryNodeSelectItem extends Component {
	_handleClick(){
		var qstring = 'MATCH (n),(m:Group {name:"{}"}),p=allShortestPaths((n)-[*1..]->(m)) RETURN p'

		emitter.emit('query', qstring.format(this.props.text), this.props.text)
	}
	render() {
		return (
			<button onClick={this._handleClick.bind(this)} class="list-group-item">{this.props.text}</button>
		);
	}
}
