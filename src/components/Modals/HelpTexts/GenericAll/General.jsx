import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} GenericAll
                privileges to the {typeFormat(targetType)} {targetName}.
            </p>

            <p>
                This is also known as full control. This privilege allows the
                trustee to manipulate the target object however they wish.
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
