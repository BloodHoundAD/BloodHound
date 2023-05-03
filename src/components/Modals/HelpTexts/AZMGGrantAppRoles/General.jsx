import React from 'react';

const General = () => {
    return (
        <>
            <p>
                This edge is created during post-processing. It is created against 
                AzureAD tenant objects when a Service Principal has one of the following 
                MS Graph app role assignments:
            </p>

            <p>
                <ul>
                    <li>AppRoleAssignment.ReadWrite.All</li>
                    <li>RoleManagement.ReadWrite.Directory</li>
                </ul>
            </p>
        </>
    );
};

export default General;
