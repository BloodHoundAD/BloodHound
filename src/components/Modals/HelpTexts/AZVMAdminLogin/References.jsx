const References = () => {
    let text = `<a href="https://attack.mitre.org/tactics/TA0008/">ATT&CK T0008: Lateral Movement</a>
    <a href="https://attack.mitre.org/techniques/T1021/">ATT&CK T1021: Remote Services</a>
    <a href="https://docs.microsoft.com/en-us/azure/active-directory/devices/howto-vm-sign-in-azure-ad-windows">Login to Windows virtual machine in Azure using Azure Active Directory authentication</a>`;
    return { __html: text };
};

export default References;
