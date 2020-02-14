import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class NoNodeData extends Component {
    render() {
        return (
            <div className={this.props.visible ? '' : 'hidden'}>
                <h3>Node Properties</h3>
                <p>Select a node for more information</p>
            </div>
        );
    }
}

NoNodeData.propTypes = {
    visible: PropTypes.bool.isRequired,
};
