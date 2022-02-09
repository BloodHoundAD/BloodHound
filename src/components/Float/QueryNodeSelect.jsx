import React, {Component} from 'react';
import {ListGroup, Panel} from 'react-bootstrap';
import {Else, If, Then} from 'react-if';
import QueryNodeSelectItem from './QueryNodeSelectItem';
import {withAlert} from 'react-alert';

class QueryNodeSelect extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            currentQueryTitle: '',
        };

        emitter.on('prebuiltQueryStart', this.getEventInfo.bind(this));
        emitter.on('prebuiltQueryStep', this.doQueryStep.bind(this));
    }

    componentDidMount() {
        $(this.refs.outer).fadeToggle(0);
    }

    getEventInfo() {
        let query = appStore.prebuiltQuery.shift();
        if (query.final) {
            emitter.emit(
                'query',
                query.query,
                query.props,
                null,
                null,
                query.allowCollapse
            );
        } else {
            this.setState({
                currentQueryTitle: query.title,
            });
            $(this.refs.outer).fadeToggle(true);
            let session = driver.session();
            session.run(query.query, query.props).then((results) => {
                let y = $.map(results.records, (x) => {
                    let a = x.keys.map((e, i) => {
                        let obj = {};
                        obj[e.split('.')[1]] = x._fields[i];
                        return obj;
                    });
                    let b = {};
                    $.each(a, (_, o) => {
                        Object.assign(b, o);
                    });

                    return b;
                });
                if (y.length === 0) {
                    this.props.alert.info('No data returned from query');
                    appStore.prebuiltQuery = [];
                    this._dismiss();
                } else {
                    this.setState({ data: y });
                }
                session.close();
            });
        }
    }

    doQueryStep(querydata) {
        let query = appStore.prebuiltQuery.shift();
        if (query.final) {
            let start =
                typeof query.startNode !== 'undefined'
                    ? query.startNode.format(querydata)
                    : '';
            let end =
                typeof query.endNode !== 'undefined'
                    ? query.endNode.format(querydata)
                    : '';
            emitter.emit(
                'query',
                query.query,
                { result: querydata },
                start,
                end,
                query.allowCollapse
            );
            appStore.prebuiltQuery = [];
            this._dismiss();
        } else {
            this.setState({
                currentQueryTitle: query.title,
            });
            let session = driver.session();
            session.run(query.query, { result: querydata }).then(
                function (results) {
                    let y = $.map(results.records, function (x) {
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
                    if (y.length === 0) {
                        this.props.alert.info('No data returned from query');
                        appStore.prebuiltQuery = [];
                        this._dismiss();
                    } else {
                        this.setState({ data: y });
                    }
                    session.close();
                }.bind(this)
            );
        }
    }

    _dismiss() {
        $(this.refs.outer).fadeToggle(false);
    }

    handleClick(event) {
        emitter.emit(
            'query',
            this.state.queryData.onFinish.formatAll(event.target.text),
            { result: event.target.text },
            this.state.queryData.start.format(event.target.text),
            this.state.queryData.end.format(event.target.text),
            this.state.queryData.allowCollapse
        );
        $(this.refs.outer).fadeToggle(false);
    }

    render() {
        return (
            <div className='queryNodeSelect' ref='outer'>
                <Panel>
                    <Panel.Heading>
                        {this.state.currentQueryTitle}
                    </Panel.Heading>
                    <Panel.Body>
                        <If condition={this.state.data.length > 0}>
                            <Then>
                                <ListGroup ref='list'>
                                    {this.state.data.map(
                                        function (key) {
                                            return (
                                                <QueryNodeSelectItem
                                                    key={key.name}
                                                    label={key.name}
                                                    extraProps={key}
                                                />
                                            );
                                        }.bind(this)
                                    )}
                                </ListGroup>
                            </Then>
                            <Else>
                                {() => <img src='src/img/loading.gif' />}
                            </Else>
                        </If>
                    </Panel.Body>
                </Panel>
            </div>
        );
    }
}

export default withAlert()(QueryNodeSelect);
