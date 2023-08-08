.. note::
   This documentation applies to Legacy BloodHound and is no longer maintained.

   See up-to-date documentation for BloodHound CE here: `All SharpHound Community Edition Flags, Explained`_

.. _All SharpHound Community Edition Flags, Explained: https://support.bloodhoundenterprise.io/hc/en-us/articles/17481375424795

All SharpHound Flags, Explained
===============================

SharpHound has several optional flags that let you control scan scope,
performance, output, and other behaviors.

Enumeration Options
^^^^^^^^^^^^^^^^^^^

CollectionMethods
----------------

This tells SharpHound what kind of data you want to collect. These are the most
common options you'll likely use:

* **Default:** You can specify default collection, or don't use the CollectionMethods
  option and this is what SharpHound will do. Default collection includes Active
  Directory security group membership, domain trusts, abusable permissions on AD
  objects, OU tree structure, Group Policy links, the most relevant AD object
  properties, local groups from domain-joined Windows systems, and user sessions.
* **All:** Performs all collection methods except for *GPOLocalGroup*.
* **DCOnly:** Collects data ONLY from the domain controller, will not touch other
  domain-joined Windows systems. Collects AD security group memberships, domain
  trusts, abusable permissions on AD objects, OU tree structure, Group Policy
  links, the most relevant AD object properties, and will attempt to correlate
  Group Policy-enforced local groups to affected computers.
* **ComputerOnly:** Collects user sessions (*Session*) and local groups (*LocalGroup*) 
  from domain-joined Windows systems. Will NOT collect the data collected with the DCOnly 
  collection method.
* **Session:** Just does user session collection. You will likely couple this with
  the --Loop option. See SharpHound examples below for more info on that.
* **LoggedOn:** Does session collection using the privileged collection method. Use
  this if you are running as a user with local admin rights on lots of systems
  for the best user session data.

Here are the less common CollectionMethods and what they do:

* **Group:** Just collect security group memberships from Active Directory
* **ACL:** Just collect abusable permissions on objects in Active Directory
* **GPOLocalGroup:** Just attempt GPO to computer correlation to determine members
  of the relevant local groups on each computer in the domain. Doesn't actually
  touch domain-joined systems, just gets info from domain controllers
* **Trusts:** Just collect domain trusts
* **Container:** Just collect the OU tree structure and Group Policy links
* **LocalGroup:** Just collect the members of all interesting local groups on 
  each domain-joined computer. Equivalent for *LocalAdmin* + *RDP* + *DCOM* + 
  *PSRemote*
* **LocalAdmin:** Just collect the members of the local Administrators group on
  each domain-joined computer
* **RDP:** Just collect the members of the Remote Desktop Users group on each
  domain-joined computer
* **DCOM:** Just collect the members of the Distributed COM Users group on each
  domain-joined computer
* **PSRemote:** Just collect the members of the Remote Management group on each
  domain-joined computer
* **ObjectProps** - Performs Object Properties collection for properties 
  such as LastLogon or PwdLastSet

Table to demonstrate the differences
------------------------------------

.. image:: /images/SharpHoundCheatSheet.png   
   :align: center
   :width: 900px
   :alt: SharpHound Cheat Sheet

Image credit: https://twitter.com/SadProcessor


Domain
------

Tell SharpHound which Active Directory domain you want to gather information from.
Importantly, you must be able to resolve DNS in that domain for SharpHound to work
correctly. For example, to collect data from the Contoso.local domain:

::

   C:\> SharpHound.exe -d contoso.local

Stealth
-------

Perform "stealth" data collection. This switch modifies your data collection
method. For example, if you want to perform user session collection, but only
touch systems that are the most likely to have user session data:

::

   C:\> SharpHound.exe --CollectionMethods Session --Stealth

ComputerFile
------------

Load a list of computer names or IP addresses for SharpHound to collect information
from. The file should be line-separated.

SearchBase
----------
Base DistinguishedName to start search at. Use this to limit your search.
Equivalent to the old --OU option

::

   C:\> SharpHound.exe --SearchBase "OU=New York,DC=Contoso,DC=Local"

LDAPFilter
----------

Instruct SharpHound to only collect information from principals that match a given
LDAP filter. For example, to only gather abusable ACEs from objects in a certain
OU, do this:

::

   C:\> SharpHound.exe --LDAPFilter "(CN=*,OU=New York,DC=Contoso,DC=Local)"

ExcludeDomainControllers
------------------------

`--ExcludeDCs` will instruct SharpHound to not touch domain controllers. By not touching
domain controllers, you will not be able to collect anything specified in the
`DCOnly` collection method, but you will also likely avoid detection by Microsoft
ATA.

::

   C:\> SharpHound.exe -d contoso.local --ExcludeDCs
   

RealDNSName
-----------

In some networks, DNS is not controlled by Active Directory, or is otherwise
not syncrhonized to Active Directory. This causes issues when a computer joined
to AD has an AD FQDN of COMPUTER.CONTOSO.LOCAL, but also has a DNS FQDN of, for
example, COMPUTER.COMPANY.COM. You can help SharpHound find systems in DNS by
providing the latter DNS suffix, like this:

::

   C:\> SharpHound.exe --RealDNSName COMPANY.COM

