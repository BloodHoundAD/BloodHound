const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `This depends on what the target object is:
    <strong>Key Vault</strong>: You can read secrets and alter access policies (grant yourself access to read secrets)
    <strong>Automation Account</strong>: You can create a new runbook that runs as the Automation Account, and edit existing runbooks. Runbooks can be used to authenticate as the Automation Account and abuse privileges held by the Automation Account. If the Automation Account is using a ‘RunAs’ account, you can gather the certificate used to login and impersonate that account.
    <strong>Virtual Machine</strong>: Run SYSTEM commands on the VM
    <strong>Resource Group</strong>: NOT abusable, and not collected by AzureHound

    Via PowerZure:
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#get-azurekeyvaultcontent">Get-AzureKeyVaultContent</a>
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#export-azurekeyvaultcontent">Export-AzureKeyVaultContent</a>
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#get-azurerunascertificate">Get-AzureRunAsCertificate</a>
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#get-azurerunbookcontent">Get-AzureRunbookContent</a>
    <a href="http://Invoke-AzureRunCommand">Invoke-AzureRunCommand</a>
    <a href="http://Invoke-AzureRunMSBuild">Invoke-AzureRunMSBuild</a>
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#invoke-azurerunprogram">Invoke-AzureRunProgram</a>
    `;
    return { __html: text };
};

export default Abuse;
