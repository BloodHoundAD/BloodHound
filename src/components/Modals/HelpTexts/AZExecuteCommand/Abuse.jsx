import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                First, have your PowerShell script ready to go and save it
                somewhere as a PS1 file. Take all the necessary operational
                security (opsec) and AMSI-bypass steps you want at this point,
                keeping in mind the script will run as the SYSTEM user unless
                you specify otherwise. Also keep in mind that the script will
                be written to disk, so take whatever AV bypass measures you need
                as well.
            </p>

            <p>
                Next, log into the Azure web portal as the user with the “Intune
                Administrator” role activated. After authenticating, access Endpoint
                Manager at https://endpoint.microsoft.com 
            </p>

            <p>
                Click on “Devices” on the left, which takes you, unsurprisingly, to
                the devices overview. Click on “Scripts” under the “Policy” section
                to go to the scripts management page. Click “Add,” then click “Windows
                10”
            </p>

            <p>
                This will bring you to the “Add Powershell Script” page. On this first
                page, you’ll enter a name for the script and a brief description. On the
                next page, click the folder and then select your PS1 from the common
                dialogue window. You’ve now got three options to configure, but can
                leave them all in the default “No” position. Most interestingly, keeping
                the first selection as “No” will cause the script to run as the SYSTEM user
            </p>

            <p>
                Click next, and you’ll see the page that lets you scope which systems and
                users this script will execute for. You can choose to assign the script to
                “All devices,” “All users,” or “All users and devices.” If you leave the
                “Assign to” dropdown at its default selection of “Selected groups,” you can
                scope the script to only execute on systems or for users that belong to
                certain security groups. The choice is yours: run the script on every
                possible system or constrain it to only run on certain systems by scoping it
                to existing security groups or by adding specific devices or users to new
                security groups.
            </p>

            <p>
                Click “Next” and you’ll see the review page which lets you see what you’re
                about to do. Click “Add” and Azure will begin registering the script.
            </p>

            <p>
                At this point, the script is now ready to run on your target systems. This
                process works similarly to Group Policy, in that the Intune agent running
                on each device periodically checks in (by default every hour) with
                Intune/Endpoint Manager to see if there is a PowerShell script for it to run,
                so you will need to wait up to an hour for your target system to actually pull
                the script down and run it.
            </p>
        </>
    );
};

export default Abuse;
