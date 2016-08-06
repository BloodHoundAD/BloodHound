import React, { Component } from 'react';
import { ListGroup, ListGroupItem, Panel } from 'react-bootstrap'
import { fullAjax } from 'utils'
import { If, Then, Else } from 'react-if';
import QueryNodeSelectItem from './querynodeselectitem'

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
		var o = fullAjax(query.query,
			function(data){
				var y = $.map(data.results[0].data, function(x){
					return x.row[0].name
				})
				this.setState({data: y})
			}.bind(this))
		$.ajax(o)
	}

	componentDidMount() {
		$(this.refs.outer).fadeToggle(0)
	}

	handleClick(event){
		emitter.emit('query',
			this.state.queryData.onFinish.formatAll(event.target.text),
			"", 
			event.target.text,
			this.state.queryData.allowCollapse)
		$(this.refs.outer).fadeToggle(false)
	}

	render() {
		return (
			<div className="queryNodeSelect" ref="outer">
				<Panel header={this.state.data.length > 0 ? this.state.queryData.boxTitle : "Loading..."}>
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
