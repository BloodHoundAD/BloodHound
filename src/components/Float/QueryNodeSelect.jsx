import React, { Component } from 'react';
import { ListGroup, ListGroupItem, Panel } from 'react-bootstrap'
import { If, Then, Else } from 'react-if';
import QueryNodeSelectItem from './QueryNodeSelectItem'

export default class QueryNodeSelect extends Component {
	constructor(){
		super();

		this.state = {
			data:[],
			queryData: {}
		}

		emitter.on('nodeSelectQuery', this.getEventInfo.bind(this))		
	}

	getEventInfo(query){
		$(this.refs.outer).fadeToggle(true)
		this.state.queryData = query
		var session = driver.session()
		session.run(query.query, query.queryProps)
			.then(function(results){
				var y = $.map(results.records, function(x){
					return x._fields[0]
				})
				y.sort()
				this.setState({data: y})
				session.close()
			}.bind(this))
	}

	componentDidMount() {
		$(this.refs.outer).fadeToggle(0)
	}

	_dismiss(){
		$(this.refs.outer).fadeToggle(false)
	}

	handleClick(event){
		emitter.emit('query',
			this.state.queryData.onFinish.formatAll(event.target.text),
			{result:event.target.text},
			this.state.queryData.start.format(event.target.text),
			this.state.queryData.end.format(event.target.text),
			this.state.queryData.allowCollapse)
		$(this.refs.outer).fadeToggle(false)
	}

	render() {
		var header = <QueryNodeSelectHeader length={this.state.data.length} title={this.state.queryData.boxTitle} dismiss={this._dismiss.bind(this)}/>
		return (
			<div className="queryNodeSelect" ref="outer">
				<Panel header={header}>
					<If condition={ this.state.data.length > 0 }>
						<Then>
							<ListGroup ref="list">
								{
									this.state.data.map(function(key){
										var x = <QueryNodeSelectItem key={key} label={key} click={this.handleClick.bind(this)} />
										return x
									}.bind(this))
								}
							</ListGroup>
						</Then>
						<Else>{() => 
							<img src="src/img/loading.gif" />
						}
						</Else>
					</If>
				</Panel>
				
			</div>
		);
	}
}

class QueryNodeSelectHeader extends Component {
	render() {
		var title = this.props.length > 0 ? this.props.title : "Loading..."
		return (
			<div>
				{title}
				<button type="button" className="close" onClick={this.props.dismiss} aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
		);
	}
}
