import React, { Component } from 'react';
import PrebuiltQueryNode from './PrebuiltQueryNode';
import { If, Then, Else } from 'react-if';
import { remote } from 'electron';
const { app } = remote;
import { join } from 'path';
import { platform } from 'process';
import { exec } from 'child_process';

export default class PrebuiltQueriesDisplay extends Component {
    constructor() {
        super();

        this.state = {
            queries: [],
            custom: [],
        };
    }

    componentWillMount() {
        $.ajax({
            url: join(app.getPath('userData'), '/customqueries.json'),
            type: 'GET',
            success: function(response) {
                var x = JSON.parse(response);
                var y = [];

                $.each(x.queries, function(_, el) {
                    y.push(el);
                });

                this.setState({ custom: y });
            }.bind(this),
        });

        $.ajax({
            url: 'src/components/SearchContainer/Tabs/PrebuiltQueries.json',
            type: 'GET',
            success: function(response) {
                var x = JSON.parse(response);
                var y = [];

                $.each(x.queries, function(_, el) {
                    y.push(el);
                });

                this.setState({ queries: y });
            }.bind(this),
        });
    }

    getCommandLine() {
        switch (platform) {
            case 'darwin':
                return 'open';
            case 'win32':
                return '';
            case 'win64':
                return '';
            default:
                return 'xdg-open';
        }
    }

    editCustom() {
        exec(
            this.getCommandLine() +
                ' "' +
                join(app.getPath('userData'), '/customqueries.json') +
                '"'
        );
    }

    refreshCustom() {
        $.ajax({
            url: join(app.getPath('userData'), '/customqueries.json'),
            type: 'GET',
            success: function(response) {
                var x = JSON.parse(response);
                var y = [];

                $.each(x.queries, function(index, el) {
                    y.push(el);
                });

                this.setState({ custom: y });
            }.bind(this),
        });
    }

    render() {
        return (
            <div>
                <h3>Pre-Built Analytics Queries</h3>
                <div className='query-box'>
                    {this.state.queries.map(function(a) {
                        return <PrebuiltQueryNode key={a.name} info={a} />;
                    })}
                </div>
                <h3>
                    Custom Queries
                    <i
                        className='glyphicon glyphicon-pencil customQueryGlyph'
                        data-toggle='tooltip'
                        title='Edit Queries'
                        onClick={this.editCustom.bind(this)}
                    />
                    <i
                        className='glyphicon glyphicon-refresh customQueryGlyph'
                        onClick={this.refreshCustom.bind(this)}
                        style={{ paddingLeft: '5px' }}
                        data-toggle='tooltip'
                        title='Refresh Queries'
                    />
                </h3>
                <div className='query-box'>
                    <If condition={this.state.custom.length === 0}>
                        <Then>
                            <div>No user defined queries.</div>
                        </Then>
                        <Else>
                            {() => (
                                <div>
                                    {this.state.custom.map(function(a) {
                                        return (
                                            <PrebuiltQueryNode
                                                key={a.name}
                                                info={a}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </Else>
                    </If>
                </div>
            </div>
        );
    }
}
