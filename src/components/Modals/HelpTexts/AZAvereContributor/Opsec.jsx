import React from 'react';

const Opsec = () => {
    return (
        <p>
            Because you&lsquo;ll be running a command as the SYSTEM user on the
            Virtual Machine, the same opsec considerations for running malicious
            commands on any system should be taken into account: command line
            logging, PowerShell script block logging, EDR, etc.
        </p>
    );
};

export default Opsec;
