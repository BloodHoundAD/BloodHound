import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                Use PowerShell or PowerZure to fetch the certificate from the
                key vault
            </p>
            <p>Via PowerZure</p>
            <a href='https://powerzure.readthedocs.io/en/latest/Functions/operational.html#get-azurekeyvaultcontent'>
                Get-AzureKeyVaultContent
            </a>
            <br />
            <a href='https://powerzure.readthedocs.io/en/latest/Functions/operational.html#export-azurekeyvaultcontent'>
                Export-AzureKeyVaultcontent
            </a>
        </>
    );
};

export default Abuse;
