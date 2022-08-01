import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                When the Intune agent pulls down and executes PowerShell
                scripts, a number of artifacts are created on the endpoint —
                some permanent and some ephemeral.
            </p>

            <p>
                Two files are created on the endpoint when a PowerShell script
                is executed in the following locations: - C:\Program files
                (x86)\Microsoft Intune Management Extension\Policies\Scripts -
                C:\Program files (x86)\Microsoft Intune Management
                Extension\Policies\Results
            </p>

            <p>
                The file under the “Scripts” folder will be a local copy of the
                PS1 stored in Azure, and the file under the “Results” folder
                will be the output of the PS1; however, both of these files are
                automatically deleted as soon as the script finishes running.
            </p>

            <p>
                There are also permanent artifacts left over (assuming the
                attacker doesn’t tamper with them). A full copy of the contents
                of the PS1 can be found in this log file: -
                C:\ProgramData\Microsoft\IntuneManagementExtension\Logs\_IntuneManagementExtension.txt
            </p>
        </>
    );
};

export default Opsec;
