import React, { Component } from 'react';
import './PrebuiltQueries.module.css';

export default class PrebuiltQueryNode extends Component {
    render() {
        let c;

        c = function() {
            if (appStore.prebuiltQuery.length === 0) {
                appStore.prebuiltQuery = JSON.parse(
                    JSON.stringify(this.props.info.queryList)
                );
                emitter.emit('prebuiltQueryStart');
            }
        }.bind(this);

        return (
                <tr style={{ cursor: 'pointer' }} onClick={c}>
                    <td align='left'>{this.props.info.name}</td>
                    <td align='right'/>
                </tr>
        );
    }
}
