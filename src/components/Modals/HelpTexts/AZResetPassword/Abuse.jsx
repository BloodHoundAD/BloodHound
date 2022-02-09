const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `Find the user in the Azure portal, then click “Reset Password”, or use PowerZure’s Set-AzureUserPassword cmdlet. If password write-back is enabled, this password will also be set for a synced on-prem user.`;
    return { __html: text };
};

export default Abuse;
