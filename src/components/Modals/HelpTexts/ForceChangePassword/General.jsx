import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <p>
            {groupSpecialFormat(sourceType, sourceName)} the capability to
            change the {typeFormat(targetType)} {targetName}'s password without
            knowing that user's current password.
        </p>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
};

export default General;
