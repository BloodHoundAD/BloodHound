import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Icon extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <i
                className={
                    'glyphicon glyphicon-' +
                    this.props.glyph +
                    ' ' +
                    this.props.extraClass
                }
            />
        );
    }
}

Icon.propTypes = {
    glyph: PropTypes.string.isRequired,
    extraClass: PropTypes.string,
};
