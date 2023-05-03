import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                When you assign an AzureAD admin role to a principal
                using this privilege, the Azure Audit log will create
                an event called "Add member to role outside of PIM 
                (permanent)".
            </p>
        </>
    );
};

export default Opsec;
