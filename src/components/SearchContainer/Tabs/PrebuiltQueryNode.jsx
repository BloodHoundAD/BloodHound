import React, { Component } from 'react';

export default class PrebuiltQueryNode extends Component {
    render() {
        var c;

        c = function() {
            if (appStore.prebuiltQuery.length === 0) {
                appStore.prebuiltQuery = JSON.parse(
                    JSON.stringify(this.props.info.queryList)
                );
                emitter.emit('prebuiltQueryStart');
            }
        }.bind(this);

        return (
            <div>
                <a href='#' onClick={c}>
                    {this.props.info.name}
                </a>
                <br />
            </div>
        );
    }
}
