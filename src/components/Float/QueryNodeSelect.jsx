import React, { Component } from 'react';
<<<<<<< HEAD
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
=======
import { ListGroup, ListGroupItem, Panel } from 'react-bootstrap';
import { If, Then, Else } from 'react-if';
import QueryNodeSelectItem from './QueryNodeSelectItem';
import QueryNodeSelectHeader from './QueryNodeSelectHeader';

export default class QueryNodeSelect extends Component {
    constructor(){
        super();

        this.state = {
            data:[],
            currentQueryTitle: ""
        };

        emitter.on('prebuiltQueryStart', this.getEventInfo.bind(this));
        emitter.on('prebuiltQueryStep', this.doQueryStep.bind(this));
    }

    componentDidMount() {
        $(this.refs.outer).fadeToggle(0);
    }

    getEventInfo() {
        var query = appStore.prebuiltQuery.shift();
        if (query.final){
            emitter.emit('query',
                query.query,
                query.props,
                null,
                null,
                query.allowCollapse);
        }else{
            this.setState({
                currentQueryTitle: query.title
            });
            $(this.refs.outer).fadeToggle(true);
            var session = driver.session();
            session.run(query.query, query.props)
                .then(function (results) {
                    var y = $.map(results.records, function (x) {
                        let a = x.keys.map(function (e, i) {
                            let obj = {};
                            obj[e.split('.')[1]] = x._fields[i];
                            return obj;
                        });
                        let b = {};
                        $.each(a, function (index, o) {
                            Object.assign(b, o);
                        });

                        return b;
                    });
                    this.setState({ data: y });
                    session.close();
                }.bind(this));
        }
    }

    doQueryStep(querydata){
        var query = appStore.prebuiltQuery.shift();
        if (query.final) {
            let start = typeof query.startNode !== 'undefined' ? query.startNode.format(querydata) : "";
            let end = typeof query.endNode !== 'undefined' ? query.endNode.format(querydata) : "";
            emitter.emit('query',
                query.query,
                {"result":querydata},
                start,
                end,
                query.allowCollapse);
            appStore.prebuiltQuery = [];
            this._dismiss();
        } else {
            this.setState({
                currentQueryTitle: query.title
            });
            var session = driver.session();
            session.run(query.query, {"result":querydata})
                .then(function (results) {
                    var y = $.map(results.records, function (x) {
                        let a = x.keys.map(function(e, i){
                            let obj = {};
                            obj[e.split('.')[1]] = x._fields[i];
                            return obj;
                        });
                        let b = {};
                        $.each(a, function(index, o){
                            Object.assign(b, o);
                        });
                        
                        return b;
                    });
                    if (y.length === 0){
                        emitter.emit('showAlert', "No data returned from query");
                        appStore.prebuiltQuery = [];
                        this._dismiss();
                    }else{
                        this.setState({ data: y });
                    }
                    session.close();
                }.bind(this));
        }
    }

    _dismiss(){
        $(this.refs.outer).fadeToggle(false);
    }

    handleClick(event){
        emitter.emit('query',
            this.state.queryData.onFinish.formatAll(event.target.text),
            {result:event.target.text},
            this.state.queryData.start.format(event.target.text),
            this.state.queryData.end.format(event.target.text),
            this.state.queryData.allowCollapse);
        $(this.refs.outer).fadeToggle(false);
    }

    render() {
        return (
            <div className="queryNodeSelect" ref="outer">
                <Panel>
                    <Panel.Heading>
                        {/* <QueryNodeSelectHeader length={this.state.data.length} title={this.state.queryData.boxTitle} dismiss={this._dismiss.bind(this)} />; */}
                        {this.state.currentQueryTitle}
                    </Panel.Heading>
                    <Panel.Body>
                        <If condition={this.state.data.length > 0}>
                            <Then>
                                <ListGroup ref="list">
                                    {
                                        this.state.data.map(function(key){
                                            var x = <QueryNodeSelectItem key={key.name} label={key.name} extraProps={key} />;
                                            return x;
                                        }.bind(this))
                                    }
                                </ListGroup>
                            </Then>
                            <Else>{() => 
                                <img src="src/img/loading.gif" />
                            }
                            </Else>
                        </If>
                    </Panel.Body>
                </Panel>
            </div>
        );
    }
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
}
