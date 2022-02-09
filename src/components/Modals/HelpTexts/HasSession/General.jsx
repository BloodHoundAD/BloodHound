const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `The user ${targetName} has a session on the computer ${sourceName}.
            
    When a user authenticates to a computer, they often leave credentials exposed on the system, which can be retrieved through LSASS injection, token manipulation/theft, or injecting into a user's process.
    
    Any user that is an administrator to the system has the capability to retrieve the credential material from memory if it still exists.
    
    Note: A session does not guarantee credential material is present, only possible.`;
    return { __html: text };
};

export default General;
