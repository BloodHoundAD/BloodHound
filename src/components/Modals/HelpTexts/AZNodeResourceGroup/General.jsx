import React from 'react';

const General = () => {
    return (
        <>
        
        <p>
            This edge is created to link Azure Kubernetes Service 
            Managed Clusters to the Virtual Machine Scale Sets they
            use to execute commands on.
        </p>

        <p>
            The system-assigned identity for the AKS Cluster will 
            have the Contributor role against the target Resource Group 
            and its child Virtual Machine Scale Sets.
        </p>

        </>
    );
};

export default General;
