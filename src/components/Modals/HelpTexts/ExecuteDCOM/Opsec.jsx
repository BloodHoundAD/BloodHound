const Opsec = () => {
    let text = `The artifacts generated when using DCOM vary depending on the specific COM object used.

            DCOM is built on top of the TCP/IP RPC protocol (TCP ports 135 + high ephemeral ports) and may leverage several different RPC interface UUIDs(outlined here). In order to use DCOM, one must be authenticated.  Consequently, logon events and authentication-specific logs(Kerberos, NTLM, etc.) will be generated when using DCOM.  
            
            Processes may be spawned as the user authenticating to the remote system, as a user already logged into the system, or may take advantage of an already spawned process.  
            
            Many DCOM servers spawn under the process “svchost.exe -k DcomLaunch” and typically have a command line containing the string “ -Embedding” or are executing inside of the DLL hosting process “DllHost.exe /Processid:{<AppId>}“ (where AppId is the AppId the COM object is registered to use).  Certain COM services are implemented as service executables; consequently, service-related event logs may be generated.`;
    return { __html: text };
};

export default Opsec;
