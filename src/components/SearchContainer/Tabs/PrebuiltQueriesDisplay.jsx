import React, { Component } from 'react';

export default class PrebuiltQueriesDisplay extends Component {
    render() {
        return (
            <div>
                <h3>
                    Pre-Built Analytics Queries
                </h3>
                <div className="query-box">
                    <a href="#" >Find Shortest Paths to DA</a>
                    <br />
                    <a href="#" onClick={function(){
                        emitter.emit('query', 
                            'MATCH (n:User),(m:Computer), (n)<-[r:HasSession]-(m) WHERE NOT n.name STARTS WITH "ANONYMOUS LOGON" AND NOT n.name="" WITH n, count(r) as rel_count order by rel_count desc LIMIT 1 MATCH (m)-[r:HasSession]->(n) RETURN n,r,m')
                    }}>Find User with Most Sessions</a>
                    <br />
                    <a href="#" onClick={function(){
                        emitter.emit('query',
                            "MATCH (n:Domain) MATCH p=(n)-[r]-() RETURN p")
                    }}>Map Domain Trusts</a>
                    <br />
                </div>
            </div>
        );
    }
}
