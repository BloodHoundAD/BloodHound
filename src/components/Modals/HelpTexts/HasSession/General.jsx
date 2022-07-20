import React from 'react';
import PropTypes from 'prop-types';

const General = ({ sourceName, targetName }) => {
    return (
        <>
            <p>
                The user {targetName} has a session on the computer {sourceName}
                .
            </p>
            <p>
                When a user authenticates to a computer, they often leave
                credentials exposed on the system, which can be retrieved
                through LSASS injection, token manipulation/theft, or injecting
                into a user's process.
            </p>
            <p>
                Any user that is an administrator to the system has the
                capability to retrieve the credential material from memory if it
                still exists.
            </p>
            <p>
                Note: A session does not guarantee credential material is
                present, only possible.
            </p>
        </>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    targetName: PropTypes.string,
};

export default General;
