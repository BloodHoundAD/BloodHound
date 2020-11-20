const Opsec = () => {
    let text = `If the target computer is a workstation and a user is currently logged on, one of two things will happen. If the user you are abusing is the same user as the one logged on, you will effectively take over their session and kick the logged on user off, resulting in a message to the user. If the users are different, you will be prompted to kick the currently logged on user off the system and log on. If the target computer is a server, you will be able to initiate the connection without issue provided the user you are abusing is not currently logged in.
            
            Remote desktop will create Logon and Logoff events with the access type RemoteInteractive.`;
    return { __html: text };
};

export default Opsec;
