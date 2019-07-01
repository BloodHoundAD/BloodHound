import React, { Component } from 'react';

export default class componentName extends Component {
    constructor(props) {
        super(props);
    }

    convertToDisplayProp(propName) {
        var obj = this.props.properties[propName];
        var type = typeof obj;
        if (type === 'undefined') {
            return null;
        } else if (type === 'number') {
            if (obj === 0 || obj === -1) {
                return 'Never';
            } else {
                return new Date(obj * 1000).toUTCString();
            }
        } else if (type === 'boolean') {
            return obj.toString().toTitleCase();
        } else if (obj === '') {
            return null;
        } else {
            return obj;
        }
    }

    render() {
        let l = [];
        let count = 0;

        $.each(
            this.props.displayMap,
            function(key, value) {
                let val = this.convertToDisplayProp(key);

                if (val !== null) {
                    l.push(<dt key={key + 'a'}>{value}</dt>);
                    l.push(<dd key={key + 'b'}>{val}</dd>);
                }
            }.bind(this)
        );

        if (
            this.props.ServicePrincipalNames &&
            this.props.ServicePrincipalNames.length > 0
        ) {
            l.push(<dt key='spn'>Service Principal Names</dt>);
            $.each(this.props.ServicePrincipalNames, function(_, value) {
                l.push(<dd key={count}>{value}</dd>);
                count++;
            });
        }

        if (
            this.props.AllowedToDelegate &&
            this.props.AllowedToDelegate.length > 0
        ) {
            l.push(<dt key='delegate'>Allowed To Delegate</dt>);
            $.each(this.props.AllowedToDelegate, function(_, value) {
                l.push(<dd key={count}>{value}</dd>);
                count++;
            });
        }

        return l;
    }
}
