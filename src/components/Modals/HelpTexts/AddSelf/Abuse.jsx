const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" dfm.a /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

            To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. 
            
            You may need to authenticate to the Domain Controller as ${
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
    return { __html: text };
};

export default Abuse;
