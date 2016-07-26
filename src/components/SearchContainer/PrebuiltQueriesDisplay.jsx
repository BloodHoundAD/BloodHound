import React, { Component } from 'react';

export default class PrebuiltQueriesDisplay extends Component {
    render() {
        return (
            <div>
                <h3>
                    Pre-Built Analytics Queries
                </h3>
                <div className="query-box">
                    <a href="#" >Find Shortest Paths to DA</a><br />
                    <a href="#" >Find User with Most Sessions</a><br />
                    <a href="#" >Map Domain Trusts</a><br />
                </div>
            </div>
        );
    }
}
