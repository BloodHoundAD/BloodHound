.. note::
   This documentation applies to Legacy BloodHound and is no longer maintained.

   See up-to-date documentation for BloodHound CE here: `All AzureHound Community Edition Flags, Explained`_

.. _All AzureHound Community Edition Flags, Explained: https://support.bloodhoundenterprise.io/hc/en-us/articles/17481642843803

All AzureHound Flags, Explained
===============================

AzureHound has several optional flags that let you control scan scope,
performance, output, and other behaviors.

Enumeration Commands and Options
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

list
----

The "list" command tells AzureHound to read all possible information from AzureAD
and AzureRM. You can optionally limit the scope of what data AzureHound will collect
by providing a scope option after the "list" command:

These are the most common options you'll likely use:

* **az-ad** Collect all information available at the AzureAD tenant level. In most
  tenants, all users have the ability to read all this information by default.
* **az-rm** Collect all information available at the AzureRM subscription level. Users
  do not by default have read access to any of this information.

You can also scope collection to particular object types:

* **apps** Collects AzureAD application registration objects.
* **devices** Collects AzureAD devices regardless of join type.
* **groups** Collects AzureAD security-enabled groups, both role eligible and non role eligible.
* **key-vaults** Collects AzureRM key vaults.
* **management-groups** Collets AzureRM management group objects
* **resource-groups** Collects AzureRM resource group objects
* **roles** Collects AzureAD admin role objects
* **service-principals** Collects AzureAD service principals
* **subscriptions** Collets AzureRM subscriptions
* **tenants** Collets AzureAD tenant objects
* **users** Collects AzureAD users, including any guest users in the target tenant.
* **virtual-machines** Collects AzureRM virtual machines

You can even further scope collection to particular abuses against each object type.
Here are a few examples:

* **app-owners** Collects explicitly set owners of AzureAD application registration objects
* **management-group-user-access-admins** Collects any principal with the User Access Admin role against any management group
* **virtual-machine-avere-contributors** Collects any principal with the Avere Contributor role assignment against any virtual machine

Authentication Flags
^^^^^^^^^^^^^^^^^^^^

AzureHound supports several authentication options. You can control how
AzureHound authenticates by using command line flags or the configuration file. Some
flags should always be used together and are presented here in the context of
their authentication use-cases:

Authenticating with Username and Password
-----------------------------------------

* ``-u`` or ``--username`` - The user principal name of the AzureAD user you wish to authenticate
  as. UPN format is "username@domain.com"
* ``-p`` or ``--password`` - The clear-text password of the AzureAD user.

Example:

::

    ./azurehound -u "MattNelson@contoso.onmicrosoft.com" -p "MyVerySecurePassword123" --tenant "contoso.onmicrosoft.com" list
    
You can also skip proving the password on the command line, and AzureHound will instead
interactively prompt you for the password.

Authenticating with Service Principal Secret
--------------------------------------------

* ``-a`` or ``--app`` - The Application Id that the Azure app registration
  portal assigned when the app was registered.
* ``-s`` or ``--secret`` - The Application Secret that was generated for the
  app in the app registration portal.
  
Example:

::

    ./azurehound -a "6b5adee8-0d36-45b6-b393-8f29ae8a8cc8" -s "<secret>" --tenant "contoso.onmicrosoft.com" list
    
Authenticating with a JWT
-------------------------

* ``-j`` or ``--jwt`` - An MS Graph or AzureRM scoped JWT. These JWTs last a maximum
  of 90 minutes, so you may need to get a new JWT to enumerate data with AzureHound later.
  
Example:

::

    ./azurehound -j "ey..." --tenant "contoso.onmicrosoft.com" list az-ad
    
Authenticating with a Refresh Token
-----------------------------------

* ``-r`` or ``--refresh-token`` - A refresh token. AzureHound will automatically
  exchange this for an appropriately scoped JWT when accessing the MS Graph
  and AzureRM APIs.
  
Example:

::

    ./azurehound -r "0.ARwA6Wg..." --tenant "contoso.onmicrosoft.com" list
    
Additional Scoping and Output Flags
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

* ``-t`` or ``--tenant`` - The directory tenant that you want to request permission from. This can be in GUID or friendly name format.
* ``-b`` - Filter by one or more subscription ID. AzureHound will automatically dedupe this list for you.
* ``-m`` - Filter by one or more management group ID. AzureHound will automatically dedupe all descendent management groups and subscriptions for you.

* ``-o`` or ``--output`` - Instructs AzureHound to write its output to a specified file name.
* ``--log-file`` - Output logs to this file

* ``-v`` or ``--verbosity`` - AzureHound verbosity level (defaults to 0) [Min: -1, Max: 2]
