import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                You can abuse this privilege using BARK's Add-AZMemberToGroup
                function.
            </p>
            
            <p>
                This function requires you to supply an MS Graph-scoped JWT 
                associated with the Service Principal that has the privilege 
                to add principal to the target group. There are several ways to
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
                Then use BARK’s Add-AZMemberToGroup function to add a new principial 
                to the target group:
            </p>

                <pre>
                    <code>
                        {
                            'Add-AZMemberToGroup `\n' +
                            '    -PrincipalID = "028362ca-90ae-41f2-ae9f-1a678cc17391" `\n' +
                            '    -TargetGroupId "b9801b7a-fcec-44e2-a21b-86cb7ec718e4" `\n' +
                            '    -Token $MGToken.access_token'
                        }
                    </code>
                </pre>

            <p>
                Now you can re-authenticate as the principial you just added to the group
                and continue your attack path, now having whatever privileges the target
                group has.
            </p>
        </>
    );
};

export default Abuse;
