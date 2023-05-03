import React from 'react';

const General = () => {
    return (
        <>
            <p>
                This edge is created during post-processing. It is created against 
                all AzureAD admin roles when a Service Principal has the following 
                MS Graph app role assignment:
            </p>

            <p>
                <ul>
                    <li>RoleManagement.ReadWrite.Directory</li>
                </ul>
            </p>

            <p>
                This privilege allows the Service Principal to promote itself or 
                any other principal to any AzureAD admin role, including Global 
                Administrator.
            </p>
        </>
    );
};

export default General;
