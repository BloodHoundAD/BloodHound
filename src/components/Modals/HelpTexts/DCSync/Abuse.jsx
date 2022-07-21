const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `You may perform a dcsync attack to get the password hash of an arbitrary principal using mimikatz:
            
            <code>lsadump::dcsync /domain:testlab.local /user:Administrator</code>
            
            You can also perform the more complicated ExtraSids attack to hop domain trusts. For information on this see the blog post by harmj0y in the references tab.`;
    return { __html: text };
};

export default Abuse;
