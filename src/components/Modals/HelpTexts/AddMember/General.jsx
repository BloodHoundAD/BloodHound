import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} the ability to add
                arbitrary principals, including{' '}
                {sourceType === 'Group' ? 'themselves' : 'itself'}, to the group{' '}
                {targetName}. Because of security group delegation, the members
                of a security group have the same privileges as that group.
            </p>

            <p>
                By adding itself to the group, {sourceName} will gain the same
                privileges that {targetName} already has.
            </p>
        </>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
};

export default General;
