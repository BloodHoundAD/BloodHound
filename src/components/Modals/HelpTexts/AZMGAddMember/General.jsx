import React from 'react';

const General = () => {
    return (
        <>
            <p>
                This edge is created during post-processing. It is created against 
                non role assignable Azure AD security groups when a Service
                Principal has one of the following MS Graph app role assignments:
            </p>

                <ul>
                    <li>Directory.ReadWrite.All</li>
                    <li>Group.ReadWrite.All</li>
                    <li>GroupMember.ReadWrite.All</li>
                </ul>

            <p>
                It is created against all Azure AD security groups, including those 
                that are role assignable, when a Service Principal has the following 
                MS Graph app role:
            </p>

                <ul>
                    <li>RoleManagement.ReadWrite.Directory</li>
                </ul>
            
            <p>
                You will not see this privilege when using just the Azure portal 
                or any other Microsoft tooling. If you audit the roles and administrators 
                affecting any particular Azure security group, you will not see 
                that the Service Principal can add members to the group, but it 
                indeed can because of the parallel access management system used 
                by MS Graph.
            </p>
        </>
    );
};

export default General;
