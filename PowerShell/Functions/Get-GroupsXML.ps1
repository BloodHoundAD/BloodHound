function Get-GroupsXML {
<#
    .SYNOPSIS

        Helper to parse a groups.xml file path into a custom object.

    .PARAMETER GroupsXMLpath

        The groups.xml file path name to parse.

    .PARAMETER UsePSDrive

        Switch. Mount the target groups.xml folder path as a temporary PSDrive.
#>

    [CmdletBinding()]
    Param (
        [Parameter(Mandatory=$True, ValueFromPipeline=$True)]
        [String]
        $GroupsXMLPath,

        [Switch]
        $UsePSDrive
    )

    begin {
        if($UsePSDrive) {
            # if we're PSDrives, create a temporary mount point
            $Parts = $GroupsXMLPath.split('\')
            $FolderPath = $Parts[0..($Parts.length-2)] -join '\'
            $FilePath = $Parts[-1]
            $RandDrive = ("abcdefghijklmnopqrstuvwxyz".ToCharArray() | Get-Random -Count 7) -join ''

            Write-Verbose "Mounting path $GroupsXMLPath using a temp PSDrive at $RandDrive"

            try {
                $Null = New-PSDrive -Name $RandDrive -PSProvider FileSystem -Root $FolderPath  -ErrorAction Stop
            }
            catch {
                Write-Verbose "Error mounting path $GroupsXMLPath : $_"
                return $Null
            }

            # so we can cd/dir the new drive
            $TargetGroupsXMLPath = $RandDrive + ":\" + $FilePath
        }
        else {
            $TargetGroupsXMLPath = $GroupsXMLPath
        }
    }

    process {

        try {
            Write-Verbose "Attempting to parse Groups.xml: $TargetGroupsXMLPath"
            [XML]$GroupsXMLcontent = Get-Content $TargetGroupsXMLPath -ErrorAction Stop

            # process all group properties in the XML
            $GroupsXMLcontent | Select-Xml "//Groups" | Select-Object -ExpandProperty node | ForEach-Object {

                $Groupname = $_.Group.Properties.groupName

                # extract the localgroup sid for memberof
                $GroupSID = $_.Group.Properties.GroupSid
                if(-not $LocalSid) {
                    if($Groupname -match 'Administrators') {
                        $GroupSID = 'S-1-5-32-544'
                    }
                    elseif($Groupname -match 'Remote Desktop') {
                        $GroupSID = 'S-1-5-32-555'
                    }
                    elseif($Groupname -match 'Guests') {
                        $GroupSID = 'S-1-5-32-546'
                    }
                    else {
                        $GroupSID = Convert-NameToSid -ObjectName $Groupname | Select-Object -ExpandProperty SID
                    }
                }

                # extract out members added to this group
                $Members = $_.Group.Properties.members | Select-Object -ExpandProperty Member | Where-Object { $_.action -match 'ADD' } | ForEach-Object {
                    if($_.sid) { $_.sid }
                    else { $_.name }
                }

                if ($Members) {

                    # extract out any/all filters...I hate you GPP
                    if($_.Group.filters) {
                        $Filters = $_.Group.filters.GetEnumerator() | ForEach-Object {
                            New-Object -TypeName PSObject -Property @{'Type' = $_.LocalName;'Value' = $_.name}
                        }
                    }
                    else {
                        $Filters = $Null
                    }

                    if($Members -isnot [System.Array]) { $Members = @($Members) }

                    $GPOGroup = New-Object PSObject
                    $GPOGroup | Add-Member Noteproperty 'GPOPath' $TargetGroupsXMLPath
                    $GPOGroup | Add-Member Noteproperty 'Filters' $Filters
                    $GPOGroup | Add-Member Noteproperty 'GroupName' $GroupName
                    $GPOGroup | Add-Member Noteproperty 'GroupSID' $GroupSID
                    $GPOGroup | Add-Member Noteproperty 'GroupMemberOf' $Null
                    $GPOGroup | Add-Member Noteproperty 'GroupMembers' $Members
                    $GPOGroup
                }
            }
        }
        catch {
            # Write-Verbose "Error parsing $TargetGroupsXMLPath : $_"
        }
    }

    end {
        if($UsePSDrive -and $RandDrive) {
            Write-Verbose "Removing temp PSDrive $RandDrive"
            Get-PSDrive -Name $RandDrive -ErrorAction SilentlyContinue | Remove-PSDrive -Force
        }
    }
}


