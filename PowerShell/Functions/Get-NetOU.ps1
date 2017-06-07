function Get-NetOU {
<#
    .SYNOPSIS

        Gets a list of all current OUs in a domain.

    .PARAMETER OUName

        The OU name to query for, wildcards accepted.

    .PARAMETER GUID

        Only return OUs with the specified GUID in their gplink property.

    .PARAMETER Domain

        The domain to query for OUs, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through.

    .PARAMETER FullData

        Switch. Return full OU objects instead of just object names (the default).

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetOU

        Returns the current OUs in the domain.

    .EXAMPLE

        PS C:\> Get-NetOU -OUName *admin* -Domain testlab.local

        Returns all OUs with "admin" in their name in the testlab.local domain.

     .EXAMPLE

        PS C:\> Get-NetOU -GUID 123-...

        Returns all OUs with linked to the specified group policy object.

     .EXAMPLE

        PS C:\> "*admin*","*server*" | Get-NetOU

        Get the full OU names for the given search terms piped on the pipeline.
#>

    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $OUName = '*',

        [String]
        $GUID,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [Switch]
        $FullData,

        [ValidateRange(1,10000)]
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    begin {
        $OUSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }
    process {
        if ($OUSearcher) {
            if ($GUID) {
                # if we're filtering for a GUID in .gplink
                $OUSearcher.filter="(&(objectCategory=organizationalUnit)(name=$OUName)(gplink=*$GUID*))"
            }
            else {
                $OUSearcher.filter="(&(objectCategory=organizationalUnit)(name=$OUName))"
            }

            try {
                $Results = $OUSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    if ($FullData) {
                        # convert/process the LDAP fields for each result
                        $OU = Convert-LDAPProperty -Properties $_.Properties
                        $OU.PSObject.TypeNames.Add('PowerView.OU')
                        $OU
                    }
                    else {
                        # otherwise just returning the ADS paths of the OUs
                        $_.properties.adspath
                    }
                }
                $Results.dispose()
                $OUSearcher.dispose()
            }
            catch {
                Write-Warning $_
            }
        }
    }
}


