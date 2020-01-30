import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const NodeProps = ({ properties, displayMap }) => {
    const ConvertToDisplay = propertyName => {
        let propValue = properties[propertyName];
        let propType = typeof propValue;

        if (propType === 'undefined') {
            return null;
        }

        if (type === 'number') {
        }
    };

    return <div></div>;
};

NodeProps.propTypes = {};
export default NodeProps;
