function Get-NetLocalGroup {
<#
    .SYNOPSIS

        Gets a list of all current users in a specified local group,
        or returns the names of all local groups with -ListGroups.

    .PARAMETER ComputerName

        The hostname or IP to query for local group users.

    .PARAMETER ComputerFile

        File of hostnames/IPs to query for local group users.

    .PARAMETER GroupName

        The local group name to query for users. If not given, it defaults to "Administrators"

    .PARAMETER Recurse

        Switch. If the local member member is a domain group, recursively try to resolve its members to get a list of domain users who can access this machine.

    .PARAMETER API

        Switch. Use API calls instead of the WinNT service provider. Less information,
        but the results are faster.

    .PARAMETER IsDomain

        Switch. Only return results that are domain accounts.

    .PARAMETER DomainSID

        The SID of the enumerated machine's domain, used to identify if results are domain
        or local when using the -API flag.

    .EXAMPLE

        PS C:\> Get-NetLocalGroup

        Returns the usernames that of members of localgroup "Administrators" on the local host.

    .EXAMPLE

        PS C:\> Get-NetLocalGroup -ComputerName WINDOWSXP

        Returns all the local administrator accounts for WINDOWSXP

    .EXAMPLE

        PS C:\> Get-NetLocalGroup -ComputerName WINDOWS7 -Recurse

        Returns all effective local/domain users/groups that can access WINDOWS7 with
        local administrative privileges.

    .EXAMPLE

        PS C:\> "WINDOWS7", "WINDOWSSP" | Get-NetLocalGroup -API

        Returns all local groups on the the passed hosts using API calls instead of the
        WinNT service provider.

    .LINK

        http://stackoverflow.com/questions/21288220/get-all-local-members-and-groups-displayed-together
        http://msdn.microsoft.com/en-us/library/aa772211(VS.85).aspx
#>

    [CmdletBinding(DefaultParameterSetName = 'WinNT')]
    param(
        [Parameter(ParameterSetName = 'API', Position=0, ValueFromPipeline=$True)]
        [Parameter(ParameterSetName = 'WinNT', Position=0, ValueFromPipeline=$True)]
        [Alias('HostName')]
        [String[]]
        $ComputerName = $Env:ComputerName,

        [Parameter(ParameterSetName = 'WinNT')]
        [Parameter(ParameterSetName = 'API')]
        [ValidateScript({Test-Path -Path $_ })]
        [Alias('HostList')]
        [String]
        $ComputerFile,

        [Parameter(ParameterSetName = 'WinNT')]
        [Parameter(ParameterSetName = 'API')]
        [String]
        $GroupName = 'Administrators',

        [Parameter(ParameterSetName = 'API')]
        [Switch]
        $API,

        [Switch]
        $IsDomain,

        [ValidateNotNullOrEmpty()]
        [String]
        $DomainSID
    )

    process {

        $Servers = @()

        # if we have a host list passed, grab it
        if($ComputerFile) {
            $Servers = Get-Content -Path $ComputerFile
        }
        else {
            # otherwise assume a single host name
            $Servers += $ComputerName | Get-NameField
        }

        # query the specified group using the WINNT provider, and
        # extract fields as appropriate from the results
        ForEach($Server in $Servers) {

            if($API) {
                # if we're using the Netapi32 NetLocalGroupGetMembers API call to get the local group information

                # arguments for NetLocalGroupGetMembers
                $QueryLevel = 2
                $PtrInfo = [IntPtr]::Zero
                $EntriesRead = 0
                $TotalRead = 0
                $ResumeHandle = 0

                # get the local user information
                $Result = $Netapi32::NetLocalGroupGetMembers($Server, $GroupName, $QueryLevel, [ref]$PtrInfo, -1, [ref]$EntriesRead, [ref]$TotalRead, [ref]$ResumeHandle)

                # Locate the offset of the initial intPtr
                $Offset = $PtrInfo.ToInt64()

                $LocalUsers = @()

                # 0 = success
                if (($Result -eq 0) -and ($Offset -gt 0)) {

                    # Work out how mutch to increment the pointer by finding out the size of the structure
                    $Increment = $LOCALGROUP_MEMBERS_INFO_2::GetSize()

                    # parse all the result structures
                    for ($i = 0; ($i -lt $EntriesRead); $i++) {
                        # create a new int ptr at the given offset and cast the pointer as our result structure
                        $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
                        $Info = $NewIntPtr -as $LOCALGROUP_MEMBERS_INFO_2

                        $Offset = $NewIntPtr.ToInt64()
                        $Offset += $Increment

                        $SidString = ''
                        $Result2 = $Advapi32::ConvertSidToStringSid($Info.lgrmi2_sid, [ref]$SidString);$LastError = [Runtime.InteropServices.Marshal]::GetLastWin32Error()

                        if($Result2 -eq 0) {
                            # error?
                        }
                        else {
                            $IsGroup = $($Info.lgrmi2_sidusage -ne 'SidTypeUser')
                            $LocalUsers += @{
                                'ComputerName' = $Server
                                'AccountName' = $Info.lgrmi2_domainandname
                                'SID' = $SidString
                                'IsGroup' = $IsGroup
                                'Type' = 'LocalUser'
                            }
                        }
                    }

                    # free up the result buffer
                    $Null = $Netapi32::NetApiBufferFree($PtrInfo)

                    $MachineSid = ($LocalUsers | Where-Object {$_['SID'] -like '*-500'})['SID']
                    $MachineSid = $MachineSid.Substring(0, $MachineSid.LastIndexOf('-'))
                    try {
                        ForEach($LocalUser in $LocalUsers) {
                            if($DomainSID -and ($LocalUser['SID'] -match $DomainSID)) {
                                $LocalUser['IsDomain'] = $True
                            }
                            elseif($LocalUser['SID'] -match $MachineSid) {
                                $LocalUser['IsDomain'] = $False
                            }
                            else {
                                $LocalUser['IsDomain'] = $True
                            }
                            if($IsDomain) {
                                if($LocalUser['IsDomain']) {
                                    $LocalUser
                                }
                            }
                            else {
                                $LocalUser
                            }
                        }
                    }
                    catch { }
                }
                else {
                    # error
                }
            }

            else {
                # otherwise we're using the WinNT service provider
                try {
                    $LocalUsers = @()
                    $Members = @($([ADSI]"WinNT://$Server/$GroupName,group").psbase.Invoke('Members'))

                    $Members | ForEach-Object {
                        $LocalUser = ([ADSI]$_)

                        $AdsPath = $LocalUser.InvokeGet('AdsPath').Replace('WinNT://', '')

                        if(([regex]::Matches($AdsPath, '/')).count -eq 1) {
                            # DOMAIN\user
                            $MemberIsDomain = $True
                            $Name = $AdsPath.Replace('/', '\')
                        }
                        else {
                            # DOMAIN\machine\user
                            $MemberIsDomain = $False
                            $Name = $AdsPath.Substring($AdsPath.IndexOf('/')+1).Replace('/', '\')
                        }

                        $IsGroup = ($LocalUser.SchemaClassName -like 'group')
                        if($IsDomain) {
                            if($MemberIsDomain) {
                                $LocalUsers += @{
                                    'ComputerName' = $Server
                                    'AccountName' = $Name
                                    'SID' = ((New-Object System.Security.Principal.SecurityIdentifier($LocalUser.InvokeGet('ObjectSID'),0)).Value)
                                    'IsGroup' = $IsGroup
                                    'IsDomain' = $MemberIsDomain
                                    'Type' = 'LocalUser'
                                }
                            }
                        }
                        else {
                            $LocalUsers += @{
                                'ComputerName' = $Server
                                'AccountName' = $Name
                                'SID' = ((New-Object System.Security.Principal.SecurityIdentifier($LocalUser.InvokeGet('ObjectSID'),0)).Value)
                                'IsGroup' = $IsGroup
                                'IsDomain' = $MemberIsDomain
                                'Type' = 'LocalUser'
                            }
                        }
                    }
                    $LocalUsers
                }
                catch {
                    Write-Verbose "Get-NetLocalGroup error for $Server : $_"
                }
            }
        }
    }
}


filter Get-NetLoggedon {
<#
    .SYNOPSIS

        This function will execute the NetWkstaUserEnum Win32API call to query
        a given host for actively logged on users.

    .PARAMETER ComputerName

        The hostname to query for logged on users.

    .OUTPUTS

        WKSTA_USER_INFO_1 structure. A representation of the WKSTA_USER_INFO_1
        result structure which includes the username and domain of logged on users,
        with the ComputerName added.

    .EXAMPLE

        PS C:\> Get-NetLoggedon

        Returns users actively logged onto the local host.

    .EXAMPLE

        PS C:\> Get-NetLoggedon -ComputerName sqlserver

        Returns users actively logged onto the 'sqlserver' host.

    .EXAMPLE

        PS C:\> Get-NetComputer | Get-NetLoggedon

        Returns all logged on userse for all computers in the domain.

    .LINK

        http://www.powershellmagazine.com/2014/09/25/easily-defining-enums-structs-and-win32-functions-in-memory/
#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [Object[]]
        [ValidateNotNullOrEmpty()]
        $ComputerName = 'localhost'
    )

    # extract the computer name from whatever object was passed on the pipeline
    $Computer = $ComputerName | Get-NameField

    # Declare the reference variables
    $QueryLevel = 1
    $PtrInfo = [IntPtr]::Zero
    $EntriesRead = 0
    $TotalRead = 0
    $ResumeHandle = 0

    # get logged on user information
    $Result = $Netapi32::NetWkstaUserEnum($Computer, $QueryLevel, [ref]$PtrInfo, -1, [ref]$EntriesRead, [ref]$TotalRead, [ref]$ResumeHandle)

    # Locate the offset of the initial intPtr
    $Offset = $PtrInfo.ToInt64()

    # 0 = success
    if (($Result -eq 0) -and ($Offset -gt 0)) {

        # Work out how mutch to increment the pointer by finding out the size of the structure
        $Increment = $WKSTA_USER_INFO_1::GetSize()

        # parse all the result structures
        for ($i = 0; ($i -lt $EntriesRead); $i++) {
            # create a new int ptr at the given offset and cast the pointer as our result structure
            $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
            $Info = $NewIntPtr -as $WKSTA_USER_INFO_1

            # return all the sections of the structure
            $LoggedOn = $Info | Select-Object *
            $LoggedOn | Add-Member Noteproperty 'ComputerName' $Computer
            $Offset = $NewIntPtr.ToInt64()
            $Offset += $Increment
            $LoggedOn
        }

        # free up the result buffer
        $Null = $Netapi32::NetApiBufferFree($PtrInfo)
    }
    else {
        Write-Verbose "Error: $(([ComponentModel.Win32Exception] $Result).Message)"
    }
}


filter Get-NetSession {
<#
    .SYNOPSIS

        This function will execute the NetSessionEnum Win32API call to query
        a given host for active sessions on the host.
        Heavily adapted from dunedinite's post on stackoverflow (see LINK below)

    .PARAMETER ComputerName

        The ComputerName to query for active sessions.

    .PARAMETER UserName

        The user name to filter for active sessions.

    .OUTPUTS

        SESSION_INFO_10 structure. A representation of the SESSION_INFO_10
        result structure which includes the host and username associated
        with active sessions, with the ComputerName added.

    .EXAMPLE

        PS C:\> Get-NetSession

        Returns active sessions on the local host.

    .EXAMPLE

        PS C:\> Get-NetSession -ComputerName sqlserver

        Returns active sessions on the 'sqlserver' host.

    .EXAMPLE

        PS C:\> Get-NetDomainController | Get-NetSession

        Returns active sessions on all domain controllers.

    .LINK

        http://www.powershellmagazine.com/2014/09/25/easily-defining-enums-structs-and-win32-functions-in-memory/
#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [Object[]]
        [ValidateNotNullOrEmpty()]
        $ComputerName = 'localhost',

        [String]
        $UserName = ''
    )

    # extract the computer name from whatever object was passed on the pipeline
    $Computer = $ComputerName | Get-NameField

    # arguments for NetSessionEnum
    $QueryLevel = 10
    $PtrInfo = [IntPtr]::Zero
    $EntriesRead = 0
    $TotalRead = 0
    $ResumeHandle = 0

    # get session information
    $Result = $Netapi32::NetSessionEnum($Computer, '', $UserName, $QueryLevel, [ref]$PtrInfo, -1, [ref]$EntriesRead, [ref]$TotalRead, [ref]$ResumeHandle)

    # Locate the offset of the initial intPtr
    $Offset = $PtrInfo.ToInt64()

    # 0 = success
    if (($Result -eq 0) -and ($Offset -gt 0)) {

        # Work out how mutch to increment the pointer by finding out the size of the structure
        $Increment = $SESSION_INFO_10::GetSize()

        # parse all the result structures
        for ($i = 0; ($i -lt $EntriesRead); $i++) {
            # create a new int ptr at the given offset and cast the pointer as our result structure
            $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
            $Info = $NewIntPtr -as $SESSION_INFO_10

            # return all the sections of the structure
            $Sessions = $Info | Select-Object *
            $Sessions | Add-Member Noteproperty 'ComputerName' $Computer
            $Offset = $NewIntPtr.ToInt64()
            $Offset += $Increment
            $Sessions
        }
        # free up the result buffer
        $Null = $Netapi32::NetApiBufferFree($PtrInfo)
    }
    else {
        Write-Verbose "Error: $(([ComponentModel.Win32Exception] $Result).Message)"
    }
}


