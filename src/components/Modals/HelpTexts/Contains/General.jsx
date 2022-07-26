import React from 'react';
import PropTypes from 'prop-types';
import { typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <>
            <p>
                {typeFormat(sourceType)} {sourceName} contains the{' '}
                {typeFormat(targetType)} {targetName}.
            </p>
            <p>
                GPOs linked to a container apply to all objects that are
                contained by the container.
            </p>
        </>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
};

export default General;
