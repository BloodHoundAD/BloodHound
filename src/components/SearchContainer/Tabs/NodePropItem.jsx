import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class NodePropItem extends Component{
    constructor(props){
        super(props);
    }

    isArray(object){
        return object && typeof object === 'object' && object.constructor === Array;
    }

    render() {
        var val;
        var obj = this.props.keyValue;
        if (obj.hasOwnProperty('low')){
            return [
                <dt>{this.props.keyName}</dt>,
                <dd>{obj.low}</dd>
            ];
        }else if (this.isArray(obj)){
            console.log(obj);
            if (obj.length === 0){
                return [
                    <dt>{this.props.keyName}</dt>,
                    <dd>None</dd>
                ];
            }else{
                var elements = [];
                $.each(obj, function(index, prop){
                    elements.push(<dt></dt>);
                    elements.push(<dd>{prop}</dd>);
                });
                elements[0] = <dt>Service Principal Names</dt>;
            }
            
            return elements;
        }else if (typeof obj === 'boolean'){
            return [
                <dt>{this.props.keyName}</dt>,
                <dd>{this.props.keyValue.toString().toTitleCase()}</dd>
            ];
        }else{
            return [
                <dt>{this.props.keyName}</dt>,
                <dd>{this.props.keyValue.toString()}</dd>
            ];
        }
        
    }
}