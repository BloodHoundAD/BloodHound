import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} the ability to
                modify the owner of the {typeFormat(targetType)} {targetName}.
            </p>
            <p>
                Object owners retain the ability to modify object security
                descriptors, regardless of permissions on the object's DACL.
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
