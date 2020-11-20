AzureHound
==========

AzureHound uses the “Az” Azure PowerShell module and “Azure AD” PowerShell
module for gathering data within Azure and Azure AD. If the modules are not
installed, you can use the “-Install” switch to install them. The modules
require PowerShell version 5.1 and greater. To check your PowerShell version,
use “$PSVersionTable.PSVersion”. It’s also recommended to first set your TLS
version to 1.2 with this command to prevent any issues while installing these
modules:

::

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Once the Az module is installed, you can import AzureHound by using the command:

::

    Import-Module C:\path\to\AzureHound.ps1

Next, you must login to Azure PowerShell using the command:

::

    Connect-AzAccount

This will bring up an interactive page to login into Azure. Once successfully logged
into Azure, it will print your active subscription, account name, and Tenant ID.

You must also do the same for connecting to Azure AD:

::

    Connect-AzureAD

It is also possible to steal the access tokens from a compromised machine if that
machine has been used to login to Azure PowerShell before. Copy the existing files:

::

    C:\users\[Username]\.azure\AzureRmContextSettings.json
    C:\users\[Username]\.azure\TokenCache.dat

And place them in your own .azure folder. Re-launch PowerShell and the token will
now be used. 

For stealing AzureAD tokens, the tokens are cached in one of the module’s DLL files
and requires the PowerShell process context in order to access the tokens. They can be
stolen using the command:

::

    $token = [Microsoft.Open.Azure.AD.CommonLibrary.AzureSession]::AccessTokens['AccessToken']
    $token.AccessToken

You can then decode this JWT token to gather the UserPrincipalName and TenantID by
copy and pasting it into the JWT decoder.

To use AzureHound, you can invoke it using the command “Invoke-AzureHound”

By default, AzureHound will output the results to a file called “[timestamp]-azurecollection.zip”
in the directory that AzureHound is run from. This can be changed using the “-OutputDirectory”
switch, e.g. “Invoke-AzureHound -OutputDirectory “C:\temp\results””

AzureHound supports a few switches, as shown below:

-Install | Installs the PowerShell modules
-TenantId xxxx-xxxx-xxxx-xxxx | Gather using a specific tenant Id instead of using the current one
-OutputDirectory “C:\path\to\destination\folder” | Outputs the results to a custom directory
