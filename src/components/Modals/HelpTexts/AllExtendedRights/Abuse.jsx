const Abuse = (sourceName, sourceType, targetName, targetType, haslaps) => {
    let text;
    if (targetType === 'User') {
        text = `The AllExtendedRights privilege grants ${sourceName} the ability to change the password of the user ${targetName} without knowing their current password. This is equivalent to the “ForceChangePassword” edge in BloodHound.

        There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net user dfm.a Password123! /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Set-DomainUserPassword function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the ForceChangePassword privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

        To abuse this privilege with PowerView's Set-DomainUserPassword, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
            sourceType === 'User'
                ? `${sourceName} if you are not running a process as that user`
                : `a member of ${sourceName} if you are not running a process as a member`
        }. To do this in conjunction with Set-DomainUserPassword, first create a PSCredential object (these examples comes from the PowerView help documentation):

        <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
        $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)</code>

        Then create a secure string object for the password you want to set on the target user:

        <code>$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force</code>

        Finally, use Set-DomainUserPassword, optionally specifying $Cred if you are not already running a process as ${sourceName}:

        <code>Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred</code>

        Now that you know the target user's plain text password, you can either start a new agent as that user, or use that user's credentials in conjunction with PowerView's ACL abuse functions, or perhaps even RDP to a system the target user has access to. For more ideas and information, see the references tab.`;
    } else if (targetType === 'Computer') {
        if (haslaps) {
            text = `The AllExtendedRights privilege grants ${sourceName} the ability to obtain the RID 500 administrator password of ${targetName}. ${sourceName} can do so by listing a computer object’s AD properties with PowerView using Get-DomainComputer ${targetName}.  The value of the ms-mcs-AdmPwd property will contain password of the administrative local account on ${targetName}.`;
        } else {
            text = `This ACE is not exploitable under current conditions. Please report this bug to the BloodHound developers`;
        }
    } else if (targetType === 'Domain') {
        text = `The AllExtendedRights privilege grants ${sourceName} both the DS-Replication-Get-Changes and DS-Replication-Get-Changes-All privileges, which combined allow a principal to replicate objects from the domain ${targetName}. This can be abused using the lsadump::dcsync command in mimikatz.`;
    }
    return { __html: text };
};

export default Abuse;
