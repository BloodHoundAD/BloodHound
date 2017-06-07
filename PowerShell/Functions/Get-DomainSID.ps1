function Get-DomainSID {
<#
    .SYNOPSIS

        Gets the SID for the domain.

    .PARAMETER Domain

        The domain to query, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .EXAMPLE

        C:\> Get-DomainSID -Domain TEST

        Returns SID for the domain 'TEST'
#>

    param(
        [String]
        $Domain,

        [String]
        $DomainController
    )

    $ComputerSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController
    $ComputerSearcher.Filter = '(sAMAccountType=805306369)'
    $Null = $ComputerSearcher.PropertiesToLoad.Add('objectsid')
    $Result = $ComputerSearcher.FindOne()

    if(-not $Result) {
        Write-Verbose "Get-DomainSID: no results retrieved"
    }
    else {
        $DCObject = Convert-LDAPProperty -Properties $Result.Properties
        $DCSID = $DCObject.objectsid
        $DCSID.Substring(0, $DCSID.LastIndexOf('-'))
    }
}


