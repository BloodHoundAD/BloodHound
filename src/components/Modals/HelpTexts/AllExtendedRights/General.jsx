import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} the
                AllExtendedRights privilege to the {typeFormat(targetType)} 
                {targetName}.
            </p>

            <p>
                Extended rights are special rights granted on objects which
                allow reading of privileged attributes, as well as performing
                special actions.
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
