import React from "react";

const LinuxAbuse = () => {
    return (
        <>
            <p>
                There are several ways to abuse the ability to read the GMSA
                password. The most straight forward abuse is possible when the
                GMSA is currently logged on to a computer, which is the intended
                behavior for a GMSA. If the GMSA is logged on to the computer
                account which is granted the ability to retrieve the GMSA's
                password, simply steal the token from the process running as the
                GMSA, or inject into that process.
            </p>
            <p>
                If the GMSA is not logged onto the computer, you may create a
                scheduled task or service set to run as the GMSA. The computer
                account will start the sheduled task or service as the GMSA, and
                then you may abuse the GMSA logon in the same fashion you would
                a standard user running processes on the machine (see the
                "HasSession" help modal for more details).
            </p>
            <p>
                Finally, it is possible to remotely retrieve the password for
                the GMSA and convert that password to its equivalent NT hash.
                <a href="https://github.com/micahvandeusen/gMSADumper">gMSADumper.py</a> can be used for that purpose.
            </p>

            <pre>
                <code>
                    {
                        "gMSADumper.py -u 'user' -p 'password' -d 'domain.local'"
                    }
                </code>
            </pre>

            <p>
                At this point you are ready to use the NT hash the same way you
                would with a regular user account. You can perform
                pass-the-hash, overpass-the-hash, or any other technique that
                takes an NT hash as an input.
            </p>
        </>
    );
};

export default LinuxAbuse;
