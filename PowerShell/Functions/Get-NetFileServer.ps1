function Get-NetFileServer {
<#
    .SYNOPSIS

        Returns a list of all file servers extracted from user
        homedirectory, scriptpath, and profilepath fields.

    .PARAMETER Domain

        The domain to query for user file servers, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetFileServer

        Returns active file servers.

    .EXAMPLE

        PS C:\> Get-NetFileServer -Domain testing

        Returns active file servers for the 'testing' domain.
#>

    [CmdletBinding()]
    param(
        [String]
        $Domain,

        [String]
        $DomainController,

        [ValidateRange(1,10000)]
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    function Split-Path {
        # short internal helper to split UNC server paths
        param([String]$Path)

        if ($Path -and ($Path.split("\\").Count -ge 3)) {
            $Temp = $Path.split("\\")[2]
            if($Temp -and ($Temp -ne '')) {
                $Temp
            }
        }
    }

    $UserSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -PageSize $PageSize

    # only search for user objects that have one of the fields we're interested in set
    $UserSearcher.filter = "(&(samAccountType=805306368)(|(homedirectory=*)(scriptpath=*)(profilepath=*)))"

    # only return the fields we're interested in
    $UserSearcher.PropertiesToLoad.AddRange(('homedirectory', 'scriptpath', 'profilepath'))

    # get all results w/o the pipeline and uniquify them (I know it's not pretty)
    Sort-Object -Unique -InputObject $(ForEach($UserResult in $UserSearcher.FindAll()) {if($UserResult.Properties['homedirectory']) {Split-Path($UserResult.Properties['homedirectory'])}if($UserResult.Properties['scriptpath']) {Split-Path($UserResult.Properties['scriptpath'])}if($UserResult.Properties['profilepath']) {Split-Path($UserResult.Properties['profilepath'])}})
}


