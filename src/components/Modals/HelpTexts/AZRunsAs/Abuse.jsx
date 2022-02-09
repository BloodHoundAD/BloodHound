const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `This edge should be taken into consideration when abusing control of an app. Apps authenticate with service principals to the tenant, so if you have control of an app, what you are abusing is that control plus the fact that the app runs as a privileged service principal`;
    return { __html: text };
};

export default Abuse;
