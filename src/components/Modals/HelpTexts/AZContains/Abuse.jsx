const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `There is no abuse necessary, but any roles scoped on a parent object will descend down to all child objects.`;
    return { __html: text };
};

export default Abuse;
