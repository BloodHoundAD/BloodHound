import React from 'react';
import PropTypes from 'prop-types';

const Abuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>
                There are at least two ways to execute this attack. The first
                and most obvious is by using the built-in net.exe binary in
                Windows (e.g.: net user dfm.a Password123! /domain). See the
                opsec considerations tab for why this may be a bad idea. The
                second, and highly recommended method, is by using the
                Set-DomainUserPassword function in PowerView. This function is
                superior to using the net.exe binary in several ways. For
                instance, you can supply alternate credentials, instead of
                needing to run a process as or logon as the user with the
                ForceChangePassword privilege. Additionally, you have much safer
                execution options than you do with spawning net.exe (see the
                opsec tab).
            </p>
            <p>
                To abuse this privilege with PowerView's Set-DomainUserPassword,
                first import PowerView into your agent session or into a
                PowerShell instance at the console. You may need to authenticate
                to the Domain Controller as
                {sourceType === 'User'
                    ? `${sourceName} if you are not running a process as that user`
                    : `a member of ${sourceName} if you are not running a process as a member`}
                . To do this in conjunction with Set-DomainUserPassword, first
                create a PSCredential object (these examples comes from the
                PowerView help documentation):
            </p>
            <pre>
                <code>
                    {"$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force\n" +
                        "$Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)"}
                </code>
            </pre>
            <p>
                Then create a secure string object for the password you want to
                set on the target user:
            </p>
            <pre>
                <code>
                    {
                        "$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force"
                    }
                </code>
            </pre>
            <p>
                Finally, use Set-DomainUserPassword, optionally specifying $Cred
                if you are not already running a process as {sourceName}:
            </p>
            <pre>
                <code>
                    {
                        'Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred'
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
            <p>
                        You can also abuse this without using Windows-based
                        tooling if you are operating from a Linux host.
                        The net and rpcclient utilities from the Samba
                        toolset will let you forcefully change a users password.
                        The following command will leverage net to reset the password.
            </p>
            <pre>
                <code>{"net rpc password 'harmj0y' -U 'TESTLAB\\dfm.a' -S dc.testlab.local\n"}
                </code>
            </pre>
            <p>
                        The following commands will leverage rpcclient to reset
                        the password.
            </p>
            <pre>
                <code>{"rpcclient -U 'TESTLAB\\dfm.a' dc.testlab.local\n"+
                "rpcclient $> setuserinfo2 harmj0y 23 Password123!"}
                </code>
            </pre>
        </>
    );
};

Abuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
};

export default Abuse;
