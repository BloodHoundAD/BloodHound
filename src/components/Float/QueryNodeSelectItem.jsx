import React, { Component } from 'react';
import { ListGroupItem } from 'react-bootstrap';

export default class QueryNodeSelectItem extends Component {
    convertToDisplayProp() {
        let str = '';
        $.each(
            Object.keys(this.props.extraProps),
            function(_, prop) {
                if (prop === 'name') {
                    return;
                }

                let obj = this.props.extraProps[prop];
                const type = typeof obj;
                let val;
                if (type === 'undefined') {
                    val = null;
                } else if (type === 'number') {
                    if (obj === 0) {
                        val = 'Never';
                    } else {
                        val = new Date(obj * 1000).toUTCString();
                    }
                } else if (type === 'boolean') {
                    val = obj.toString().toTitleCase();
                } else if (obj === '') {
                    val = null;
                } else {
                    val = obj;
                }
                if (val !== null) {
                    str += prop + ': ' + val + '\n';
                }
            }.bind(this)
        );
        return str;
    }

    render() {
        let c = function() {
            emitter.emit('prebuiltQueryStep', this.props.label);
        }.bind(this);
        let str = this.convertToDisplayProp();
        return (
            <ListGroupItem
                className='queryNodeItemPreWrap'
                href='#'
                onClick={c}
                header={this.props.label}
            >
                {str}
            </ListGroupItem>
        );
    }
}
