import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} permissions to
                modify the DACL (Discretionary Access Control List) on the{' '}
                {typeFormat(targetType)} {targetName}
            </p>
            <p>
                With write access to the target object's DACL, you can grant
                yourself any privilege you want on the object.
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
