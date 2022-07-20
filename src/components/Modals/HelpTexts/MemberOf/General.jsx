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
                Groups in active directory grant their members any privileges
                the group itself has. If a group has rights to another
                principal, users/computers in the group, as well as other groups
                inside the group inherit those permissions.
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
