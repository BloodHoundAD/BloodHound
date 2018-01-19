import React, { Component } from 'react';
import { ListGroup, ListGroupItem, Panel } from 'react-bootstrap';
import { If, Then, Else } from 'react-if';
import QueryNodeSelectItem from './QueryNodeSelectItem';
import QueryNodeSelectHeader from './QueryNodeSelectHeader';

export default class QueryNodeSelect extends Component {
    constructor(){
        super();

        this.state = {
            data:[],
            queryData: {}
        };

        emitter.on('nodeSelectQuery', this.getEventInfo.bind(this));        
    }

    componentDidMount() {
        $(this.refs.outer).fadeToggle(0);
    }

    getEventInfo(query) {
        $(this.refs.outer).fadeToggle(true);
        this.setState({queryData:query});
        var session = driver.session();
        session.run(query.query, query.queryProps)
            .then(function (results) {
                var y = $.map(results.records, function (x) {
                    return x._fields[0];
                });
                y.sort();
                this.setState({ data: y });
                session.close();
            }.bind(this));
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
                        {this.state.queryData.boxTitle}
                    </Panel.Heading>
                    <Panel.Body>
                        <If condition={this.state.data.length > 0}>
                            <Then>
                                <ListGroup ref="list">
                                    {
                                        this.state.data.map(function(key){
                                            var x = <QueryNodeSelectItem key={key} label={key} click={this.handleClick.bind(this)} />;
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
}
