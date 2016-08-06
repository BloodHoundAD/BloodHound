import React, { Component } from 'react';
import PrebuiltQueryNode from './prebuiltquerynode'
var fs = require('fs')

export default class PrebuiltQueriesDisplay extends Component {
    constructor(){
        super();

        this.state = {
            queries: []
        }
    }

    componentWillMount() {
        $.ajax({
            url: 'src/components/SearchContainer/Tabs/prebuiltqueries.json',
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
            </div>
        );
    }
}
