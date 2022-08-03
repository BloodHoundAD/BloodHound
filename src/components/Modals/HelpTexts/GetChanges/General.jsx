import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} the
                DS-Replication-Get-Changes privilege on the domain {targetName}.
            </p>
            <p>
                Individually, this edge does not grant the ability to perform an
                attack. However, in conjunction with
                DS-Replication-Get-Changes-All, a principal may perform a DCSync
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
