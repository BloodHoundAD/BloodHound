import React, { Component } from 'react';
import PrebuiltQueryNode from './PrebuiltQueryNode'
import { If, Then, Else } from 'react-if';
const { app } = require('electron').remote
var fs = require('fs')
var path = require('path')
var process = require('process')
var exec = require('child_process').exec;

export default class PrebuiltQueriesDisplay extends Component {
    constructor(){
        super();

        this.state = {
            queries: [],
            custom: []
        }
    }

    getCommandLine() {
        switch (process.platform) { 
            case 'darwin' : return 'open';
            case 'win32' : return 'start';
            case 'win64' : return 'start';
            default : return 'xdg-open';
        }
    }

    editCustom(){
        exec(this.getCommandLine() + ' ' + path.join(app.getPath('userData'),'/customqueries.json'));
    }

    refreshCustom(){
        $.ajax({
            url: path.join(app.getPath('userData'),'/customqueries.json'),
            type: 'GET',
            success: function(response){
                var x = JSON.parse(response)
                var y = []

                $.each(x.queries, function(index, el) {
                    y.push(el)
                });
                
                this.setState({custom: y})
            }.bind(this)
        })
    }

    componentWillMount() {
        $.ajax({
            url: path.join(app.getPath('userData'),'/customqueries.json'),
            type: 'GET',
            success: function(response){
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
                    <i className="glyphicon glyphicon-pencil customQueryGlyph" data-toggle="tooltip" title="Edit Queries" onClick={this.editCustom.bind(this)}></i>
                    <i className="glyphicon glyphicon-refresh customQueryGlyph" onClick={this.refreshCustom.bind(this)} style={{"paddingLeft": "5px"}} data-toggle="tooltip" title="Refresh Queries"></i>
                </h3>
                <div className="query-box">
                    <If condition={ this.state.custom.length == 0}>
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
