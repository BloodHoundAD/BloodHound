const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `The Virtual Machine Contributor role allows you to run SYSTEM commands on the VM
    <strong>Resource Group</strong>: NOT abusable, and not collected by AzureHound

    Via PowerZure:
    <a href="http://Invoke-AzureRunCommand">Invoke-AzureRunCommand</a>
    <a href="http://Invoke-AzureRunMSBuild">Invoke-AzureRunMSBuild</a>
    <a href="https://powerzure.readthedocs.io/en/latest/Functions/operational.html#invoke-azurerunprogram">Invoke-AzureRunProgram</a>
    `;
    return { __html: text };
};

export default Abuse;
