import React from 'react';

const LinuxAbuse = () => {
    return (
        <>
            <p>
                In the following example, *victim* is the attacker-controlled
                account (i.e. the hash is known) that is configured for
                constrained delegation. That is, *victim* has the
                "HTTP/PRIMARY.testlab.local" service principal name (SPN) set in
                its msds-AllowedToDelegateTo property. The command first
                requests a TGT for the *victim* user and executes the
                S4U2self/S4U2proxy process to impersonate the "admin" user to
                the "HTTP/PRIMARY.testlab.local" SPN. The alternative sname
                "cifs" is substituted in to the final service ticket. This grants
                the attacker the ability to access the file system of
                PRIMARY.testlab.local as the "admin" user.
            </p>

            <pre>
                <code>
                    {
                        "getST.py -spn 'HTTP/PRIMARY.testlab.local' -impersonate 'admin' -altservice 'cifs' -hashes :2b576acbe6bcfda7294d6bd18041b8fe 'domain/victim'"
                    }
                </code>
            </pre>
        </>
    );
};

export default LinuxAbuse;
