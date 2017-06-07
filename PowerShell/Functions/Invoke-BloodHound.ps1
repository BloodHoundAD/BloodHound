function Invoke-BloodHound {
<#
    .SYNOPSIS

        This function automates the collection of the data needed for BloodHound.

        Author: @harmj0y
        License: BSD 3-Clause
        Required Dependencies: None
        Optional Dependencies: None

    .DESCRIPTION

        This function collects the information needed to populate the BloodHound graph
        database. It offers a varity of targeting and collection options.
        By default, it will map all domain trusts, enumerate all groups and associated memberships,
        enumerate all computers on the domain and execute session/loggedon/local admin enumeration
        queries against each. Targeting options are modifiable with -CollectionMethod. The
        -SearchForest searches all domains in the forest instead of just the current domain.
        By default, the data is output to CSVs in the current folder location (old Export-BloodHoundCSV functionality).
        To modify this, use -CSVFolder. To export to a neo4j RESTful API interface, specify a
        -URI X and -UserPass "...".

    .PARAMETER ComputerName

        Array of one or more computers to enumerate.

    .PARAMETER ComputerADSpath

        The LDAP source to search through for computers, e.g. "LDAP://OU=secret,DC=testlab,DC=local".

    .PARAMETER UserADSpath

        The LDAP source to search through for users/groups, e.g. "LDAP://OU=secret,DC=testlab,DC=local".

    .PARAMETER Domain

        Domain to query for machines, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to bind to for queries.

    .PARAMETER CollectionMethod

        The method to collect data. 'Group', 'ComputerOnly', 'LocalGroup', 'GPOLocalGroup', 'Session', 'LoggedOn', 'Trusts, 'Stealth', or 'Default'.
        'Stealth' uses 'Group' collection, stealth user hunting ('Session' on certain servers), 'GPOLocalGroup' enumeration, and trust enumeration.
        'Default' uses 'Group' collection, regular user hunting with 'Session'/'LoggedOn', 'LocalGroup' enumeration, and 'Trusts' enumeration.
        'ComputerOnly' only enumerates computers, not groups/trusts, and executes local admin/session/loggedon on each.

    .PARAMETER SearchForest

        Switch. Search all domains in the forest for target users instead of just
        a single domain.

    .PARAMETER CSVFolder

        The CSV folder to use for output, defaults to the current folder location.

    .PARAMETER CSVPrefix

        A prefix for all CSV files.

    .PARAMETER URI

        The BloodHound neo4j URL location (http://host:port/).

    .PARAMETER UserPass

        The "user:password" for the BloodHound neo4j instance

   .PARAMETER GlobalCatalog

        The global catalog location to resolve user memberships from, form of GC://global.catalog.

    .PARAMETER SkipGCDeconfliction

        Switch. Skip global catalog enumeration for session deconfliction.

    .PARAMETER Threads

        The maximum concurrent threads to execute, default of 20.

    .PARAMETER Throttle

        The number of cypher queries to queue up for neo4j RESTful API ingestion.

    .EXAMPLE

        PS C:\> Invoke-BloodHound

        Executes default collection methods and exports the data to a CSVs in the current directory.

    .EXAMPLE

        PS C:\> Invoke-BloodHound -URI http://SERVER:7474/ -UserPass "user:pass"

        Executes default collection options and exports the data to a BloodHound neo4j RESTful API endpoint.

    .EXAMPLE

        PS C:\> Invoke-BloodHound -CollectionMethod stealth

        Executes stealth collection and exports the data to a CSVs in the current directory.
        This includes 'stealth' user hunting and GPO object correlation for local admin membership.
        This is significantly faster but the information is not as complete as the default options.

    .LINK

        http://neo4j.com/docs/stable/rest-api-batch-ops.html
        http://stackoverflow.com/questions/19839469/optimizing-high-volume-batch-inserts-into-neo4j-using-rest
#>

    [CmdletBinding(DefaultParameterSetName = 'CSVExport')]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [String[]]
        [ValidateNotNullOrEmpty()]
        $ComputerName,

        [String]
        $ComputerADSpath,

        [String]
        $UserADSpath,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        [ValidateSet('Group', 'ACLs', 'ComputerOnly', 'LocalGroup', 'GPOLocalGroup', 'Session', 'LoggedOn', 'Stealth', 'Trusts', 'Default')]
        $CollectionMethod = 'Default',

        [Switch]
        $SearchForest,

        [Parameter(ParameterSetName = 'CSVExport')]
        [ValidateScript({ Test-Path -Path $_ })]
        [String]
        $CSVFolder = $(Get-Location),

        [Parameter(ParameterSetName = 'CSVExport')]
        [ValidateNotNullOrEmpty()]
        [String]
        $CSVPrefix,

        [Parameter(ParameterSetName = 'RESTAPI', Mandatory = $True)]
        [URI]
        $URI,

        [Parameter(ParameterSetName = 'RESTAPI', Mandatory = $True)]
        [String]
        [ValidatePattern('.*:.*')]
        $UserPass,

        [ValidatePattern('^GC://')]
        [String]
        $GlobalCatalog,

        [Switch]
        $SkipGCDeconfliction,

        [ValidateRange(1,50)]
        [Int]
        $Threads = 20,

        [ValidateRange(1,5000)]
        [Int]
        $Throttle = 1000
    )

    BEGIN {

        Switch ($CollectionMethod) {
            'Group'         { $UseGroup = $True; $SkipComputerEnumeration = $True; $SkipGCDeconfliction2 = $True }
            'ACLs'          { $UseGroup = $False; $SkipComputerEnumeration = $True; $SkipGCDeconfliction2 = $True; $UseACLs = $True }
            'ComputerOnly'  { $UseGroup = $False; $UseLocalGroup = $True; $UseSession = $True; $UseLoggedOn = $True; $SkipGCDeconfliction2 = $False }
            'LocalGroup'    { $UseLocalGroup = $True; $SkipGCDeconfliction2 = $True }
            'GPOLocalGroup' { $UseGPOGroup = $True; $SkipComputerEnumeration = $True; $SkipGCDeconfliction2 = $True }
            'Session'       { $UseSession = $True; $SkipGCDeconfliction2 = $False }
            'LoggedOn'      { $UseLoggedOn = $True; $SkipGCDeconfliction2 = $True }
            'Trusts'        { $UseDomainTrusts = $True; $SkipComputerEnumeration = $True; $SkipGCDeconfliction2 = $True }
            'Stealth'       {
                $UseGroup = $True
                $UseGPOGroup = $True
                $UseSession = $True
                $UseDomainTrusts = $True
                $SkipGCDeconfliction2 = $False
            }
            'Default'       {
                $UseGroup = $True
                $UseLocalGroup = $True
                $UseSession = $True
                $UseLoggedOn = $False
                $UseDomainTrusts = $True
                $SkipGCDeconfliction2 = $False
            }
        }

        if($SkipGCDeconfliction) {
            $SkipGCDeconfliction2 = $True
        }

        $GCPath = ([ADSI]'LDAP://RootDSE').dnshostname
        $GCADSPath = "GC://$GCPath"

        # the ActiveDirectoryRights regex we're using for output
        #   https://msdn.microsoft.com/en-us/library/system.directoryservices.activedirectoryrights(v=vs.110).aspx
        # $ACLRightsRegex = [regex] 'GenericAll|GenericWrite|WriteProperty|WriteOwner|WriteDacl|ExtendedRight'
        $ACLGeneralRightsRegex = [regex] 'GenericAll|GenericWrite|WriteOwner|WriteDacl'

        if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
            try {
                $OutputFolder = $CSVFolder | Resolve-Path -ErrorAction Stop | Select-Object -ExpandProperty Path
            }
            catch {
                throw "Error: $_"
            }

            if($CSVPrefix) {
                $CSVExportPrefix = "$($CSVPrefix)_"
            }
            else {
                $CSVExportPrefix = ''
            }

            Write-Output "Writing output to CSVs in: $OutputFolder\$CSVExportPrefix"

            if($UseSession -or $UseLoggedon) {
                $SessionPath = "$OutputFolder\$($CSVExportPrefix)user_sessions.csv"
                $Exists = [System.IO.File]::Exists($SessionPath)
                $SessionFileStream = New-Object IO.FileStream($SessionPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $SessionWriter = New-Object System.IO.StreamWriter($SessionFileStream)
                $SessionWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $SessionWriter.WriteLine('"ComputerName","UserName","Weight"')
                }
            }

            if($UseGroup) {
                $GroupPath = "$OutputFolder\$($CSVExportPrefix)group_memberships.csv"
                $Exists = [System.IO.File]::Exists($GroupPath)
                $GroupFileStream = New-Object IO.FileStream($GroupPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $GroupWriter = New-Object System.IO.StreamWriter($GroupFileStream)
                $GroupWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $GroupWriter.WriteLine('"GroupName","AccountName","AccountType"')
                }
            }

            if($UseACLs) {
                $ACLPath = "$OutputFolder\$($CSVExportPrefix)acls.csv"
                $Exists = [System.IO.File]::Exists($ACLPath)
                $ACLFileStream = New-Object IO.FileStream($ACLPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $ACLWriter = New-Object System.IO.StreamWriter($ACLFileStream)
                $ACLWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $ACLWriter.WriteLine('"ObjectName","ObjectType","PrincipalName","PrincipalType","ActiveDirectoryRights","ACEType","AccessControlType","IsInherited"')
                }
            }

            if($UseLocalGroup -or $UseGPOGroup) {
                $LocalAdminPath = "$OutputFolder\$($CSVExportPrefix)local_admins.csv"
                $Exists = [System.IO.File]::Exists($LocalAdminPath)
                $LocalAdminFileStream = New-Object IO.FileStream($LocalAdminPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $LocalAdminWriter = New-Object System.IO.StreamWriter($LocalAdminFileStream)
                $LocalAdminWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $LocalAdminWriter.WriteLine('"ComputerName","AccountName","AccountType"')
                }
            }

            if($UseDomainTrusts) {
                $TrustsPath = "$OutputFolder\$($CSVExportPrefix)trusts.csv"
                $Exists = [System.IO.File]::Exists($TrustsPath)
                $TrustsFileStream = New-Object IO.FileStream($TrustsPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $TrustWriter = New-Object System.IO.StreamWriter($TrustsFileStream)
                $TrustWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $TrustWriter.WriteLine('"SourceDomain","TargetDomain","TrustDirection","TrustType","Transitive"')
                }
            }
        }

        else {
            # otherwise we're doing ingestion straight to the neo4j RESTful API interface
            $WebClient = New-Object System.Net.WebClient

            $Base64UserPass = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($UserPass))

            # add the auth headers
            $WebClient.Headers.Add('Accept','application/json; charset=UTF-8')
            $WebClient.Headers.Add('Authorization',"Basic $Base64UserPass")

            # check auth to the BloodHound neo4j server
            try {
                $Null = $WebClient.DownloadString($URI.AbsoluteUri + 'user/neo4j')
                Write-Verbose "Connection established with neo4j ingestion interface at $($URI.AbsoluteUri)"
                $Authorized = $True
            }
            catch {
                $Authorized = $False
                throw "Error connecting to Neo4j rest REST server at '$($URI.AbsoluteUri)'"
            }

            Write-Output "Sending output to neo4j RESTful API interface at: $($URI.AbsoluteUri)"

            $Null = [Reflection.Assembly]::LoadWithPartialName("System.Web.Extensions")

            # from http://stackoverflow.com/questions/28077854/powershell-2-0-convertfrom-json-and-convertto-json-implementation
            function ConvertTo-Json20([object] $Item){
                $ps_js = New-Object System.Web.Script.Serialization.javascriptSerializer
                return $ps_js.Serialize($item)
            }

            $Authorized = $True
            $Statements = New-Object System.Collections.ArrayList

            # add in the necessary constraints on nodes
            $Null = $Statements.Add( @{ "statement"="CREATE CONSTRAINT ON (c:User) ASSERT c.UserName IS UNIQUE" } )
            $Null = $Statements.Add( @{ "statement"="CREATE CONSTRAINT ON (c:Computer) ASSERT c.ComputerName IS UNIQUE"} )
            $Null = $Statements.Add( @{ "statement"="CREATE CONSTRAINT ON (c:Group) ASSERT c.GroupName IS UNIQUE" } )
            $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
            $JsonRequest = ConvertTo-Json20 $Json
            $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
            $Statements.Clear()
        }

        $UserDomainMappings = @{}
        if(-not $SkipGCDeconfliction2) {
            # if we're doing session enumeration, create a {user : @(domain,..)} from a global catalog
            #   in order to do user domain deconfliction for sessions
            if($PSBoundParameters['GlobalCatalog']) {
                $UserDomainMappings = Get-GlobalCatalogUserMapping -GlobalCatalog $GlobalCatalog
            }
            else {
                $UserDomainMappings = Get-GlobalCatalogUserMapping
            }
        }
        $DomainShortnameMappings = @{}

        if($Domain) {
            $TargetDomains = @($Domain)
        }
        elseif($SearchForest) {
            # get ALL the domains in the forest to search
            $TargetDomains = Get-NetForestDomain | Select-Object -ExpandProperty Name
        }
        else {
            # use the local domain
            $TargetDomains = @( (Get-NetDomain).Name )
        }

        if($UseGroup -and $TargetDomains) {
            $Title = (Get-Culture).TextInfo
            ForEach ($TargetDomain in $TargetDomains) {
                # enumerate all groups and all members of each group
                Write-Verbose "Enumerating group memberships for domain $TargetDomain"

                # in-line updated hashtable with group DN->SamAccountName mappings
                $GroupDNMappings = @{}
                $PrimaryGroups = @{}
                $DomainSID = Get-DomainSID -Domain $TargetDomain -DomainController $DomainController

                $ObjectSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController -ADSPath $UserADSpath
                # only return results that have 'memberof' set
                $ObjectSearcher.Filter = '(memberof=*)'
                # only return specific properties in the results
                $Null = $ObjectSearcher.PropertiesToLoad.AddRange(('samaccountname', 'distinguishedname', 'cn', 'dnshostname', 'samaccounttype', 'primarygroupid', 'memberof'))
                $Counter = 0
                $ObjectSearcher.FindAll() | ForEach-Object {
                    if($Counter % 1000 -eq 0) {
                        Write-Verbose "Group object counter: $Counter"
                        if($GroupWriter) {
                            $GroupWriter.Flush()
                        }
                        [GC]::Collect()
                    }
                    $Properties = $_.Properties

                    $MemberDN = $Null
                    $MemberDomain = $Null
                    try {
                        $MemberDN = $Properties['distinguishedname'][0]

                        if (($MemberDN -match 'ForeignSecurityPrincipals') -and ($MemberDN -match 'S-1-5-21')) {
                            try {
                                if(-not $MemberSID) {
                                    $MemberSID = $Properties.cn[0]
                                }
                                $MemberSimpleName = Convert-SidToName -SID $MemberSID | Convert-ADName -InputType 'NT4' -OutputType 'Canonical'
                                if($MemberSimpleName) {
                                    $MemberDomain = $MemberSimpleName.Split('/')[0]
                                }
                                else {
                                    Write-Verbose "Error converting $MemberDN"
                                }
                            }
                            catch {
                                Write-Verbose "Error converting $MemberDN"
                            }
                        }
                        else {
                            # extract the FQDN from the Distinguished Name
                            $MemberDomain = $MemberDN.subString($MemberDN.IndexOf("DC=")) -replace 'DC=','' -replace ',','.'
                        }
                    }
                    catch {}

                    if (@('268435456','268435457','536870912','536870913') -contains $Properties['samaccounttype']) {
                        $ObjectType = 'group'
                        if($Properties['samaccountname']) {
                            $MemberName = $Properties['samaccountname'][0]
                        }
                        else {
                            # external trust users have a SID, so convert it
                            try {
                                $MemberName = Convert-SidToName $Properties['cn'][0]
                            }
                            catch {
                                # if there's a problem contacting the domain to resolve the SID
                                $MemberName = $Properties['cn'][0]
                            }
                        }
                        if ($MemberName -Match "\\") {
                            # if the membername itself contains a backslash, get the trailing section
                            #   TODO: later preserve this once BloodHound can properly display these characters
                            $AccountName = $MemberName.split('\')[1] + '@' + $MemberDomain
                        }
                        else {
                            $AccountName = "$MemberName@$MemberDomain"
                        }
                    }
                    elseif (@('805306369') -contains $Properties['samaccounttype']) {
                        $ObjectType = 'computer'
                        if ($Properties['dnshostname']) {
                            $AccountName = $Properties['dnshostname'][0]
                        }
                    }
                    elseif (@('805306368') -contains $Properties['samaccounttype']) {
                        $ObjectType = 'user'
                        if($Properties['samaccountname']) {
                            $MemberName = $Properties['samaccountname'][0]
                        }
                        else {
                            # external trust users have a SID, so convert it
                            try {
                                $MemberName = Convert-SidToName $Properties['cn'][0]
                            }
                            catch {
                                # if there's a problem contacting the domain to resolve the SID
                                $MemberName = $Properties['cn'][0]
                            }
                        }
                        if ($MemberName -Match "\\") {
                            # if the membername itself contains a backslash, get the trailing section
                            #   TODO: later preserve this once BloodHound can properly display these characters
                            $AccountName = $MemberName.split('\')[1] + '@' + $MemberDomain
                        }
                        else {
                            $AccountName = "$MemberName@$MemberDomain"
                        }
                    }
                    else {
                        Write-Verbose "Unknown account type for object $($Properties['distinguishedname']) : $($Properties['samaccounttype'])"
                    }

                    if($AccountName -and (-not $AccountName.StartsWith('@'))) {

                        # Write-Verbose "AccountName: $AccountName"
                        $MemberPrimaryGroupName = $Null
                        try {
                            if($AccountName -match $TargetDomain) {
                                # also retrieve the primary group name for this object, if it exists
                                if($Properties['primarygroupid'] -and $Properties['primarygroupid'][0] -and ($Properties['primarygroupid'][0] -ne '')) {
                                    $PrimaryGroupSID = "$DomainSID-$($Properties['primarygroupid'][0])"
                                    # Write-Verbose "PrimaryGroupSID: $PrimaryGroupSID"
                                    if($PrimaryGroups[$PrimaryGroupSID]) {
                                        $PrimaryGroupName = $PrimaryGroups[$PrimaryGroupSID]
                                    }
                                    else {
                                        $RawName = Convert-SidToName -SID $PrimaryGroupSID
                                        if ($RawName -notmatch '^S-1-.*') {
                                            $PrimaryGroupName = $RawName.split('\')[-1]
                                            $PrimaryGroups[$PrimaryGroupSID] = $PrimaryGroupName
                                        }
                                    }
                                    if ($PrimaryGroupName) {
                                        $MemberPrimaryGroupName = "$PrimaryGroupName@$TargetDomain"
                                    }
                                }
                                else { }
                            }
                        }
                        catch { }

                        if($MemberPrimaryGroupName) {
                            # Write-Verbose "MemberPrimaryGroupName: $MemberPrimaryGroupName"
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $GroupWriter.WriteLine("`"$MemberPrimaryGroupName`",`"$AccountName`",`"$ObjectType`"")
                            }
                            else {
                                $ObjectTypeCap = $Title.ToTitleCase($ObjectType)
                                $Null = $Statements.Add( @{ "statement"="MERGE ($($ObjectType)1:$ObjectTypeCap { name: UPPER('$AccountName') }) MERGE (group2:Group { name: UPPER('$MemberPrimaryGroupName') }) MERGE ($($ObjectType)1)-[:MemberOf]->(group2)" } )
                            }
                        }

                        # iterate through each membership for this object
                        ForEach($GroupDN in $_.properties['memberof']) {
                            $GroupDomain = $GroupDN.subString($GroupDN.IndexOf('DC=')) -replace 'DC=','' -replace ',','.'

                            if($GroupDNMappings[$GroupDN]) {
                                $GroupName = $GroupDNMappings[$GroupDN]
                            }
                            else {
                                $GroupName = Convert-ADName -ObjectName $GroupDN
                                if($GroupName) {
                                    $GroupName = $GroupName.Split('\')[-1]
                                }
                                else {
                                    $GroupName = $GroupDN.SubString(0, $GroupDN.IndexOf(',')).Split('=')[-1]
                                }
                                $GroupDNMappings[$GroupDN] = $GroupName
                            }

                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $GroupWriter.WriteLine("`"$GroupName@$GroupDomain`",`"$AccountName`",`"$ObjectType`"")
                            }
                            else {
                                # otherwise we're exporting to the neo4j RESTful API
                                $ObjectTypeCap = $Title.ToTitleCase($ObjectType)

                                $Null = $Statements.Add( @{ "statement"="MERGE ($($ObjectType)1:$ObjectTypeCap { name: UPPER('$AccountName') }) MERGE (group2:Group { name: UPPER('$GroupName@$GroupDomain') }) MERGE ($($ObjectType)1)-[:MemberOf]->(group2)" } )

                                if ($Statements.Count -ge $Throttle) {
                                    $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
                                    $JsonRequest = ConvertTo-Json20 $Json
                                    $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
                                    $Statements.Clear()
                                }
                            }
                        }
                        $Counter += 1
                    }
                }
                $ObjectSearcher.Dispose()

                if ($PSCmdlet.ParameterSetName -eq 'RESTAPI') {
                    $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
                    $JsonRequest = ConvertTo-Json20 $Json
                    $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
                    $Statements.Clear()
                }
                Write-Verbose "Done with group enumeration for domain $TargetDomain"
            }
            [GC]::Collect()
        }

        if($UseACLs -and $TargetDomains) {

            # $PrincipalMapping format -> @{ PrincipalSID : @(PrincipalSimpleName, PrincipalObjectClass) }
            $PrincipalMapping = @{}
            $Counter = 0

            # #CommonSidMapping[SID] = @(name, objectClass)
            $CommonSidMapping = @{
                'S-1-0'         = @('Null Authority', 'USER')
                'S-1-0-0'       = @('Nobody', 'USER')
                'S-1-1'         = @('World Authority', 'USER')
                'S-1-1-0'       = @('Everyone', 'GROUP')
                'S-1-2'         = @('Local Authority', 'USER')
                'S-1-2-0'       = @('Local', 'GROUP')
                'S-1-2-1'       = @('Console Logon', 'GROUP')
                'S-1-3'         = @('Creator Authority', 'USER')
                'S-1-3-0'       = @('Creator Owner', 'USER')
                'S-1-3-1'       = @('Creator Group', 'GROUP')
                'S-1-3-2'       = @('Creator Owner Server', 'COMPUTER')
                'S-1-3-3'       = @('Creator Group Server', 'COMPUTER')
                'S-1-3-4'       = @('Owner Rights', 'GROUP')
                'S-1-4'         = @('Non-unique Authority', 'USER')
                'S-1-5'         = @('NT Authority', 'USER')
                'S-1-5-1'       = @('Dialup', 'GROUP')
                'S-1-5-2'       = @('Network', 'GROUP')
                'S-1-5-3'       = @('Batch', 'GROUP')
                'S-1-5-4'       = @('Interactive', 'GROUP')
                'S-1-5-6'       = @('Service', 'GROUP')
                'S-1-5-7'       = @('Anonymous', 'GROUP')
                'S-1-5-8'       = @('Proxy', 'GROUP')
                'S-1-5-9'       = @('Enterprise Domain Controllers', 'GROUP')
                'S-1-5-10'      = @('Principal Self', 'USER')
                'S-1-5-11'      = @('Authenticated Users', 'GROUP')
                'S-1-5-12'      = @('Restricted Code', 'GROUP')
                'S-1-5-13'      = @('Terminal Server Users', 'GROUP')
                'S-1-5-14'      = @('Remote Interactive Logon', 'GROUP')
                'S-1-5-15'      = @('This Organization ', 'GROUP')
                'S-1-5-17'      = @('This Organization ', 'GROUP')
                'S-1-5-18'      = @('Local System', 'USER')
                'S-1-5-19'      = @('NT Authority', 'USER')
                'S-1-5-20'      = @('NT Authority', 'USER')
                'S-1-5-80-0'    = @('All Services ', 'GROUP')
                'S-1-5-32-544'  = @('Administrators', 'GROUP')
                'S-1-5-32-545'  = @('Users', 'GROUP')
                'S-1-5-32-546'  = @('Guests', 'GROUP')
                'S-1-5-32-547'  = @('Power Users', 'GROUP')
                'S-1-5-32-548'  = @('Account Operators', 'GROUP')
                'S-1-5-32-549'  = @('Server Operators', 'GROUP')
                'S-1-5-32-550'  = @('Print Operators', 'GROUP')
                'S-1-5-32-551'  = @('Backup Operators', 'GROUP')
                'S-1-5-32-552'  = @('Replicators', 'GROUP')
                'S-1-5-32-554'  = @('Pre-Windows 2000 Compatible Access', 'GROUP')
                'S-1-5-32-555'  = @('Remote Desktop Users', 'GROUP')
                'S-1-5-32-556'  = @('Network Configuration Operators', 'GROUP')
                'S-1-5-32-557'  = @('Incoming Forest Trust Builders', 'GROUP')
                'S-1-5-32-558'  = @('Performance Monitor Users', 'GROUP')
                'S-1-5-32-559'  = @('Performance Log Users', 'GROUP')
                'S-1-5-32-560'  = @('Windows Authorization Access Group', 'GROUP')
                'S-1-5-32-561'  = @('Terminal Server License Servers', 'GROUP')
                'S-1-5-32-562'  = @('Distributed COM Users', 'GROUP')
                'S-1-5-32-569'  = @('Cryptographic Operators', 'GROUP')
                'S-1-5-32-573'  = @('Event Log Readers', 'GROUP')
                'S-1-5-32-574'  = @('Certificate Service DCOM Access', 'GROUP')
                'S-1-5-32-575'  = @('RDS Remote Access Servers', 'GROUP')
                'S-1-5-32-576'  = @('RDS Endpoint Servers', 'GROUP')
                'S-1-5-32-577'  = @('RDS Management Servers', 'GROUP')
                'S-1-5-32-578'  = @('Hyper-V Administrators', 'GROUP')
                'S-1-5-32-579'  = @('Access Control Assistance Operators', 'GROUP')
                'S-1-5-32-580'  = @('Access Control Assistance Operators', 'GROUP')
            }

            ForEach ($TargetDomain in $TargetDomains) {
                # enumerate all reachable user/group/computer objects and their associated ACLs
                Write-Verbose "Enumerating ACLs for objects in domain: $TargetDomain"

                $ObjectSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController -ADSPath $UserADSpath
                $ObjectSearcher.SecurityMasks = [System.DirectoryServices.SecurityMasks]::Dacl

                # only enumerate user and group objects (for now)
                #   805306368 -> user
                #   805306369 -> computer
                #   268435456|268435457|536870912|536870913 -> groups
                $ObjectSearcher.Filter = '(|(samAccountType=805306368)(samAccountType=805306369)(samAccountType=268435456)(samAccountType=268435457)(samAccountType=536870912)(samAccountType=536870913))'
                $ObjectSearcher.PropertiesToLoad.AddRange(('distinguishedName','samaccountname','dnshostname','objectclass','objectsid','name', 'ntsecuritydescriptor'))

                $ObjectSearcher.FindAll() | ForEach-Object {
                    $Object = $_.Properties
                    if($Object -and $Object.distinguishedname -and $Object.distinguishedname[0] -and $Object.objectsid -and $Object.objectsid[0]) {

                        $ObjectSid = (New-Object System.Security.Principal.SecurityIdentifier($Object.objectsid[0],0)).Value

                        try {
                            # parse the 'ntsecuritydescriptor' field returned
                            New-Object -TypeName Security.AccessControl.RawSecurityDescriptor -ArgumentList $Object['ntsecuritydescriptor'][0], 0 | Select-Object -Expand DiscretionaryAcl | ForEach-Object {
                                $Counter += 1
                                if($Counter % 10000 -eq 0) {
                                    Write-Verbose "ACE counter: $Counter"
                                    if($ACLWriter) {
                                        $ACLWriter.Flush()
                                    }
                                    [GC]::Collect()
                                }

                                $RawActiveDirectoryRights = ([Enum]::ToObject([System.DirectoryServices.ActiveDirectoryRights], $_.AccessMask))

                                # check for the following rights:
                                #   GenericAll                      -   generic fully control of an object
                                #   GenericWrite                    -   write to any object properties
                                #   WriteDacl                       -   modify the permissions of the object
                                #   WriteOwner                      -   modify the owner of an object
                                #   User-Force-Change-Password      -   extended attribute (00299570-246d-11d0-a768-00aa006e0529)
                                #   WriteProperty/Self-Membership   -   modify group membership (bf9679c0-0de6-11d0-a285-00aa003049e2)
                                #   WriteProperty/Script-Path       -   modify a user's script-path (bf9679a8-0de6-11d0-a285-00aa003049e2)
                                if (
                                        ( ($RawActiveDirectoryRights -match 'GenericAll|GenericWrite') -and (-not $_.ObjectAceType -or $_.ObjectAceType -eq '00000000-0000-0000-0000-000000000000') ) -or 
                                        ($RawActiveDirectoryRights -match 'WriteDacl|WriteOwner') -or 
                                        ( ($RawActiveDirectoryRights -match 'ExtendedRight') -and (-not $_.ObjectAceType -or $_.ObjectAceType -eq '00000000-0000-0000-0000-000000000000') ) -or 
                                        (($_.ObjectAceType -eq '00299570-246d-11d0-a768-00aa006e0529') -and ($RawActiveDirectoryRights -match 'ExtendedRight')) -or
                                        (($_.ObjectAceType -eq 'bf9679c0-0de6-11d0-a285-00aa003049e2') -and ($RawActiveDirectoryRights -match 'WriteProperty')) -or
                                        (($_.ObjectAceType -eq 'bf9679a8-0de6-11d0-a285-00aa003049e2') -and ($RawActiveDirectoryRights -match 'WriteProperty'))
                                    ) {
                                    
                                    $PrincipalSid = $_.SecurityIdentifier.ToString()
                                    $PrincipalSimpleName, $PrincipalObjectClass, $ACEType = $Null

                                    # only grab the AD right names we care about
                                    #   'GenericAll|GenericWrite|WriteOwner|WriteDacl'
                                    $ActiveDirectoryRights = $ACLGeneralRightsRegex.Matches($RawActiveDirectoryRights) | Select-Object -ExpandProperty Value
                                    if (-not $ActiveDirectoryRights) {
                                        if ($RawActiveDirectoryRights -match 'ExtendedRight') {
                                            $ActiveDirectoryRights = 'ExtendedRight'
                                        }
                                        else {
                                            $ActiveDirectoryRights = 'WriteProperty'
                                        }

                                        # decode the ACE types here
                                        $ACEType = Switch ($_.ObjectAceType) {
                                            '00299570-246d-11d0-a768-00aa006e0529' {'User-Force-Change-Password'}
                                            'bf9679c0-0de6-11d0-a285-00aa003049e2' {'Member'}
                                            'bf9679a8-0de6-11d0-a285-00aa003049e2' {'Script-Path'}
                                            Default {'All'}
                                        }
                                    }

                                    if ($PrincipalMapping[$PrincipalSid]) {
                                        # Write-Verbose "$PrincipalSid in cache!"
                                        # $PrincipalMappings format -> @{ SID : @(PrincipalSimpleName, PrincipalObjectClass) }
                                        $PrincipalSimpleName, $PrincipalObjectClass = $PrincipalMapping[$PrincipalSid]
                                    }
                                    elseif ($CommonSidMapping[$PrincipalSid]) {
                                        # Write-Verbose "$PrincipalSid in common sids!"
                                        $PrincipalName, $PrincipalObjectClass = $CommonSidMapping[$PrincipalSid]
                                        $PrincipalSimpleName = "$PrincipalName@$TargetDomain"
                                        $PrincipalMapping[$PrincipalSid] = $PrincipalSimpleName, $PrincipalObjectClass
                                    }
                                    else {
                                        # Write-Verbose "$PrincipalSid NOT in cache!"
                                        # first try querying the target domain for this SID
                                        $SIDSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController
                                        $SIDSearcher.PropertiesToLoad.AddRange(('samaccountname','distinguishedname','dnshostname','objectclass'))
                                        $SIDSearcher.Filter = "(objectsid=$PrincipalSid)"
                                        $PrincipalObject = $SIDSearcher.FindOne()

                                        if ((-not $PrincipalObject) -and ((-not $DomainController) -or (-not $DomainController.StartsWith('GC:')))) {
                                            # if the object didn't resolve from the current domain, attempt to query the global catalog
                                            $GCSearcher = Get-DomainSearcher -ADSpath $GCADSPath
                                            $GCSearcher.PropertiesToLoad.AddRange(('samaccountname','distinguishedname','dnshostname','objectclass'))
                                            $GCSearcher.Filter = "(objectsid=$PrincipalSid)"
                                            $PrincipalObject = $GCSearcher.FindOne()
                                        }

                                        if ($PrincipalObject) {
                                            if ($PrincipalObject.Properties.objectclass.contains('computer')) {
                                                $PrincipalObjectClass = 'COMPUTER'
                                                $PrincipalSimpleName = $PrincipalObject.Properties.dnshostname[0]
                                            }
                                            else {
                                                $PrincipalSamAccountName = $PrincipalObject.Properties.samaccountname[0]
                                                $PrincipalDN = $PrincipalObject.Properties.distinguishedname[0]
                                                $PrincipalDomain = $PrincipalDN.SubString($PrincipalDN.IndexOf('DC=')) -replace 'DC=','' -replace ',','.'
                                                $PrincipalSimpleName = "$PrincipalSamAccountName@$PrincipalDomain"

                                                if ($PrincipalObject.Properties.objectclass.contains('group')) {
                                                    $PrincipalObjectClass = 'GROUP'
                                                }
                                                elseif ($PrincipalObject.Properties.objectclass.contains('user')) {
                                                    $PrincipalObjectClass = 'USER'
                                                }
                                                else {
                                                    $PrincipalObjectClass = 'OTHER'
                                                }
                                            }
                                        }
                                        else {
                                            Write-Verbose "SID not resolved: $PrincipalSid"
                                        }

                                        $PrincipalMapping[$PrincipalSid] = $PrincipalSimpleName, $PrincipalObjectClass
                                    }

                                    if ($PrincipalSimpleName -and $PrincipalObjectClass) {
                                        $ObjectName, $ObjectADType = $Null

                                        if ($Object.objectclass.contains('computer')) {
                                            $ObjectADType = 'COMPUTER'
                                            if ($Object.dnshostname) {
                                                $ObjectName = $Object.dnshostname[0]
                                            }
                                        }
                                        else {
                                            if($Object.samaccountname) {
                                                $ObjectSamAccountName = $Object.samaccountname[0]
                                            }
                                            else {
                                                $ObjectSamAccountName = $Object.name[0]
                                            }
                                            $DN = $Object.distinguishedname[0]
                                            $ObjectDomain = $DN.SubString($DN.IndexOf('DC=')) -replace 'DC=','' -replace ',','.'
                                            $ObjectName = "$ObjectSamAccountName@$ObjectDomain"

                                            if ($Object.objectclass.contains('group')) {
                                                $ObjectADType = 'GROUP'
                                            }
                                            elseif ($Object.objectclass.contains('user')) {
                                                $ObjectADType = 'USER'
                                            }
                                            else {
                                                $ObjectADType = 'OTHER'
                                            }
                                        }

                                        if ($ObjectName -and $ObjectADType) {
                                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                                $ACLWriter.WriteLine("`"$ObjectName`",`"$ObjectADType`",`"$PrincipalSimpleName`",`"$PrincipalObjectClass`",`"$ActiveDirectoryRights`",`"$ACEType`",`"$($_.AceQualifier)`",`"$($_.IsInherited)`"")
                                            }
                                            else {
                                                Write-Warning 'TODO: implement neo4j RESTful API ingestion for ACLs!'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        catch {
                            Write-Verbose "ACL ingestion error: $_"
                        }
                    }
                }
            }
        }

        if($UseDomainTrusts -and $TargetDomains) {
            Write-Verbose "Mapping domain trusts"
            Invoke-MapDomainTrust | ForEach-Object {
                if($_.SourceDomain) {
                    $SourceDomain = $_.SourceDomain
                }
                else {
                    $SourceDomain = $_.SourceName
                }
                if($_.TargetDomain) {
                    $TargetDomain = $_.TargetDomain
                }
                else {
                    $TargetDomain = $_.TargetName
                }

                if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                    $TrustWriter.WriteLine("`"$SourceDomain`",`"$TargetDomain`",`"$($_.TrustDirection)`",`"$($_.TrustType)`",`"$True`"")
                }
                else {
                    $Null = $Statements.Add( @{ "statement"="MERGE (SourceDomain:Domain { name: UPPER('$SourceDomain') }) MERGE (TargetDomain:Domain { name: UPPER('$TargetDomain') })" } )

                    $TrustType = $_.TrustType
                    $Transitive = $True

                    Switch ($_.TrustDirection) {
                        'Inbound' {
                             $Null = $Statements.Add( @{ "statement"="MERGE (SourceDomain)-[:TrustedBy{ TrustType: UPPER('$TrustType'), Transitive: UPPER('$Transitive')}]->(TargetDomain)" } )
                        }
                        'Outbound' {
                             $Null = $Statements.Add( @{ "statement"="MERGE (TargetDomain)-[:TrustedBy{ TrustType: UPPER('$TrustType'), Transitive: UPPER('$Transitive')}]->(SourceDomain)" } )
                        }
                        'Bidirectional' {
                             $Null = $Statements.Add( @{ "statement"="MERGE (TargetDomain)-[:TrustedBy{ TrustType: UPPER('$TrustType'), Transitive: UPPER('$Transitive')}]->(SourceDomain) MERGE (SourceDomain)-[:TrustedBy{ TrustType: UPPER('$TrustType'), Transitive: UPPER('$Transitive')}]->(TargetDomain)" } )
                        }
                    }

                }
            }
            if ($PSCmdlet.ParameterSetName -eq 'RESTAPI') {
                $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
                $JsonRequest = ConvertTo-Json20 $Json
                $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
                $Statements.Clear()
            }
            Write-Verbose "Done mapping domain trusts"
        }

        if($UseGPOGroup -and $TargetDomains) {
            ForEach ($TargetDomain in $TargetDomains) {

                Write-Verbose "Enumerating GPO local group memberships for domain $TargetDomain"
                Find-GPOLocation -Domain $TargetDomain -DomainController $DomainController | ForEach-Object {
                    $AccountName = "$($_.ObjectName)@$($_.ObjectDomain)"
                    ForEach($Computer in $_.ComputerName) {
                        if($_.IsGroup) {
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $LocalAdminWriter.WriteLine("`"$Computer`",`"$AccountName`",`"group`"")
                            }
                            else {
                                $Null = $Statements.Add( @{"statement"="MERGE (group:Group { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$Computer') }) MERGE (group)-[:AdminTo]->(computer)" } )
                            }
                        }
                        else {
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $LocalAdminWriter.WriteLine("`"$Computer`",`"$AccountName`",`"user`"")
                            }
                            else {
                                $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$Computer') }) MERGE (user)-[:AdminTo]->(computer)" } )
                            }
                        }
                    }
                }
                Write-Verbose "Done enumerating GPO local group memberships for domain $TargetDomain"
            }
            Write-Verbose "Done enumerating GPO local group"
            # TODO: cypher query to add 'domain admins' to every found machine
        }

        # get the current user so we can ignore it in the results
        $CurrentUser = ([Environment]::UserName).toLower()

        # script block that enumerates a server
        $HostEnumBlock = {
            Param($ComputerName, $CurrentUser2, $UseLocalGroup2, $UseSession2, $UseLoggedon2, $DomainSID2)

            ForEach ($TargetComputer in $ComputerName) {
                $Up = Test-Connection -Count 1 -Quiet -ComputerName $TargetComputer
                if($Up) {
                    if($UseLocalGroup2) {
                        # grab the users for the local admins on this server
                        $Results = Get-NetLocalGroup -ComputerName $TargetComputer -API -IsDomain -DomainSID $DomainSID2
                        if($Results) {
                            $Results
                        }
                        else {
                            Get-NetLocalGroup -ComputerName $TargetComputer -IsDomain -DomainSID $DomainSID2
                        }
                    }

                    $IPAddress = @(Get-IPAddress -ComputerName $TargetComputer)[0].IPAddress

                    if($UseSession2) {
                        ForEach ($Session in $(Get-NetSession -ComputerName $TargetComputer)) {
                            $UserName = $Session.sesi10_username
                            $CName = $Session.sesi10_cname

                            if($CName -and $CName.StartsWith("\\")) {
                                $CName = $CName.TrimStart("\")
                            }

                            # make sure we have a result
                            if (($UserName) -and ($UserName.trim() -ne '') -and ($UserName -notmatch '\$') -and ($UserName -notmatch $CurrentUser2)) {
                                # Try to resolve the DNS hostname of $Cname
                                try {
                                    $CNameDNSName = [System.Net.Dns]::GetHostEntry($CName) | Select-Object -ExpandProperty HostName
                                }
                                catch {
                                    $CNameDNSName = $CName
                                }
                                @{
                                    'UserDomain' = $Null
                                    'UserName' = $UserName
                                    'ComputerName' = $TargetComputer
                                    'IPAddress' = $IPAddress
                                    'SessionFrom' = $CName
                                    'SessionFromName' = $CNameDNSName
                                    'LocalAdmin' = $Null
                                    'Type' = 'UserSession'
                                }
                            }
                        }
                    }

                    if($UseLoggedon2) {
                        ForEach ($User in $(Get-NetLoggedon -ComputerName $TargetComputer)) {
                            $UserName = $User.wkui1_username
                            $UserDomain = $User.wkui1_logon_domain

                            # ignore local account logons
                            if($TargetComputer -notmatch "^$UserDomain") {
                                if (($UserName) -and ($UserName.trim() -ne '') -and ($UserName -notmatch '\$')) {
                                    @{
                                        'UserDomain' = $UserDomain
                                        'UserName' = $UserName
                                        'ComputerName' = $TargetComputer
                                        'IPAddress' = $IPAddress
                                        'SessionFrom' = $Null
                                        'SessionFromName' = $Null
                                        'LocalAdmin' = $Null
                                        'Type' = 'UserSession'
                                    }
                                }
                            }
                        }

                        ForEach ($User in $(Get-LoggedOnLocal -ComputerName $TargetComputer)) {
                            $UserName = $User.UserName
                            $UserDomain = $User.UserDomain

                            # ignore local account logons ?
                            if($TargetComputer -notmatch "^$UserDomain") {
                                @{
                                    'UserDomain' = $UserDomain
                                    'UserName' = $UserName
                                    'ComputerName' = $TargetComputer
                                    'IPAddress' = $IPAddress
                                    'SessionFrom' = $Null
                                    'SessionFromName' = $Null
                                    'LocalAdmin' = $Null
                                    'Type' = 'UserSession'
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    PROCESS {
        if ($TargetDomains -and (-not $SkipComputerEnumeration)) {
            
            if($Statements) {
                $Statements.Clear()
            }
            [Array]$TargetComputers = @()

            ForEach ($TargetDomain in $TargetDomains) {

                $DomainSID = Get-DomainSid -Domain $TargetDomain

                $ScriptParameters = @{
                    'CurrentUser2' = $CurrentUser
                    'UseLocalGroup2' = $UseLocalGroup
                    'UseSession2' = $UseSession
                    'UseLoggedon2' = $UseLoggedon
                    'DomainSID2' = $DomainSID
                }

                if($CollectionMethod -eq 'Stealth') {
                    Write-Verbose "Executing stealth computer enumeration of domain $TargetDomain"

                    Write-Verbose "Querying domain $TargetDomain for File Servers"
                    $TargetComputers += Get-NetFileServer -Domain $TargetDomain -DomainController $DomainController

                    Write-Verbose "Querying domain $TargetDomain for DFS Servers"
                    $TargetComputers += ForEach($DFSServer in $(Get-DFSshare -Domain $TargetDomain -DomainController $DomainController)) {
                        $DFSServer.RemoteServerName
                    }

                    Write-Verbose "Querying domain $TargetDomain for Domain Controllers"
                    $TargetComputers += ForEach($DomainController in $(Get-NetDomainController -LDAP -DomainController $DomainController -Domain $TargetDomain)) {
                        $DomainController.dnshostname
                    }

                    $TargetComputers = $TargetComputers | Where-Object {$_ -and ($_.Trim() -ne '')} | Sort-Object -Unique
                }
                else {
                    if($ComputerName) {
                        Write-Verbose "Using specified -ComputerName target set"
                        if($ComputerName -isnot [System.Array]) {$ComputerName = @($ComputerName)}
                        $TargetComputers = $ComputerName
                    }
                    else {
                        Write-Verbose "Enumerating all machines in domain $TargetDomain"
                        $ComputerSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController -ADSPath $ComputerADSpath
                        $ComputerSearcher.filter = '(sAMAccountType=805306369)'
                        $Null = $ComputerSearcher.PropertiesToLoad.Add('dnshostname')
                        $TargetComputers = $ComputerSearcher.FindAll() | ForEach-Object {$_.Properties.dnshostname}
                        $ComputerSearcher.Dispose()
                    }
                }
                $TargetComputers = $TargetComputers | Where-Object { $_ }

                New-ThreadedFunction -ComputerName $TargetComputers -ScriptBlock $HostEnumBlock -ScriptParameters $ScriptParameters -Threads $Threads | ForEach-Object {
                    if($_['Type'] -eq 'UserSession') {
                        if($_['SessionFromName']) {
                            try {
                                $SessionFromName = $_['SessionFromName']
                                $UserName = $_['UserName'].ToUpper()
                                $ComputerDomain = $_['SessionFromName'].SubString($_['SessionFromName'].IndexOf('.')+1).ToUpper()

                                if($UserDomainMappings) {
                                    $UserDomain = $Null
                                    if($UserDomainMappings[$UserName]) {
                                        if($UserDomainMappings[$UserName].Count -eq 1) {
                                            $UserDomain = $UserDomainMappings[$UserName]
                                            $LoggedOnUser = "$UserName@$UserDomain"
                                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                                $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"1`"")
                                            }
                                            else {
                                                $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '1'}]->(user)" } )
                                            }
                                        }
                                        else {
                                            $ComputerDomain = $_['SessionFromName'].SubString($_['SessionFromName'].IndexOf('.')+1).ToUpper()

                                            $UserDomainMappings[$UserName] | ForEach-Object {
                                                # for multiple GC results, set a weight of 1 for the same domain as the target computer
                                                if($_ -eq $ComputerDomain) {
                                                    $UserDomain = $_
                                                    $LoggedOnUser = "$UserName@$UserDomain"
                                                    if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                                        $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"1`"")
                                                    }
                                                    else {
                                                        $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '1'}]->(user)" } )
                                                    }
                                                }
                                                # and set a weight of 2 for all other users in additional domains
                                                else {
                                                    $UserDomain = $_
                                                    $LoggedOnUser = "$UserName@$UserDomain"
                                                    if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                                        $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"2`"")
                                                    }
                                                    else {
                                                        $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '2'}]->(user)" } )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        # no user object in the GC with this username, so set the domain to "UNKNOWN"
                                        $LoggedOnUser = "$UserName@UNKNOWN"
                                        if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                            $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"2`"")
                                        }
                                        else {
                                            $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '2'}]->(user)" } )
                                        }
                                    }
                                }
                                else {
                                    # if not using GC mappings, set the weight to 2
                                    $LoggedOnUser = "$UserName@$ComputerDomain"
                                    if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                        $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"2`"")
                                    }
                                    else {
                                        $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '2'}]->(user)"} )
                                    }
                                }
                            }
                            catch {
                                Write-Warning "Error extracting domain from $SessionFromName"
                            }
                        }
                        elseif($_['SessionFrom']) {
                            $SessionFromName = $_['SessionFrom']
                            $LoggedOnUser = "$($_['UserName'])@UNKNOWN"
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"2`"")
                            }
                            else {
                                $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER(`"$LoggedOnUser`") }) MERGE (computer:Computer { name: UPPER(`"$SessionFromName`") }) MERGE (computer)-[:HasSession {Weight: '2'}]->(user)"} )
                            }
                        }
                        else {
                            # assume Get-NetLoggedOn result
                            $UserDomain = $_['UserDomain']
                            $UserName = $_['UserName']
                            try {
                                if($DomainShortnameMappings[$UserDomain]) {
                                    # in case the short name mapping is 'cached'
                                    $AccountName = "$UserName@$($DomainShortnameMappings[$UserDomain])"
                                }
                                else {
                                    $MemberSimpleName = "$UserDomain\$UserName" | Convert-ADName -InputType 'NT4' -OutputType 'Canonical'

                                    if($MemberSimpleName) {
                                        $MemberDomain = $MemberSimpleName.Split('/')[0]
                                        $AccountName = "$UserName@$MemberDomain"
                                        $DomainShortnameMappings[$UserDomain] = $MemberDomain
                                    }
                                    else {
                                        $AccountName = "$UserName@UNKNOWN"
                                    }
                                }

                                $SessionFromName = $_['ComputerName']

                                if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                    $SessionWriter.WriteLine("`"$SessionFromName`",`"$AccountName`",`"1`"")
                                }
                                else {
                                    $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '1'}]->(user)" } )
                                }
                            }
                            catch {
                                Write-Verbose "Error converting $UserDomain\$UserName : $_"
                            }
                        }
                    }
                    elseif($_['Type'] -eq 'LocalUser') {
                        $Parts = $_['AccountName'].split('\')
                        $UserDomain = $Parts[0]
                        $UserName = $Parts[-1]

                        if($DomainShortnameMappings[$UserDomain]) {
                            # in case the short name mapping is 'cached'
                            $AccountName = "$UserName@$($DomainShortnameMappings[$UserDomain])"
                        }
                        else {
                            $MemberSimpleName = "$UserDomain\$UserName" | Convert-ADName -InputType 'NT4' -OutputType 'Canonical'

                            if($MemberSimpleName) {
                                $MemberDomain = $MemberSimpleName.Split('/')[0]
                                $AccountName = "$UserName@$MemberDomain"
                                $DomainShortnameMappings[$UserDomain] = $MemberDomain
                            }
                            else {
                                $AccountName = "$UserName@UNKNOWN"
                            }
                        }

                        $ComputerName = $_['ComputerName']
                        if($_['IsGroup']) {
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $LocalAdminWriter.WriteLine("`"$ComputerName`",`"$AccountName`",`"group`"")
                            }
                            else {
                                $Null = $Statements.Add( @{ "statement"="MERGE (group:Group { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$ComputerName') }) MERGE (group)-[:AdminTo]->(computer)" } )
                            }
                        }
                        else {
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $LocalAdminWriter.WriteLine("`"$ComputerName`",`"$AccountName`",`"user`"")
                            }
                            else {
                                $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$ComputerName') }) MERGE (user)-[:AdminTo]->(computer)" } )
                            }
                        }
                    }

                    if (($PSCmdlet.ParameterSetName -eq 'RESTAPI') -and ($Statements.Count -ge $Throttle)) {
                        $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
                        $JsonRequest = ConvertTo-Json20 $Json
                        $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
                        $Statements.Clear()
                        [GC]::Collect()
                    }
                }
            }
        }
    }

    END {

        if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
            if($SessionWriter) {
                $SessionWriter.Dispose()
                $SessionFileStream.Dispose()
            }
            if($GroupWriter) {
                $GroupWriter.Dispose()
                $GroupFileStream.Dispose()
            }
            if($ACLWriter) {
                $ACLWriter.Dispose()
                $ACLFileStream.Dispose()
            }
            if($LocalAdminWriter) {
                $LocalAdminWriter.Dispose()
                $LocalAdminFileStream.Dispose()
            }
            if($TrustWriter) {
                $TrustWriter.Dispose()
                $TrustsFileStream.Dispose()
            }

            Write-Output "Done writing output to CSVs in: $OutputFolder\$CSVExportPrefix"
        }
        else {
           $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
           $JsonRequest = ConvertTo-Json20 $Json
           $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
           $Statements.Clear()
           Write-Output "Done sending output to neo4j RESTful API interface at: $($URI.AbsoluteUri)"
        }

        [GC]::Collect()
    }
}


########################################################
#
# Expose the Win32API functions and datastructures below
# using PSReflect.
# Warning: Once these are executed, they are baked in
# and can't be changed while the script is running!
#
########################################################

$Mod = New-InMemoryModule -ModuleName Win32

# all of the Win32 API functions we need
$FunctionDefinitions = @(
    (func netapi32 NetWkstaUserEnum ([Int]) @([String], [Int], [IntPtr].MakeByRefType(), [Int], [Int32].MakeByRefType(), [Int32].MakeByRefType(), [Int32].MakeByRefType())),
    (func netapi32 NetSessionEnum ([Int]) @([String], [String], [String], [Int], [IntPtr].MakeByRefType(), [Int], [Int32].MakeByRefType(), [Int32].MakeByRefType(), [Int32].MakeByRefType())),
    (func netapi32 NetLocalGroupGetMembers ([Int]) @([String], [String], [Int], [IntPtr].MakeByRefType(), [Int], [Int32].MakeByRefType(), [Int32].MakeByRefType(), [Int32].MakeByRefType())),
    (func netapi32 DsEnumerateDomainTrusts ([Int]) @([String], [UInt32], [IntPtr].MakeByRefType(), [IntPtr].MakeByRefType())),
    (func netapi32 NetApiBufferFree ([Int]) @([IntPtr])),
    (func advapi32 ConvertSidToStringSid ([Int]) @([IntPtr], [String].MakeByRefType()) -SetLastError)
)


# the NetWkstaUserEnum result structure
$WKSTA_USER_INFO_1 = struct $Mod WKSTA_USER_INFO_1 @{
    wkui1_username = field 0 String -MarshalAs @('LPWStr')
    wkui1_logon_domain = field 1 String -MarshalAs @('LPWStr')
    wkui1_oth_domains = field 2 String -MarshalAs @('LPWStr')
    wkui1_logon_server = field 3 String -MarshalAs @('LPWStr')
}

# the NetSessionEnum result structure
$SESSION_INFO_10 = struct $Mod SESSION_INFO_10 @{
    sesi10_cname = field 0 String -MarshalAs @('LPWStr')
    sesi10_username = field 1 String -MarshalAs @('LPWStr')
    sesi10_time = field 2 UInt32
    sesi10_idle_time = field 3 UInt32
}

# enum used by $LOCALGROUP_MEMBERS_INFO_2 below
$SID_NAME_USE = psenum $Mod SID_NAME_USE UInt16 @{
    SidTypeUser             = 1
    SidTypeGroup            = 2
    SidTypeDomain           = 3
    SidTypeAlias            = 4
    SidTypeWellKnownGroup   = 5
    SidTypeDeletedAccount   = 6
    SidTypeInvalid          = 7
    SidTypeUnknown          = 8
    SidTypeComputer         = 9
}

# the NetLocalGroupGetMembers result structure
$LOCALGROUP_MEMBERS_INFO_2 = struct $Mod LOCALGROUP_MEMBERS_INFO_2 @{
    lgrmi2_sid = field 0 IntPtr
    lgrmi2_sidusage = field 1 $SID_NAME_USE
    lgrmi2_domainandname = field 2 String -MarshalAs @('LPWStr')
}

# enums used in DS_DOMAIN_TRUSTS
$DsDomainFlag = psenum $Mod DsDomain.Flags UInt32 @{
    IN_FOREST       = 1
    DIRECT_OUTBOUND = 2
    TREE_ROOT       = 4
    PRIMARY         = 8
    NATIVE_MODE     = 16
    DIRECT_INBOUND  = 32
} -Bitfield
$DsDomainTrustType = psenum $Mod DsDomain.TrustType UInt32 @{
    DOWNLEVEL   = 1
    UPLEVEL     = 2
    MIT         = 3
    DCE         = 4
}
$DsDomainTrustAttributes = psenum $Mod DsDomain.TrustAttributes UInt32 @{
    NON_TRANSITIVE      = 1
    UPLEVEL_ONLY        = 2
    FILTER_SIDS         = 4
    FOREST_TRANSITIVE   = 8
    CROSS_ORGANIZATION  = 16
    WITHIN_FOREST       = 32
    TREAT_AS_EXTERNAL   = 64
}

# the DsEnumerateDomainTrusts result structure
$DS_DOMAIN_TRUSTS = struct $Mod DS_DOMAIN_TRUSTS @{
    NetbiosDomainName = field 0 String -MarshalAs @('LPWStr')
    DnsDomainName = field 1 String -MarshalAs @('LPWStr')
    Flags = field 2 $DsDomainFlag
    ParentIndex = field 3 UInt32
    TrustType = field 4 $DsDomainTrustType
    TrustAttributes = field 5 $DsDomainTrustAttributes
    DomainSid = field 6 IntPtr
    DomainGuid = field 7 Guid
}

$Types = $FunctionDefinitions | Add-Win32Type -Module $Mod -Namespace 'Win32'
$Netapi32 = $Types['netapi32']
$Advapi32 = $Types['advapi32']

Set-Alias Get-BloodHoundData Invoke-BloodHound
