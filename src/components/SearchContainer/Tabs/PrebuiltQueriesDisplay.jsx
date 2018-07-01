import React, { Component } from 'react';
<<<<<<< HEAD
import PrebuiltQueryNode from './PrebuiltQueryNode'
import { If, Then, Else } from 'react-if';
const { app } = require('electron').remote
var fs = require('fs')
var path = require('path')
var process = require('process')
=======
import PrebuiltQueryNode from './PrebuiltQueryNode';
import { If, Then, Else } from 'react-if';
const { app } = require('electron').remote;
var fs = require('fs');
var path = require('path');
var process = require('process');
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
var exec = require('child_process').exec;

export default class PrebuiltQueriesDisplay extends Component {
    constructor(){
        super();

        this.state = {
            queries: [],
            custom: []
<<<<<<< HEAD
        }
=======
        };
    }

    componentWillMount() {
        $.ajax({
            url: path.join(app.getPath('userData'), '/customqueries.json'),
            type: 'GET',
            success: function (response) {
                var x = JSON.parse(response);
                var y = [];

                $.each(x.queries, function (index, el) {
                    y.push(el);
                });

                this.setState({ custom: y });
            }.bind(this)
        });

        $.ajax({
            url: 'src/components/SearchContainer/Tabs/PrebuiltQueries.json',
            type: 'GET',
            success: function (response) {
                var x = JSON.parse(response);
                var y = [];

                $.each(x.queries, function (index, el) {
                    y.push(el);
                });

                this.setState({ queries: y });
            }.bind(this)
        });
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
    }

    getCommandLine() {
        switch (process.platform) { 
            case 'darwin' : return 'open';
<<<<<<< HEAD
            case 'win32' : return 'start';
            case 'win64' : return 'start';
=======
            case 'win32' : return '';
            case 'win64' : return '';
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
            default : return 'xdg-open';
        }
    }

    editCustom(){
<<<<<<< HEAD
        exec(this.getCommandLine() + ' ' + path.join(app.getPath('userData'),'/customqueries.json'));
    }

    componentWillMount() {
=======
        exec(this.getCommandLine() + ' "' + path.join(app.getPath('userData'),'/customqueries.json') + '"');
    }

    refreshCustom(){
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
        $.ajax({
            url: path.join(app.getPath('userData'),'/customqueries.json'),
            type: 'GET',
            success: function(response){
<<<<<<< HEAD
                var x = JSON.parse(response)
                var y = []

                $.each(x.queries, function(index, el) {
                    y.push(el)
                });
                
                this.setState({custom: y})
            }.bind(this)
        })

        $.ajax({
            url: 'src/components/SearchContainer/Tabs/PrebuiltQueries.json',
            type: 'GET',
            success: function(response){
                var x = JSON.parse(response)
                var y = []

                $.each(x.queries, function(index, el) {
                    y.push(el)
                });

                this.setState({queries: y})
            }.bind(this)
        })
    }

=======
                var x = JSON.parse(response);
                var y = [];

                $.each(x.queries, function(index, el) {
                    y.push(el);
                });
                
                this.setState({custom: y});
            }.bind(this)
        });
    }

    

>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
    render() {
        return (
            <div>
                <h3>
                    Pre-Built Analytics Queries
                </h3>
                <div className="query-box">
                    {this.state.queries.map(function(a){
                        return <PrebuiltQueryNode key={a.name} info={a} />
                    })}
                </div>
                <h3>
                    Custom Queries
<<<<<<< HEAD
                    <i className="glyphicon glyphicon-pencil customQueryGlyph" onClick={this.editCustom.bind(this)}></i>
                </h3>
                <div className="query-box">
                    <If condition={ this.state.custom.length == 0}>
=======
                    <i className="glyphicon glyphicon-pencil customQueryGlyph" data-toggle="tooltip" title="Edit Queries" onClick={this.editCustom.bind(this)} />
                    <i className="glyphicon glyphicon-refresh customQueryGlyph" onClick={this.refreshCustom.bind(this)} style={{"paddingLeft": "5px"}} data-toggle="tooltip" title="Refresh Queries" />
                </h3>
                <div className="query-box">
                    <If condition={this.state.custom.length === 0}>
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
                    <Then><div>No user defined queries.</div></Then>
                    <Else>{() =>
                        <div>
                        {this.state.custom.map(function(a){
                            return <PrebuiltQueryNode key={a.name} info={a} />
                        })}
                        </div>
                    }
                    </Else>
                    </If>
                </div>
            </div>
        );
    }
}
