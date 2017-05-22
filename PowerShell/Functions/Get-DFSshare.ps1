function Get-DFSshare {
<#
    .SYNOPSIS

        Returns a list of all fault-tolerant distributed file
        systems for a given domain.

    .PARAMETER Version

        The version of DFS to query for servers.
        1/v1, 2/v2, or all

    .PARAMETER Domain

        The domain to query for user DFS shares, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-DFSshare

        Returns all distributed file system shares for the current domain.

    .EXAMPLE

        PS C:\> Get-DFSshare -Domain test

        Returns all distributed file system shares for the 'test' domain.
#>

    [CmdletBinding()]
    param(
        [String]
        [ValidateSet("All","V1","1","V2","2")]
        $Version = "All",

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [ValidateRange(1,10000)]
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    function Parse-Pkt {
        [CmdletBinding()]
        param(
            [byte[]]
            $Pkt
        )

        $bin = $Pkt
        $blob_version = [bitconverter]::ToUInt32($bin[0..3],0)
        $blob_element_count = [bitconverter]::ToUInt32($bin[4..7],0)
        $offset = 8
        #https://msdn.microsoft.com/en-us/library/cc227147.aspx
        $object_list = @()
        for($i=1; $i -le $blob_element_count; $i++){
               $blob_name_size_start = $offset
               $blob_name_size_end = $offset + 1
               $blob_name_size = [bitconverter]::ToUInt16($bin[$blob_name_size_start..$blob_name_size_end],0)

               $blob_name_start = $blob_name_size_end + 1
               $blob_name_end = $blob_name_start + $blob_name_size - 1
               $blob_name = [System.Text.Encoding]::Unicode.GetString($bin[$blob_name_start..$blob_name_end])

               $blob_data_size_start = $blob_name_end + 1
               $blob_data_size_end = $blob_data_size_start + 3
               $blob_data_size = [bitconverter]::ToUInt32($bin[$blob_data_size_start..$blob_data_size_end],0)

               $blob_data_start = $blob_data_size_end + 1
               $blob_data_end = $blob_data_start + $blob_data_size - 1
               $blob_data = $bin[$blob_data_start..$blob_data_end]
               switch -wildcard ($blob_name) {
                "\siteroot" {  }
                "\domainroot*" {
                    # Parse DFSNamespaceRootOrLinkBlob object. Starts with variable length DFSRootOrLinkIDBlob which we parse first...
                    # DFSRootOrLinkIDBlob
                    $root_or_link_guid_start = 0
                    $root_or_link_guid_end = 15
                    $root_or_link_guid = [byte[]]$blob_data[$root_or_link_guid_start..$root_or_link_guid_end]
                    $guid = New-Object Guid(,$root_or_link_guid) # should match $guid_str
                    $prefix_size_start = $root_or_link_guid_end + 1
                    $prefix_size_end = $prefix_size_start + 1
                    $prefix_size = [bitconverter]::ToUInt16($blob_data[$prefix_size_start..$prefix_size_end],0)
                    $prefix_start = $prefix_size_end + 1
                    $prefix_end = $prefix_start + $prefix_size - 1
                    $prefix = [System.Text.Encoding]::Unicode.GetString($blob_data[$prefix_start..$prefix_end])

                    $short_prefix_size_start = $prefix_end + 1
                    $short_prefix_size_end = $short_prefix_size_start + 1
                    $short_prefix_size = [bitconverter]::ToUInt16($blob_data[$short_prefix_size_start..$short_prefix_size_end],0)
                    $short_prefix_start = $short_prefix_size_end + 1
                    $short_prefix_end = $short_prefix_start + $short_prefix_size - 1
                    $short_prefix = [System.Text.Encoding]::Unicode.GetString($blob_data[$short_prefix_start..$short_prefix_end])

                    $type_start = $short_prefix_end + 1
                    $type_end = $type_start + 3
                    $type = [bitconverter]::ToUInt32($blob_data[$type_start..$type_end],0)

                    $state_start = $type_end + 1
                    $state_end = $state_start + 3
                    $state = [bitconverter]::ToUInt32($blob_data[$state_start..$state_end],0)

                    $comment_size_start = $state_end + 1
                    $comment_size_end = $comment_size_start + 1
                    $comment_size = [bitconverter]::ToUInt16($blob_data[$comment_size_start..$comment_size_end],0)
                    $comment_start = $comment_size_end + 1
                    $comment_end = $comment_start + $comment_size - 1
                    if ($comment_size -gt 0)  {
                        $comment = [System.Text.Encoding]::Unicode.GetString($blob_data[$comment_start..$comment_end])
                    }
                    $prefix_timestamp_start = $comment_end + 1
                    $prefix_timestamp_end = $prefix_timestamp_start + 7
                    # https://msdn.microsoft.com/en-us/library/cc230324.aspx FILETIME
                    $prefix_timestamp = $blob_data[$prefix_timestamp_start..$prefix_timestamp_end] #dword lowDateTime #dword highdatetime
                    $state_timestamp_start = $prefix_timestamp_end + 1
                    $state_timestamp_end = $state_timestamp_start + 7
                    $state_timestamp = $blob_data[$state_timestamp_start..$state_timestamp_end]
                    $comment_timestamp_start = $state_timestamp_end + 1
                    $comment_timestamp_end = $comment_timestamp_start + 7
                    $comment_timestamp = $blob_data[$comment_timestamp_start..$comment_timestamp_end]
                    $version_start = $comment_timestamp_end  + 1
                    $version_end = $version_start + 3
                    $version = [bitconverter]::ToUInt32($blob_data[$version_start..$version_end],0)

                    # Parse rest of DFSNamespaceRootOrLinkBlob here
                    $dfs_targetlist_blob_size_start = $version_end + 1
                    $dfs_targetlist_blob_size_end = $dfs_targetlist_blob_size_start + 3
                    $dfs_targetlist_blob_size = [bitconverter]::ToUInt32($blob_data[$dfs_targetlist_blob_size_start..$dfs_targetlist_blob_size_end],0)

                    $dfs_targetlist_blob_start = $dfs_targetlist_blob_size_end + 1
                    $dfs_targetlist_blob_end = $dfs_targetlist_blob_start + $dfs_targetlist_blob_size - 1
                    $dfs_targetlist_blob = $blob_data[$dfs_targetlist_blob_start..$dfs_targetlist_blob_end]
                    $reserved_blob_size_start = $dfs_targetlist_blob_end + 1
                    $reserved_blob_size_end = $reserved_blob_size_start + 3
                    $reserved_blob_size = [bitconverter]::ToUInt32($blob_data[$reserved_blob_size_start..$reserved_blob_size_end],0)

                    $reserved_blob_start = $reserved_blob_size_end + 1
                    $reserved_blob_end = $reserved_blob_start + $reserved_blob_size - 1
                    $reserved_blob = $blob_data[$reserved_blob_start..$reserved_blob_end]
                    $referral_ttl_start = $reserved_blob_end + 1
                    $referral_ttl_end = $referral_ttl_start + 3
                    $referral_ttl = [bitconverter]::ToUInt32($blob_data[$referral_ttl_start..$referral_ttl_end],0)

                    #Parse DFSTargetListBlob
                    $target_count_start = 0
                    $target_count_end = $target_count_start + 3
                    $target_count = [bitconverter]::ToUInt32($dfs_targetlist_blob[$target_count_start..$target_count_end],0)
                    $t_offset = $target_count_end + 1

                    for($j=1; $j -le $target_count; $j++){
                        $target_entry_size_start = $t_offset
                        $target_entry_size_end = $target_entry_size_start + 3
                        $target_entry_size = [bitconverter]::ToUInt32($dfs_targetlist_blob[$target_entry_size_start..$target_entry_size_end],0)
                        $target_time_stamp_start = $target_entry_size_end + 1
                        $target_time_stamp_end = $target_time_stamp_start + 7
                        # FILETIME again or special if priority rank and priority class 0
                        $target_time_stamp = $dfs_targetlist_blob[$target_time_stamp_start..$target_time_stamp_end]
                        $target_state_start = $target_time_stamp_end + 1
                        $target_state_end = $target_state_start + 3
                        $target_state = [bitconverter]::ToUInt32($dfs_targetlist_blob[$target_state_start..$target_state_end],0)

                        $target_type_start = $target_state_end + 1
                        $target_type_end = $target_type_start + 3
                        $target_type = [bitconverter]::ToUInt32($dfs_targetlist_blob[$target_type_start..$target_type_end],0)

                        $server_name_size_start = $target_type_end + 1
                        $server_name_size_end = $server_name_size_start + 1
                        $server_name_size = [bitconverter]::ToUInt16($dfs_targetlist_blob[$server_name_size_start..$server_name_size_end],0)

                        $server_name_start = $server_name_size_end + 1
                        $server_name_end = $server_name_start + $server_name_size - 1
                        $server_name = [System.Text.Encoding]::Unicode.GetString($dfs_targetlist_blob[$server_name_start..$server_name_end])

                        $share_name_size_start = $server_name_end + 1
                        $share_name_size_end = $share_name_size_start + 1
                        $share_name_size = [bitconverter]::ToUInt16($dfs_targetlist_blob[$share_name_size_start..$share_name_size_end],0)
                        $share_name_start = $share_name_size_end + 1
                        $share_name_end = $share_name_start + $share_name_size - 1
                        $share_name = [System.Text.Encoding]::Unicode.GetString($dfs_targetlist_blob[$share_name_start..$share_name_end])

                        $target_list += "\\$server_name\$share_name"
                        $t_offset = $share_name_end + 1
                    }
                }
            }
            $offset = $blob_data_end + 1
            $dfs_pkt_properties = @{
                'Name' = $blob_name
                'Prefix' = $prefix
                'TargetList' = $target_list
            }
            $object_list += New-Object -TypeName PSObject -Property $dfs_pkt_properties
            $prefix = $null
            $blob_name = $null
            $target_list = $null
        }

        $servers = @()
        $object_list | ForEach-Object {
            if ($_.TargetList) {
                $_.TargetList | ForEach-Object {
                    $servers += $_.split("\")[2]
                }
            }
        }

        $servers
    }

    function Get-DFSshareV1 {
        [CmdletBinding()]
        param(
            [String]
            $Domain,

            [String]
            $DomainController,

            [String]
            $ADSpath,

            [ValidateRange(1,10000)]
            [Int]
            $PageSize = 200,

            [Management.Automation.PSCredential]
            $Credential
        )

        $DFSsearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize

        if($DFSsearcher) {
            $DFSshares = @()
            $DFSsearcher.filter = "(&(objectClass=fTDfs))"

            try {
                $Results = $DFSSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    $Properties = $_.Properties
                    $RemoteNames = $Properties.remoteservername
                    $Pkt = $Properties.pkt

                    $DFSshares += $RemoteNames | ForEach-Object {
                        try {
                            if ( $_.Contains('\') ) {
                                New-Object -TypeName PSObject -Property @{'Name'=$Properties.name[0];'RemoteServerName'=$_.split("\")[2]}
                            }
                        }
                        catch {
                            Write-Verbose "Error in parsing DFS share : $_"
                        }
                    }
                }
                $Results.dispose()
                $DFSSearcher.dispose()

                if($pkt -and $pkt[0]) {
                    Parse-Pkt $pkt[0] | ForEach-Object {
                        # If a folder doesn't have a redirection it will
                        # have a target like
                        # \\null\TestNameSpace\folder\.DFSFolderLink so we
                        # do actually want to match on "null" rather than
                        # $null
                        if ($_ -ne "null") {
                            New-Object -TypeName PSObject -Property @{'Name'=$Properties.name[0];'RemoteServerName'=$_}
                        }
                    }
                }
            }
            catch {
                Write-Warning "Get-DFSshareV1 error : $_"
            }
            $DFSshares | Sort-Object -Property "RemoteServerName"
        }
    }

    function Get-DFSshareV2 {
        [CmdletBinding()]
        param(
            [String]
            $Domain,

            [String]
            $DomainController,

            [String]
            $ADSpath,

            [ValidateRange(1,10000)]
            [Int]
            $PageSize = 200,

            [Management.Automation.PSCredential]
            $Credential
        )

        $DFSsearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize

        if($DFSsearcher) {
            $DFSshares = @()
            $DFSsearcher.filter = "(&(objectClass=msDFS-Linkv2))"
            $DFSSearcher.PropertiesToLoad.AddRange(('msdfs-linkpathv2','msDFS-TargetListv2'))

            try {
                $Results = $DFSSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    $Properties = $_.Properties
                    $target_list = $Properties.'msdfs-targetlistv2'[0]
                    $xml = [xml][System.Text.Encoding]::Unicode.GetString($target_list[2..($target_list.Length-1)])
                    $DFSshares += $xml.targets.ChildNodes | ForEach-Object {
                        try {
                            $Target = $_.InnerText
                            if ( $Target.Contains('\') ) {
                                $DFSroot = $Target.split("\")[3]
                                $ShareName = $Properties.'msdfs-linkpathv2'[0]
                                New-Object -TypeName PSObject -Property @{'Name'="$DFSroot$ShareName";'RemoteServerName'=$Target.split("\")[2]}
                            }
                        }
                        catch {
                            Write-Verbose "Error in parsing target : $_"
                        }
                    }
                }
                $Results.dispose()
                $DFSSearcher.dispose()
            }
            catch {
                Write-Warning "Get-DFSshareV2 error : $_"
            }
            $DFSshares | Sort-Object -Unique -Property "RemoteServerName"
        }
    }

    $DFSshares = @()

    if ( ($Version -eq "all") -or ($Version.endsWith("1")) ) {
        $DFSshares += Get-DFSshareV1 -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }
    if ( ($Version -eq "all") -or ($Version.endsWith("2")) ) {
        $DFSshares += Get-DFSshareV2 -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }

    $DFSshares | Sort-Object -Property ("RemoteServerName","Name") -Unique
}


########################################################
#
# GPO related functions.
#
########################################################

