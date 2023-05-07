import React from 'react';

const WindowsAbuse = () => {
    return (
        <>
            <p>
                Abusing this privilege can utilize Benjamin Delpy's Kekeo
                project, proxying in traffic generated from the Impacket
                library, or using the Rubeus project's s4u abuse.
            </p>

            <p>
                In the following example, *victim* is the attacker-controlled
                account (i.e. the hash is known) that is configured for
                constrained delegation. That is, *victim* has the
                "HTTP/PRIMARY.testlab.local" service principal name (SPN) set in
                its msds-AllowedToDelegateTo property. The command first
                requests a TGT for the *victim* user and executes the
                S4U2self/S4U2proxy process to impersonate the "admin" user to
                the "HTTP/PRIMARY.testlab.local" SPN. The alternative sname
                "cifs" is substituted in to the final service ticket and the
                ticket is submitted to the current logon session. This grants
                the attacker the ability to access the file system of
                PRIMARY.testlab.local as the "admin" user.
            </p>

            <pre>
                <code>
                    {
                        'Rubeus.exe s4u /user:victim /rc4:2b576acbe6bcfda7294d6bd18041b8fe /impersonateuser:admin /msdsspn:"HTTP/PRIMARY.testlab.local" /altservice:cifs /ptt'
                    }
                </code>
            </pre>
        </>
    );
};

export default WindowsAbuse;
