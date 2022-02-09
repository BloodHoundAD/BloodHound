const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `Use PowerShell or PowerZure to fetch the secret from the key vault
    
    Via PowerZure
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#get-azurekeyvaultcontent">Get-AzureKeyVaultContent</a>`;
    return { __html: text };
};

export default Abuse;