filter Get-LoggedOnLocal {
<#
    .SYNOPSIS

        This function will query the HKU registry values to retrieve the local
        logged on users SID and then attempt and reverse it.
        Adapted technique from Sysinternal's PSLoggedOn script. Benefit over
        using the NetWkstaUserEnum API (Get-NetLoggedon) of less user privileges
        required (NetWkstaUserEnum requires remote admin access).

        Note: This function requires only domain user rights on the
        machine you're enumerating, but remote registry must be enabled.

        Function: Get-LoggedOnLocal
        Author: Matt Kelly, @BreakersAll

    .PARAMETER ComputerName

        The ComputerName to query for active sessions.

    .EXAMPLE

        PS C:\> Get-LoggedOnLocal

        Returns active sessions on the local host.

    .EXAMPLE

        PS C:\> Get-LoggedOnLocal -ComputerName sqlserver

        Returns active sessions on the 'sqlserver' host.

#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [Object[]]
        [ValidateNotNullOrEmpty()]
        $ComputerName = 'localhost'
    )

    # process multiple host object types from the pipeline
    $ComputerName = Get-NameField -Object $ComputerName

    try {
        # retrieve HKU remote registry values
        $Reg = [Microsoft.Win32.RegistryKey]::OpenRemoteBaseKey('Users', "$ComputerName")

        # sort out bogus sid's like _class
        $Reg.GetSubKeyNames() | Where-Object { $_ -match 'S-1-5-21-[0-9]+-[0-9]+-[0-9]+-[0-9]+$' } | ForEach-Object {
            $UserName = Convert-SidToName $_

            $Parts = $UserName.Split('\')
            $UserDomain = $Null
            $UserName = $Parts[-1]
            if ($Parts.Length -eq 2) {
                $UserDomain = $Parts[0]
            }

            $LocalLoggedOnUser = New-Object PSObject
            $LocalLoggedOnUser | Add-Member Noteproperty 'ComputerName' "$ComputerName"
            $LocalLoggedOnUser | Add-Member Noteproperty 'UserDomain' $UserDomain
            $LocalLoggedOnUser | Add-Member Noteproperty 'UserName' $UserName
            $LocalLoggedOnUser | Add-Member Noteproperty 'UserSID' $_
            $LocalLoggedOnUser
        }
    }
    catch { }
}


########################################################
#
# Domain trust functions below.
#
########################################################

