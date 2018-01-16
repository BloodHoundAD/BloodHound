import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class componentName extends Component {
    constructor(props){
        super(props);
    }

    convertToDisplayProp(propName) {
        var obj = this.props.properties[propName];
        var type = typeof obj;
        if (type === 'undefined') {
            return null;
        } else if (obj.hasOwnProperty('low')) {
            var t = obj.low;
            if (t === 0) {
                return "Never";
            } else {
                return new Date(obj.low * 1000).toUTCString();
            }
        } else if (type === 'boolean') {
            return obj.toString().toTitleCase();
        } else if (obj === "") {
            return null;
        } else {
            return obj;
        }
    }

    render() {
        let l = [];

        $.each(this.props.displayMap, function(key, value){
            let val = this.convertToDisplayProp(key);

            if (val !== null){
                l.push(<dt key={key}>{value}</dt>);
                l.push(<dd key={val}>{val}</dd>);
            }
        }.bind(this));

        if (this.props.ServicePrincipalNames.length > 0){
            l.push(<dt key="spn">Service Principal Names</dt>);
            $.each(this.props.ServicePrincipalNames, function(index, value){
                l.push(<dd key={index}>{value}</dd>);
            });
        }

        return l;
    }
}