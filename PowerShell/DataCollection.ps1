# These queries require PowerView: https://github.com/PowerShellEmpire/PowerTools/tree/master/PowerView

#Map Users to Computers with Find-GPOLocation, then build a CSV with 'Username','ComputerName'
Get-NetUser | %{$UserName = $_.samaccountname; $ComputerList = Find-GPOLocation -UserName $_.samaccountname | Select -ExpandProperty Computers; $ComputerObjectList = $Computers | Select-Object @(Name='User';Expression={$UserName}},@{Name='Computer';Expression={$_}}; $ComputerObjectList | Export-CSV LocalAdmins.csv -Append -NoType}

# Get sessions from computers, try to resolve IPs to FQDNs, and map logged onto users, then build CSV
Get-NetComputer | %{Get-NetSession -ComputerName $_ | %{$UserName = $_.sesi10_username; $Cname = $_.sesi10_cname.trim('\'); If($Cname -match '[a-zA-Z]'){Try{$HostName = [System.Net.Dns]::GetHostByName($Cname).Hostname}Catch{$HostName = $Cname}}; Else{Try{$HostName = [System.Net.Dns]::Resolve($Cname).HostName}Catch{$Hostname = $Cname}}; New-Object -TypeName PSCustomObject -Property @{User = $Username; Computer = $Hostname} | Export-Csv UserLogons.csv -Append -NoType}}

# Get local admin usernames and groups for each system, output to CSV
Get-NetComputer -Ping | %{Get-NetLocalGroup -ComputerName $_ | ?{$_.IsDomain} | Select-Object Server,AccountName,IsGroup | Export-Csv LocalAdmins.csv -NoType -Append}

# Get AD group memberships
Get-NetGroup | %{$GroupName = $_; $GroupName = $GroupName -Replace '\(','\28'; $GroupName = $GroupName -Replace '\)','\29'; Get-NetGroupMember -GroupName $GroupName | ?{$_.MemberName -NotLike '*$'} | Select GroupName,MemberName,IsGroup | Export-Csv DomainGroups.csv -NoType -Append}
