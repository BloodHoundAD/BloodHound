import React from 'react';

const General = () => {
    return (
        <>
            <p>
                This edge is created during post-processing. It is created against 
                all Azure App Registrations and Service Principals when a Service 
                Principal has one of the following MS Graph app roles:
            </p>

            <p>
                <ul>
                    <li>Application.ReadWrite.All</li>
                    <li>RoleManagement.ReadWrite.Directory</li>
                </ul>
            </p>

            <p>
                You will not see this privilege when using just the Azure portal 
                or any other Microsoft tooling. If you audit the roles and administrators 
                affecting any particular Azure App or Service Principal, you will not see 
                that the Service Principal can add secrets to the object, but it 
                indeed can because of the parallel access management system used 
                by MS Graph.
            </p>
        </>
    );
};

export default General;
