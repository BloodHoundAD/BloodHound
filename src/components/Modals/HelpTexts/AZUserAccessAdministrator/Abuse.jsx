const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `This role can be used to grant yourself or another principal any privilege you want against Automation Accounts, VMs, Key Vaults, and Resource Groups. Use the Azure portal to add a new, abusable role assignment against the target object for yourself.`;
    return { __html: text };
};

export default Abuse;
