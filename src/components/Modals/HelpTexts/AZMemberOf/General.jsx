import React from 'react';
import PropTypes from 'prop-types';
import { typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                The {typeFormat(sourceType)} {sourceName} is a member of the
                group {targetName}.
            </p>
            <p>
                Groups in Azure Active Directory grant their direct members any privileges
                the group itself has. If a group has an AzureAD admin role, direct members
                of the group inherit those permissions.
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
