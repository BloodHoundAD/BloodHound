const References = () => {
    let text = `<h4>Gathering Credentials</h4>
            <a href="http://blog.gentilkiwi.com/mimikatz">http://blog.gentilkiwi.com/mimikatz</a>
            <a href="https://github.com/gentilkiwi/mimikatz">https://github.com/gentilkiwi/mimikatz</a>
            <a href="https://adsecurity.org/?page_id=1821">https://adsecurity.org/?page_id=1821</a>
            <a href="https://attack.mitre.org/wiki/Credential_Access">https://attack.mitre.org/wiki/Credential_Access</a>
            
            <h4>Token Impersonation</h4>
            <a href="https://labs.mwrinfosecurity.com/assets/BlogFiles/mwri-security-implications-of-windows-access-tokens-2008-04-14.pdf">https://labs.mwrinfosecurity.com/assets/BlogFiles/mwri-security-implications-of-windows-access-tokens-2008-04-14.pdf</>
            <a href="https://github.com/PowerShellMafia/PowerSploit/blob/master/Exfiltration/Invoke-TokenManipulation.ps1">https://github.com/PowerShellMafia/PowerSploit/blob/master/Exfiltration/Invoke-TokenManipulation.ps1</a>
            <a href="https://attack.mitre.org/wiki/Technique/T1134">https://attack.mitre.org/wiki/Technique/T1134</a>`;
    return { __html: text };
};

export default References;
