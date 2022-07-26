import React from 'react';
import PropTypes from 'prop-types';
import { typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <>
            <p>
                The {typeFormat(sourceType)} {sourceName} has, in its SIDHistory
                attribute, the SID for the {typeFormat(targetType)} {targetName}
                .
            </p>
            <p>
                When a kerberos ticket is created for {sourceName}, it will
                include the SID for {targetName}, and therefore grant
                {sourceName} the same privileges and permissions as
                {targetName}.
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
