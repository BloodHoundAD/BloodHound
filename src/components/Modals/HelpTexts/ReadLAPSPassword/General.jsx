import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} the ability to read
                the password set by Local Administrator Password Solution (LAPS)
                on the computer {targetName}.
            </p>
            <p>
                The local administrator password for a computer managed by LAPS
                is stored in the confidential LDAP attribute, "ms-mcs-AdmPwd".
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
