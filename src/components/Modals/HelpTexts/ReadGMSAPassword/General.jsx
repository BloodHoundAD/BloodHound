import React from 'react';
import PropTypes from 'prop-types';
import { typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {targetName} is a Group Managed Service Account. The{' '}
                {typeFormat(sourceType)} {sourceName} can retrieve the password
                for the GMSA {targetName}.
            </p>
            <p>
                Group Managed Service Accounts are a special type of Active
                Directory object, where the password for that object is
                mananaged by and automatically changed by Domain Controllers on
                a set interval (check the MSDS-ManagedPasswordInterval
                attribute).
            </p>
            <p>
                The intended use of a GMSA is to allow certain computer accounts
                to retrieve the password for the GMSA, then run local services
                as the GMSA. An attacker with control of an authorized principal
                may abuse that privilege to impersonate the GMSA.
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
