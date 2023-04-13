import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                When you assign an app role to a Service Principal, the Azure 
                Audit logs will create an event called "Add app role assignment 
                to service principal". This event describes who made the change, 
                what the target service principal was, and what app role assignment 
                was granted.
            </p>
        </>
    );
};

export default Opsec;
