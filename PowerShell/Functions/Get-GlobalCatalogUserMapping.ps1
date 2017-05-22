function Get-GlobalCatalogUserMapping {
<#
    .SYNOPSIS

        Returns a hashtable for all users in the global catalog, format of {username->domain}.
        This is used for user session deconfliction in the Export-BloodHound* functions for
        when a user session doesn't have a login domain.

    .PARAMETER GlobalCatalog

        The global catalog location to resole user memberships from, form of GC://global.catalog.
#>
    [CmdletBinding()]
    param(
        [ValidatePattern('^GC://')]
        [String]
        $GlobalCatalog
    )

    if(-not $PSBoundParameters['GlobalCatalog']) {
        $GCPath = ([ADSI]'LDAP://RootDSE').dnshostname
        $ADSPath = "GC://$GCPath"
        Write-Verbose "Enumerated global catalog location: $ADSPath"
    }
    else {
        $ADSpath = $GlobalCatalog
    }

    $UserDomainMappings = @{}

    $UserSearcher = Get-DomainSearcher -ADSpath $ADSpath
    $UserSearcher.filter = '(samAccountType=805306368)'
    $UserSearcher.PropertiesToLoad.AddRange(('samaccountname','distinguishedname', 'cn', 'objectsid'))

    ForEach($User in $UserSearcher.FindAll()) {
        $UserName = $User.Properties['samaccountname'][0].ToUpper()
        $UserDN = $User.Properties['distinguishedname'][0]

        if($UserDN -and ($UserDN -ne '')) {
            if (($UserDN -match 'ForeignSecurityPrincipals') -and ($UserDN -match 'S-1-5-21')) {
                try {
                    if(-not $MemberSID) {
                        $MemberSID = $User.Properties['cn'][0]
                    }
                    $UserSid = (New-Object System.Security.Principal.SecurityIdentifier($User.Properties['objectsid'][0],0)).Value
                    $MemberSimpleName = Convert-SidToName -SID $UserSid | Convert-ADName -InputType 'NT4' -OutputType 'Canonical'
                    if($MemberSimpleName) {
                        $UserDomain = $MemberSimpleName.Split('/')[0]
                    }
                    else {
                        Write-Verbose "Error converting $UserDN"
                        $UserDomain = $Null
                    }
                }
                catch {
                    Write-Verbose "Error converting $UserDN"
                    $UserDomain = $Null
                }
            }
            else {
                # extract the FQDN from the Distinguished Name
                $UserDomain = ($UserDN.subString($UserDN.IndexOf('DC=')) -replace 'DC=','' -replace ',','.').ToUpper()
            }
            if($UserDomain) {
                if(-not $UserDomainMappings[$UserName]) {
                    $UserDomainMappings[$UserName] = @($UserDomain)
                }
                elseif($UserDomainMappings[$UserName] -notcontains $UserDomain) {
                    $UserDomainMappings[$UserName] += $UserDomain
                }
            }
        }
    }

    $UserSearcher.dispose()
    $UserDomainMappings
}


