import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                The Virtual Machine Contributor role allows you to run SYSTEM
                commands on the VM
            </p>

            <p>Via PowerZure:</p>
            <a href='http://Invoke-AzureRunCommand'>Invoke-AzureRunCommand</a>
            <br />
            <a href='http://Invoke-AzureRunMSBuild'>Invoke-AzureRunMSBuild</a>
            <br />
            <a href='https://powerzure.readthedocs.io/en/latest/Functions/operational.html#invoke-azurerunprogram'>
                Invoke-AzureRunProgram
            </a>
        </>
    );
};

export default Abuse;
