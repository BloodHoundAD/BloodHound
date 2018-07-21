import React, { Component } from "react";

import { Modal, Tabs, Tab } from "react-bootstrap";

export default class HelpModal extends Component {
    constructor() {
        super();

        this.state = {
            open: false,
            infoTabContent: "",
            abuseTabContent: "",
            opsecTabContent: "",
            referencesTabContent: ""
        };
    }

    closeModal() {
        this.setState({ open: false });
    }

    groupSpecialFormat(source){
        if (source.type === "Group"){
            return "The members of the {} {} have";
        }else{
            return "The {} {} has";
        }
    }

    createGeneralInfoTab(edge, source, target){
        let sourceType = source.type;
        let sourceName = source.label;
        let targetType = target.type;
        let targetName = target.label;
        let formatted;
        if (edge.label === "AdminTo"){
            let text = `${this.groupSpecialFormat(source)} admin rights to the computer {}.

            By default, administrators have several ways to perform remote code execution on Windows systems, including via RDP, WMI, WinRM, the Service Control Manager, and remote DCOM execution.
        
            Further, administrators have several options for impersonating other users logged onto the system, including plaintext password extraction, token impersonation, and injecting into processes running as another user.
        
            Finally, administrators can often disable host-based security controls that would otherwise prevent the aforementioned techniques.`;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "MemberOf"){
            let text = `The {} {} is a member of the group {}.
            
            Groups in active directory grant their members any privileges the group itself has. If a group has rights to another principal, users/computers in the group, as well as other groups inside the group inherit those permissions.`;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "HasSession"){
            let text = `The {} {} has a session on the computer {}.
            
            When a user authenticates to a computer, they often leave credentials exposed on the system, which can be retrieved through LSASS injection, token manipulation/theft, or injecting into a user's process.
            
            Any user that is an administrator to the system has the capability to retrieve the credential material from memory if it still exists.
            
            Note: A session does not guarantee credential material is present, only possible.`;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AllExtendedRights"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AddMember"){
            let text = `${this.groupSpecialFormat(source)} the ability to add arbitrary principals, including {}, to the group {}. Because of security group delegation, the members of a security group have the same privileges as that group. 
            
            By adding itself to the group, {} will gain the same privileges that {} already has.`;
            formatted = text.format(sourceType, sourceName, sourceType === "Group" ? "themselves" : "itself", targetName, sourceName, targetName);
        }else if (edge.label === "ForceChangePassword"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GenericAll"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GenericWrite"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "Owns"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "WriteDacl"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "WriteOwner"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "CanRDP"){
            let text = `${this.groupSpecialFormat(source)} the capability to create a Remote Desktop Connection with the computer {}.
            
            Remote Desktop access allows you to enter an interactive session with the target computer. If authenticating as a low privilege user, a privilege escalation may allow you to gain high privileges on the system.
            
            Note: This edge does not guarantee privileged execution.`;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "ExecuteDCOM"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AllowedToDelegate"){
            let text = `The {} {} has the constrained delegation privilege to the computer {}.
            
            The constrained delegation privilege allows a principal to authenticate to specific services (found in the msds-AllowedToDelegateTo LDAP property in the source node tab) on the target computer. This includes principals such as Domain Admins.
            
            An issue exists in constrained delegation that allows an attacker to modify the target service to any service of their choice.`;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GetChanges"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GetChangesAll"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }

        this.setState({infoTabContent: {__html: formatted}})
    }

