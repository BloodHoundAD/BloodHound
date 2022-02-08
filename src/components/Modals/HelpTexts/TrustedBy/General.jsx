const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `The domain ${sourceName} is trusted by the domain ${targetName}.
    
    This edge is informational and does not indicate any attacks, only that a trust exists.`;
    return { __html: text };
};

export default General;
