import React from 'react';

const General = () => {
    return (
        <>
            <p>
                This edge is created during post-processing. It is created against 
                all App Registrations and Service Principals within the same tenant 
                when a Service Principal has the following MS Graph app role:
            </p>

            <p>
                <ul>
                    <li>Application.ReadWrite.All</li>
                </ul>
            </p>

            <p>
                It is also created against all Azure Service Principals when a 
                Service Principal has the following MS Graph app role:
            </p>

            <p>
                <ul>
                    <li>ServicePrincipalEndpoint.ReadWrite.All</li>
                </ul>
            </p>
            

            <p>
                It is also created against all Azure security groups that are not 
                role eligible when a Service Principal has one of the following MS 
                Graph app roles:
            </p>

            <p>
                <ul>
                    <li>Directory.ReadWrite.All</li>
                    <li>Group.ReadWrite.All</li>
                </ul>
            </p>
            
            <p>
                Finally, it is created against all Azure security groups and all 
                Azure App Registrations when a Service Principal has the following 
                MS Graph app role:
            </p>

            <p>
                <ul>
                    <li>RoleManagement.ReadWrite.Directory</li>
                </ul>
            </p>
            

            <p>
                You will not see these privileges when auditing permissions against 
                any of the mentioned objects when you use Microsoft tooling, including 
                the Azure portal and the MS Graph API itself.
            </p>
        </>
    );
};

export default General;