OverrideUserName
----------------

When running SharpHound from a `runas /netonly`-spawned command shell, you may
need to let SharpHound know what username you are authenticating to other systems
as.

CollectAllProperties
--------------------

Collect every LDAP property where the value is a string from each enumerated
Active Directory object.

WindowsOnly
-----------

Limit computer collection to systems with an operating system that matches *Windows*

Output Options
^^^^^^^^^^^^^^

OutputDirectory
---------------

By default, SharpHound will output zipped JSON files to the directory SharpHound
was launched from. You can specify a different folder for SharpHound to write
files to. For example, to instruct SharpHound to write output to C:\temp:

::

   C:\> SharpHound.exe --OutputDirectory C:\temp\

OutputPrefix
------------

Add a prefix to your JSON and ZIP files. For example, to have the JSON and ZIP
file names start with "Financial Audit":

::

   C:\> SharpHound.exe --OutputPrefix "Financial Audit"

NoZip
-----

Instruct SharpHound to **not** zip the JSON files when collection finishes.

EncryptZip
----------

Add a randomly generated password to the zip file.

ZipFileName
-----------

Specify the name of the zip file

RandomizeFilenames
------------------

Randomize output file names

PrettyJson
----------

Outputs JSON with indentation on multiple lines to improve readability.
Tradeoff is increased file size.

DumpComputerStatus
------------------

Dumps error codes from connecting to computers

Loop Options
^^^^^^^^^^^^

Loop
----

Instruct SharpHound to loop computer-based collection methods. For example,
attempt to collect local group memberships across all systems in a loop:

::

   C:\> SharpHound.exe --CollectionMethods LocalGroup --Loop

LoopDuration
------------

By default, SharpHound will loop for 2 hours. You can specify whatever duration
you like using the HH:MM:SS format. For example, to loop session collection for
12 hours, 30 minutes and 12 seconds:

::

   C:\> SharpHound.exe --CollectionMethods Session --Loop --LoopDuration 12:30:12

LoopInterval
------------

How long to pause for between loops, also given in HH:MM:SS format. For example,
to loop session collection for 12 hours, 30 minutes and 12 seconds, with a 15
minute interval between loops:

::

   C:\> SharpHound.exe --CollectionMethods Session --Loop --Loopduration 12:30:12 --LoopInterval 00:15:00

Connection Options
^^^^^^^^^^^^^^^^^^

DomainController
----------------

Target a specific domain controller by its IP address or name for LDAP collection

LdapPort
--------

Specify an alternate port for LDAP if necessary

SecureLdap
----------

Connect to the domain controller using LDAPS (secure LDAP) vs plain text LDAP.
This will use port 636 instead of 389.

LdapUsername
------------

Use with the LdapPassword parameter to provide alternate credentials to the domain
controller when performing LDAP collection.

LdapPassword
------------

Use with the LdapUsername parameter to provide alternate credentials to the domain
controller when performing LDAP collection.

DisableKerberosSigning
----------------------

Disables LDAP encryption. Not recommended.

Performance Options
^^^^^^^^^^^^^^^^^^^

PortScanTimeout
---------------

When SharpHound is scanning a remote system to collect user sessions and local
group memberships, it first checks to see if port 445 is open on that system.
This helps speed up SharpHound collection by not attempting unnecessary function calls
when systems aren't even online. By default, SharpHound will wait 2000 milliseconds 
(2 seconds) to get a response when scanning 445 on the remote system. You can decrease
this if you're on a fast LAN, or increase it if you need to. For example, to tell
SharpHound to wait just 1000 milliseconds (1 second) before skipping to the next host:

::

   C:\> SharpHound.exe --PortScanTimeout 1000

SkipPortScan
------------

Instruct SharpHound to not perform the port 445 check before attempting to enumerate
information from a remote host. This can result in significantly slower collection
periods.

Throttle
--------

Adds a delay after each request to a computer. Value is in milliseconds (Default: 0)

Jitter
------

Adds a percentage jitter to throttle. (Default: 0)

Cache Options
^^^^^^^^^^^^^

CacheFileName
-------------

SharpHound will create a local cache file to dramatically speed up data collection. It
does this primarily by storing a map of principal names to SIDs and IPs to computer names.
By default, SharpHound will auto-generate a name for the file, but you can use this flag
to control what that name will be. For example, to name the cache file `Accounting.bin`:

::

   C:\> SharpHound.exe --CacheFileName Accounting.bin

NoSaveCache
-----------

This will instruct SharpHound to NOT create the local cache file. Future enumeration
will be slower than they would be with a cache file, but this will prevent SharpHound
from putting the cache file on disk, which can help with AV and EDR evasion.

InvalidateCache
---------------

Invalidate the cache file and build a new cache

Deprecated Flags
^^^^^^^^^^^^^^^^

The following flags have been removed from SharpHound:

SearchForest
------------

This flag would instruct SharpHound to automatically collect data from all domains in
your current forest. To collect data from other domains in your forest, use the `nltest`
binary with its /domain_trusts flag to enumerate all domains in your current forest:

::

   C:\> nltest /domain_trusts

Then specify each domain one-by-one with the `--domain` flag
