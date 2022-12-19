import React from 'react';
import PropTypes from 'prop-types';

const WindowsAbuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>To abuse this privilege, use Whisker. </p>

            <p>
                You may need to authenticate to the Domain Controller as{' '}
                {sourceType === 'User' || sourceType === 'Computer'
                    ? `${sourceName} if you are not running a process as that user/computer`
                    : `a member of ${sourceName} if you are not running a process as a member`}
            </p>

            <pre>
                <code>{'Whisker.exe add /target:<TargetPrincipal>'}</code>
            </pre>

            <p>
                For other optional parameters, view the Whisker documentation.
            </p>
        </>
    );
};

WindowsAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
};

export default WindowsAbuse;
