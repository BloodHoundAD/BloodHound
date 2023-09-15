import React from 'react';

const General = () => {
    return (
        <p>
            Azure resources like Virtual Machines, Logic Apps, and Automation Accounts
            can be assigned to either System- or User-Assigned Managed Identities.
            This assignment allows the Azure resource to authenticate to Azure services
            as the Managed Identity without needing to know the credential for that 
            Managed Identity. Managed Identities, whether System- or User-Assigned, are
            AzureAD Service Principals.
        </p>
    );
};

export default General;
