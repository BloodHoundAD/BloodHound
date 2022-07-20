import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat } from '../Formatter';

const General = ({sourceName, sourceType, targetName}) => {
    return (
        <p>
            {groupSpecialFormat(sourceType, sourceName)} the ability to write to
            the "msds-KeyCredentialLink" property on {targetName}. Writing to
            this property allows an attacker to create "Shadow Credentials" on
            the object and authenticate as the principal using kerberos PKINIT.
        </p>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
};

export default General;
