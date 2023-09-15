import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} admin rights to the
                computer {targetName}.
            </p>

            <p>
                By default, administrators have several ways to perform remote
                code execution on Windows systems, including via RDP, WMI,
                WinRM, the Service Control Manager, and remote DCOM execution.
            </p>

            <p>
                Further, administrators have several options for impersonating
                other users logged onto the system, including plaintext password
                extraction, token impersonation, and injecting into processes
                running as another user.
            </p>

            <p>
                Finally, administrators can often disable host-based security
                controls that would otherwise prevent the aforementioned
                techniques.
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
