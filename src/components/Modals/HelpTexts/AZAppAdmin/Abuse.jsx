const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `Create a new credential for the app, then authenticate to the tenant as the app’s service principal, then abuse whatever privilege it is that the service principal has.`;
    return { __html: text };
};

export default Abuse;
