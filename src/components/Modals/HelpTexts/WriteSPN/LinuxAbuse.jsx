import React from 'react';
import PropTypes from 'prop-types';

const LinuxAbuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>
                A targeted kerberoast attack can be performed using{' '}
                <a href='https://github.com/ShutdownRepo/targetedKerberoast'>targetedKerberoast.py</a>.
            </p>

            <pre>
                <code>
                    {
                        "targetedKerberoast.py -v -d 'domain.local' -u 'controlledUser' -p 'ItsPassword'"
                    }
                </code>
            </pre>

            <p>
                The tool will automatically attempt a targetedKerberoast
                attack, either on all users or against a specific one if
                specified in the command line, and then obtain a crackable hash.
                The cleanup is done automatically as well.
            </p>

            <p>
                The recovered hash can be cracked offline using the tool
                of your choice.
            </p>
        </>
    );
};

LinuxAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
};

export default LinuxAbuse;
