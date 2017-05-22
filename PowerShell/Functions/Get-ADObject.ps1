function Get-ADObject {
<#
    .SYNOPSIS

        Takes a domain SID and returns the user, group, or computer object
        associated with it.

    .PARAMETER SID

        The SID of the domain object you're querying for.

    .PARAMETER Name

        The Name of the domain object you're querying for.

    .PARAMETER SamAccountName

        The SamAccountName of the domain object you're querying for.

    .PARAMETER Domain

        The domain to query for objects, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER Filter

        Additional LDAP filter string for the query.

    .PARAMETER ReturnRaw

        Switch. Return the raw object instead of translating its properties.
        Used by Set-ADObject to modify object properties.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-ADObject -SID "S-1-5-21-2620891829-2411261497-1773853088-1110"

        Get the domain object associated with the specified SID.

    .EXAMPLE

        PS C:\> Get-ADObject -ADSpath "CN=AdminSDHolder,CN=System,DC=testlab,DC=local"

        Get the AdminSDHolder object for the testlab.local domain.
#>

    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $SID,

        [String]
        $Name,

        [String]
        $SamAccountName,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [String]
        $Filter,

        [Switch]
        $ReturnRaw,

        [ValidateRange(1,10000)]
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )
    process {
        if($SID -and (-not $Domain)) {
            # if a SID is passed, try to resolve it to a reachable domain name for the searcher
            try {
                $Name = Convert-SidToName $SID
                if($Name) {
                    $Canonical = Convert-ADName -ObjectName $Name -InputType NT4 -OutputType Canonical
                    if($Canonical) {
                        $Domain = $Canonical.split("/")[0]
                    }
                    else {
                        Write-Verbose "Error resolving SID '$SID'"
                        return $Null
                    }
                }
            }
            catch {
                Write-Verbose "Error resolving SID '$SID' : $_"
                return $Null
            }
        }

        $ObjectSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize

        if($ObjectSearcher) {
            if($SID) {
                $ObjectSearcher.filter = "(&(objectsid=$SID)$Filter)"
            }
            elseif($Name) {
                $ObjectSearcher.filter = "(&(name=$Name)$Filter)"
            }
            elseif($SamAccountName) {
                $ObjectSearcher.filter = "(&(samAccountName=$SamAccountName)$Filter)"
            }

            try {
                $Results = $ObjectSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    if($ReturnRaw) {
                        $_
                    }
                    else {
                        # convert/process the LDAP fields for each result
                        Convert-LDAPProperty -Properties $_.Properties
                    }
                }
                $Results.dispose()
            }
            catch {
                Write-Verbose "Error building the searcher object!"
            }
            $ObjectSearcher.dispose()
        }
    }
}


