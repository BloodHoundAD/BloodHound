import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                You can read secrets and alter access policies (grant yourself access to read secrets)
            </p>

            <p>Via PowerZure:</p>
            <a href='https://powerzure.readthedocs.io/en/latest/Functions/operational.html#get-azurekeyvaultcontent'>
                Get-AzureKeyVaultContent
            </a>
            <br />
            <a href='https://powerzure.readthedocs.io/en/latest/Functions/operational.html#export-azurekeyvaultcontent'>
                Export-AzureKeyVaultContent
            </a>
        </>
    );
};

export default Abuse;
