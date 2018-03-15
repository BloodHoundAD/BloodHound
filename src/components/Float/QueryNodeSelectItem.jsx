import React, { Component } from 'react';
import { ListGroupItem } from 'react-bootstrap'

export default class QueryNodeSelectItem extends Component {
    render() {
        let c = function () {
            emitter.emit("prebuiltQueryStep", this.props.label);
        }.bind(this);
        return (
            <ListGroupItem href="#" onClick={c}>
                {this.props.label}
            </ListGroupItem>
        );
    }
}
