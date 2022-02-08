const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `This indicates that the parent object contains the child object, such as a resource group containing a virtual machine, or a tenant “containing” a subscription.`;
    return { __html: text };
};

export default General;
