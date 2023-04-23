import React from 'react';
import PropTypes from "prop-types";

const Abuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>
                There are at least two ways to execute this attack. The first
                and most obvious is by using the built-in net.exe binary in
                Windows (e.g.: net group "Domain Admins" dfm.a /add /domain).
                See the opsec considerations tab for why this may be a bad idea.
                The second, and highly recommended method, is by using the
                Add-DomainGroupMember function in PowerView. This function is
                superior to using the net.exe binary in several ways. For
                instance, you can supply alternate credentials, instead of
                needing to run a process as or logon as the user with the
                AddMember privilege. Additionally, you have much safer execution
                options than you do with spawning net.exe (see the opsec tab).
            </p>

            <p>
                To abuse this privilege with PowerView's Add-DomainGroupMember,
                first import PowerView into your agent session or into a
                PowerShell instance at the console.
            </p>

            <p>
                You may need to authenticate to the Domain Controller as{' '}
                {sourceType === 'User'
                    ? `${sourceName} if you are not running a process as that user`
                    : `a member of ${sourceName} if you are not running a process as a member`}
                . To do this in conjunction with Add-DomainGroupMember, first
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
                Then, use Add-DomainGroupMember, optionally specifying $Cred if
                you are not already running a process as {sourceName}:
            </p>

            <pre>
                <code>
                    {
                        "Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred"
                    }
                </code>
            </pre>

            <p>
                Finally, verify that the user was successfully added to the
                group with PowerView's Get-DomainGroupMember:
            </p>

            <pre>
                <code>{"Get-DomainGroupMember -Identity 'Domain Admins'"}</code>
            </pre>
                    <p>
                        You can also abuse this without using Windows-based
                        tooling if you are operating from a Linux host.
                        The net from the Samba toolset will let you add a
                        user to the vulnerable group.
                    </p>
            <pre>
                <code>{"net rpc group addmem 'Domain Admins' 'harmj0y' -U 'TESTLAB\\dfm.a' -S dc.testlab.local"}</code>
            </pre>
        </>
    );
};

Abuse.propTypes= {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string
}

export default Abuse;
