import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} generic write
                access to the {typeFormat(targetType)} {targetName}.
            </p>
            <p>
                Generic Write access grants you the ability to write to any
                non-protected attribute on the target object, including
                "members" for a group, and "serviceprincipalnames" for a user
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