    createAbuseInfoTab(edge, source, target){
        let sourceType = source.type;
        let sourceName = source.label;
        let targetType = target.type;
        let targetName = target.label;
        let formatted;
        if (edge.label === "AdminTo"){
            let text = `<h4>Lateral movement</h4>
            There are several ways to pivot to a Windows system. If using Cobalt Strike's beacon, check the help info for the commands "psexec", "psexec_psh", "wmi", and "winrm". With Empire, consider the modules for Invoke-PsExec, Invoke-DCOM, and Invoke-SMBExec. With Metasploit, consider the modules "blah/blah/blah", "blah/blah/blah", and "blah/blah/blah". Additionally, there are several manual methods for remotely executing code on the machine, including via RDP, with the service control binary and interaction with the remote machine's service control manager, and remotely instantiating DCOM objects. For more information about these lateral movement techniques, see the References tab.
            
            <h4>Gathering credentials</h4>
            The most well-known tool for gathering credentials from a Windows system is mimikatz. mimikatz is built into several agents and toolsets, including Cobalt Strike's beacon, Empire, and Meterpreter. While running in a high integrity process with SeDebugPrivilege, execute one or more of mimikatz's credential gathering techniques (e.g.: sekurlsa::wdigest, sekurlsa::logonpasswords, etc.), then parse or investigate the output to find clear-text credentials for other users logged onto the system.
            
            You may also gather credentials when a user types them or copies them to their clipboard! Several keylogging capabilities exist, several agents and toolsets have them built-in. For instance, you may use meterpreter's "keyscan_start" command to start keylogging a user, then "keyscan_dump" to return the captured keystrokes. Or, you may use PowerSploit's Invoke-ClipboardMonitor to periodically gather the contents of the user's clipboard.
            
            <h4>Token Impersonation</h4>
            You may run into a situation where a user is logged onto the system, but you can't gather that user's credential. This may be caused by a host-based security product, lsass protection, etc. In those circumstances, you may abuse Windows' token model in several ways. First, you may inject your agent into that user's process, which will give you a process token as that user, which you can then use to authenticate to other systems on the network. Or, you may steal a process token from a remote process and start a thread in your agent's process with that user's token. For more information about token abuses, see the References tab.
            
            <h4>Disabling host-based security controls</h4>
            Several host-based controls may affect your ability to execute certain techniques, such as credential theft, process injection, command line execution, and writing files to disk. Administrators can often disable these host-based controls in various ways, such as stopping or otherwise disabling a service, unloading a driver, or making registry key changes. For more information, see the References tab.`;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "MemberOf"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "HasSession"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AllExtendedRights"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AddMember"){
            let text = `There are at least two ways to execute this attack. The first and most obvious is by using the built-in net.exe binary in Windows (e.g.: net group "Domain Admins" dfm.a /add /domain). See the opsec considerations tab for why this may be a bad idea. The second, and highly recommended method, is by using the Add-DomainGroupMember function in PowerView. This function is superior to using the net.exe binary in several ways. For instance, you can supply alternate credentials, instead of needing to run a process as or logon as the user with the AddMember privilege. Additionally, you have much safer execution options than you do with spawning net.exe (see the opsec tab).

            To abuse this privilege with PowerView's Add-DomainGroupMember, first import PowerView into your agent session or into a PowerShell instance at the console. You may need to authenticate to the Domain Controller as {} if you are not running a process as that user. To do this in conjunction with Add-DomainGroupMember, first create a PSCredential object (these examples comes from the PowerView help documentation):
        
            $SecPassword = ConvertTo-SecureString 'Password123!' -AsPlainText -Force
            $Cred = New-Object System.Management.Automation.PSCredential('TESTLAB\dfm.a', $SecPassword)
        
            Then, use Add-DomainGroupMember, optionally specifying $Cred if you are not already running a process as {}:
        
            Add-DomainGroupMember -Identity 'Domain Admins' -Members 'harmj0y' -Credential $Cred
        
            Finally, verify that the user was successfully added to the group with PowerView's Get-DomainGroupMember:
        
            Get-DomainGroupMember -Identity 'Domain Admins'`;
            formatted = text
        }else if (edge.label === "ForceChangePassword"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GenericAll"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GenericWrite"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "Owns"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "WriteDacl"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "WriteOwner"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "CanRDP"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "ExecuteDCOM"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AllowedToDelegate"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GetChanges"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GetChangesAll"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }

        this.setState({abuseTabContent: {__html: formatted}})
    }

    createOpsecTab(edge, source, target){
        let sourceType = source.type;
        let sourceName = source.label;
        let targetType = target.type;
        let targetName = target.label;
        let formatted;
        if (edge.label === "AdminTo"){
            let text = `There are several forensic artifacts generated by the techniques described above. For instance, lateral movement via PsExec will generate 4697 events on the target system. If the target organization is collecting and analyzing those events, they may very easily detect lateral movement via PsExec. 
            
            Additionally, an EDR product may detect your attempt to inject into lsass and alert a SOC analyst. There are many more opsec considerations to keep in mind when abusing administrator privileges. For more information, see the References tab.`;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "MemberOf"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "HasSession"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AllExtendedRights"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AddMember"){
            let text = `Executing this abuse with the net binary will require command line execution. If your target organization has command line logging enabled, this is a detection opportunity for their analysts. 
            
            Regardless of what execution procedure you use, this action will generate a 4728 event on the domain controller that handled the request. This event may be centrally collected and analyzed by security analysts, especially for groups that are obviously very high privilege groups (i.e.: Domain Admins). Also be mindful that Powershell 5 introduced several key security features such as script block logging and AMSI that provide security analysts another detection opportunity. 
            
            You may be able to completely evade those features by downgrading to PowerShell v2.`;
            formatted = text
        }else if (edge.label === "ForceChangePassword"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GenericAll"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GenericWrite"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "Owns"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "WriteDacl"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "WriteOwner"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "CanRDP"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "ExecuteDCOM"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AllowedToDelegate"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GetChanges"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GetChangesAll"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }

        this.setState({opsecTabContent: {__html: formatted}})
    }

    createReferencesTab(edge, source, target){
        let sourceType = source.type;
        let sourceName = source.label;
        let targetType = target.type;
        let targetName = target.label;
        let formatted;
        if (edge.label === "AdminTo"){
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
            formatted = text
        }else if (edge.label === "MemberOf"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "HasSession"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AllExtendedRights"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AddMember"){
            let text = `<a href="https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/dev/Recon/PowerView.ps1</a>
            <a href="https://www.youtube.com/watch?v=z8thoG7gPd0">https://www.youtube.com/watch?v=z8thoG7gPd0</a>
            <a href="https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4728">https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4728</a>`;
            formatted = text
        }else if (edge.label === "ForceChangePassword"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GenericAll"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GenericWrite"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "Owns"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "WriteDacl"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "WriteOwner"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "CanRDP"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "ExecuteDCOM"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "AllowedToDelegate"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GetChanges"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }else if (edge.label === "GetChangesAll"){
            let text = ``;
            formatted = text.format(sourceType, sourceName, targetName);
        }

        this.setState({referencesTabContent: {__html: formatted}})
    }

    openModal(edge, source, target) {
        this.createGeneralInfoTab(edge, source, target);
        this.createAbuseInfoTab(edge, source, target);
        this.createOpsecTab(edge, source, target);
        this.createReferencesTab(edge, source, target);
        this.setState({ open: true, edgeType: edge.label });
    }

    componentDidMount() {
        emitter.on("displayHelp", this.openModal.bind(this));
    }

    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby="HelpHeader"
                className="help-modal-width"
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title id="HelpHeader">Help: {this.state.edgeType}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Tabs defaultActiveKey={1} id="help-tab-container" justified>
                        <Tab eventKey={1} title="Info" dangerouslySetInnerHTML={this.state.infoTabContent} />
                        <Tab eventKey={2} title="Abuse Info" dangerouslySetInnerHTML={this.state.abuseTabContent} />
                        <Tab eventKey={3} title="Opsec Considerations" dangerouslySetInnerHTML={this.state.opsecTabContent} />
                        <Tab eventKey={4} title="References" dangerouslySetInnerHTML={this.state.referencesTabContent} />
                    </Tabs>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={this.closeModal.bind(this)}
                    >
                        Close
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
