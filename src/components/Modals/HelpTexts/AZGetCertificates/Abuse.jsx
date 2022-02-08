const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `Use PowerShell or PowerZure to fetch the certificate from the key vault
    
    Via PowerZure
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#get-azurekeyvaultcontent">Get-AzureKeyVaultContent</a>
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#export-azurekeyvaultcontent">Export-AzureKeyVaultcontent</a>`;
    return { __html: text };
};

export default Abuse;
