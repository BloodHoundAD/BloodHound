import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = ({sourceName, sourceType, targetName, targetType}) => {
    return (
        <p>
            {groupSpecialFormat(sourceType, sourceName)} the ability to write to
            the "serviceprincipalname" attribute to the {typeFormat(targetType)}{' '}
            {targetName}.
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
