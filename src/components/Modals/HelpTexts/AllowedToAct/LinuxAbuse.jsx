import React from 'react';
import PropTypes from 'prop-types';

const LinuxAbuse = ({ sourceName }) => {
    return (
        <>
            We can then get a service ticket for the service name (sname) we
            want to "pretend" to be "admin" for. Impacket's getST.py example script
            can be used for that purpose.
            <pre>
                <code>
                    {
                        "getST.py -spn 'cifs/targetcomputer.testlab.local' -impersonate 'admin' 'domain/attackersystem$:Summer2018!'"
                    }
                </code>
            </pre>
            This ticket can then be used with Pass-the-Ticket, and could grant access
            to the file system of the TARGETCOMPUTER.
        </>
    );
};

LinuxAbuse.propTypes = {
    sourceName: PropTypes.string,
};

export default LinuxAbuse;
