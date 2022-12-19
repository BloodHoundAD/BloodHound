import React from 'react';
import PropTypes from 'prop-types';

const LinuxAbuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>
                Use samba's net tool to change the user's password. The credentials can be supplied in cleartext
                or prompted interactively if omitted from the command line. The new password will be prompted
                if omitted from the command line.
            </p>

            <pre>
                <code>
                    {
                        'net rpc password "TargetUser" "newP@ssword2022" -U "DOMAIN"/"ControlledUser"%"Password" -S "DomainController"'
                    }
                </code>
            </pre>

            <p>
                Pass-the-hash can also be done here with <a href='https://github.com/byt3bl33d3r/pth-toolkit'>pth-toolkit's net tool</a>.
                If the LM hash is not known it must be replace with <code>ffffffffffffffffffffffffffffffff</code>.
            </p>

            <pre>
                <code>
                    {
                        'pth-net rpc password "TargetUser" "newP@ssword2022" -U "DOMAIN"/"ControlledUser"%"LMhash":"NThash" -S "DomainController"'
                    }
                </code>
            </pre>
            <p>
                Now that you know the target user's plain text password, you can
                either start a new agent as that user, or use that user's
                credentials in conjunction with PowerView's ACL abuse functions,
                or perhaps even RDP to a system the target user has access to.
                For more ideas and information, see the references tab.
            </p>
        </>
    );
};

LinuxAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
};

export default LinuxAbuse;
