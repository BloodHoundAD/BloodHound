const References = () => {
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
    return { __html: text };
};

export default References;
