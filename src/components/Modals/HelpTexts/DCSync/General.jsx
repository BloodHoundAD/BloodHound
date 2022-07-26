import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} the
                DS-Replication-Get-Changes and the
                DS-Replication-Get-Changes-All privilege on the domain{' '}
                {targetName}.
            </p>
            <p>
                These two privileges allow a principal to perform a DCSync
                attack.
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
