.. note::
   This documentation applies to Legacy BloodHound and is no longer maintained.

   See up-to-date documentation for BloodHound CE here: `About BloodHound Nodes`_

.. _About BloodHound Nodes: https://support.bloodhoundenterprise.io/hc/en-us/articles/17605671475867

Nodes
=====

Nodes represent principals and other objects in Active Directory.
BloodHound stores certain information about each node on the node
itself in the neo4j database, and the GUI automatically performs
several queries to gather insights about the node, such as how
privileged the node is, or which GPOs apply to the node, etc. Simply
click the node in the BloodHound GUI, and the "Node Info" tab will
populate with all that information for the node.

Users
^^^^^

At the top of the node info tab you will see the following info:

* **USERNAME@DOMAIN.COM**: the UPN formatted name of the user, where
  USERNAME is the SAM Account Name, and DOMAIN.COM is the fully
  qualified domain name of the domain the user is in.
* **Sessions**: The count of computers this user has been observed
  logging onto. Click this number to visually see the connections
  between those computers and this user
* **Sibling Objects in the Same OU**: the number of other AD users, groups,
  and computers that belong to the same OU as this user. This can be
  very helpful when trying to figure out the lay of the land for an
  environment
* **Reachable High Value Targets**: The count of how many high value
  targets this user has an attack path to. A high value target is by
  default any computer or user that belongs to the domain admins,
  domain controllers, and several other high privilege Active Directory
  groups. Click this number to see the shortest attack paths from this user
  to those high value targets.
* **Effective Inbound GPOs**: the count of GPOs that apply to this user.
  Click the number to see the GPOs and how they apply to this user.
* **See user within Domain/OU Tree**: click this to see where the user
  is placed in the OU tree. This can give you insights about the
  geographic location of the user as well as organizational placement
  of the actual person.

Node Properties
---------------

* **Display name**: The Active Directory display name for the user
* **Object ID**: The user's SID. In neo4j this is stored as the user's
  objectid to uniquely identify the node
* **Password Last Changed**: The human-readable date for when the user's
  password last changed. This is stored internally in Unix epoch format
* **Last Logon**: The last time the domain controller you got this data from
  handled a logon request for the user
* **Last Logon (Replicated)**: The last time any domain controller handled
  a logon for this user
* **Enabled**: Whether the user object is enabled in Active Directory. Fun
  fact: if you control a disabled user object, you can re-enable that
  user object.
* **AdminCount**: Whether the user object in Active Directory currently,
  or possibly ever has belonged to a certain set of highly privileged
  groups. This property is related to the AdminSDHolder object and the
  SDProp process. Read about that here: https://adsecurity.org/?p=1906
* **Compromised**: Whether the user is marked as Owned. You can mark any
  user in the BloodHound GUI as Owned by right-clicking it and clicking
  "Mark User as Owned".
* **Password Never Expires**: Whether the UAC flag is set for the user in
  Active Directory to not require the user to update their password
* **Cannot Be Delegated**: Whether the UAC flag is set on the user in 
  Active Directory to disallow kerberos delegation for this user. If
  this is "True", then the user cannot be abused as part of a kerberos
  delegation attack
* **ASREP Roastable**: Whether the user can be ASREP roasted. For more info
  about that attack, see https://github.com/GhostPack/Rubeus#asreproast


Extra Properties
----------------

This section displays some other information about the node, plus all other
non-default, string-type property values from Active Directory if you used
the --CollectAllProperties flag. The default properties you'll see here
include:

* **distinguishedname**: The distinguished name (DN) of the user
* **domain**: The FQDN of the domain the user is in
* **name**: The UPN-formatted name of the user
* **passwordnotreqd**: Whether the UAC flag is set on the user object to
  not require the user to have a password. Note that this does not
  necessarily mean the user does *not* have a password, just that the user
  is allowed to not have one
* **userpassword**: Under certain conditions, you may have a clear-text
  password show up in this property. Most commonly, we have seen that some
  sort of Unix/Linux-based application will write a password to this property
  for an AD account the application is running as. This is possibly the
  current AD password for the user, but is not guaranteed to be the current
  password.
* **unconstraineddelegation**: Whether the user is allowed to perform
  unconstrained kerberos delegation. See more info about that here:
  https://blog.harmj0y.net/redteaming/another-word-on-delegation/

Group Membership
----------------

This section displays stats about Active Directory security grops the user
belongs to:

* **First Degree Group Memberships**: AD security groups the user is
  directly added to. If you typed `net user david.mcguire /domain`, for
  example, these are the groups you'd see this user belonging to.
* **Unrolled Group Membership**: Groups can be added to groups, and those
  group nestings can grant admin rights, control of AD objects, and other
  privileges to many more users than intended. These are the groups that
  this user effectively belongs to, because the groups the user explicitly
  belongs to have been added to those groups.
* **Foreign Group Membership**: Groups in other Active Directory domains
  this user belongs to

Local Admin Rights
------------------

* **First Degree Local Admin**: The number of computers that this user
  itself has been added to the local administrators group on. If you were
  to type `net localgroup administrators` on those systems, you would see
  this user in the list
* **Group Delegation Local Admin Rights**: AD security groups can be added
  to local administrator groups. This number shows the number of computers
  this user has local admin rights on through security group delegation,
  regardless of how deep those group nestings may go
* **Derivative Local Admin Rights**: This query does not run by default
  because it's a very expensive query for neo4j to run. If you press the play
  button here, neo4j will run the query and return the number of computers
  this user has "derivative" local admin rights on. For more info about
  this concept, see http://www.sixdub.net/?p=591

Execution Privileges
--------------------

* **First Degree RDP Privileges**: The number of computers where this user
  has been added to the local Remote Desktop Users group.
* **Group Delegated RDP Privileges**: The number of computers where this user
  has remote desktop logon rights via security group delegation
* **First Degree DCOM Privileges**: The number of computers where this user
  has been added to the local Distributed COM Users group
* **Group Delegated DCOM Privileges**: The number of computers where this
  user has group delegated DCOM rights
* **SQL Admin Rights**: The number of computers where this user is very
  likely granted SA privileges on an MSSQL instance. This number is inferred
  by the number of computers listed on the user's serviceprincipalnames
  attribute where an MSSQL instance is referenced
* **Constrained Delegation Privileges**: The number of computers that trust
  this user to perform constrained delegation. This number is inferred by
  insepecting the msDS-AllowedToDelegateTo property on the user object in
  Active Directory and getting a count for how many computers are listed
  in that attribute

Outbound Object Control
-----------------------

* **First Degree Object Control**: The number of objects in AD where this
  user is listed as the IdentityReference on an abusable ACE. In other words,
  the number of objects in Active Directory that this user can take control
  of, without relying on security group delegation
* **Group Delegated Object Control**: The number of objects in AD where this
  user has control via security group delegation, regardless of how deep those
  group nestings may go
* **Transitive Object Control**: The number of objects this user can gain control
  of by performing ACL-only based attacks in Active Directory. In other words,
  the maximum number of objects the user can gain control of without needing
  to pivot to any other system in the network, just by manipulating objects
  in the directory

Inbound Object Control
----------------------

* **Explicit Object Controllers**: The number of principals that are listed
  as the IdentityReference on an abusable ACE on this user's DACL. In other
  words, the number of users, groups, or computers that directly have control
  of this user
* **Unrolled Object Controllers**: The *actual* number of principals that have
  control of this object through security group delegation. This number can
  sometimes be wildly higher than the previous number
* **Transitive Object Controllers**: The number of objects in AD that can achieve
  control of this object through ACL-based attacks

Groups
^^^^^^

At the top of the node info tab you will see the following info:

* **GROUPNAME@DOMAIN.COM**: The UPN formatted name of the security group, where
  GROUPNAME is the group's SAM Account Name, and DOMAIN.COM is the fully qualified
  name of the domain the group is in
* **Sessions**: The number of computers that users belonging to this group have
  been seen logging onto. This will include users that belong to this group through
  any number of nested memberships. Very useful for targetting users that belong
  to a particular security group
* **Reachable High Value Targets**: The count of how many high value targets this
  group (and therefore the users belonging to this group) has an attack path to.
  A high value target is by default any computer or user that belongs to the domain
  admins, domain controllers, and several other high privilege Active Directory
  groups. Click this number to see the shortest attack paths from this user to
  those high value targets.

Node Properties
---------------

* **Object ID**: The SID of the group. The group's SID is stored internally as its
  objectid
* **Description**: The contents of the description field for the group in Active
  Directory.
* **Admin Count**: Whether the group object in Active Directory currently, or
  possibly ever has belonged to a certain set of highly privileged groups. This
  property is related to the AdminSDHolder object and the SDProp process. Read
  about that here: https://adsecurity.org/?p=2053

Extra Properties
----------------

This section displays some other information about the node, plus all other
non-default, string-type property values from Active Directory if you used the
–CollectAllProperties flag. The default properties you’ll see here include:

* **distinguishedname**: The distinguished name (DN) of the group
* **domain**: The FQDN of the domain the group belongs to
* **name**: The UPN formatted name of the group

Group Members
-------------

* **Direct Members**: The number of principals that have been directly added to
  this group. If you typed `net group GROUPNAME /domain`, these are the
  principals you would see in that output
* **Unrolled Members**: The actual number of users that effectively belong to
  this group, no matter how many layers of nested group membership that goes
* **Foreign Members**: The number of users from other domains that belong to this
  group

Group Membership
----------------

* **First Degree Group Membership**: The number of groups this group has been
  added to
* **Unrolled Member Of**: The number of groups this group belongs to through
  nested group memberships
* **Foreign Group Membership**: Groups in other domains this group has been added
  to

Local Admin Rights
------------------

* **First Degree Local Admin**: The number of computers this group itself has been
  added to the local administrators group on
* **Group Delegated Local Admin Rights**: The number of computers this group (and
  the members of this group) has admin rights on via nested group memberships
* **Derivative Local Admin Rights**: This query does not run by default because
  it’s a very expensive query for neo4j to run. If you press the play button here,
  neo4j will run the query and return the number of computers this group has
  "derivative" local admin rights on. For more info about this concept, see
  http://www.sixdub.net/?p=591

Execution Privileges
--------------------

* **First Degree RDP Privileges**: The number of computers where this group has
  been added to the local Remote Desktop Users group.
* **Group Delegated RDP Privileges**: The number of computers where this group has
  remote desktop logon rights via security group delegation
* **First Degree DCOM Privileges**: The number of computers where this group has
  been added to the local Distributed COM Users group
* **Group Delegated DCOM Privileges**: The number of computers where this group has
  group delegated DCOM rights

Outbound Object Control
-----------------------

* **First Degree Object Control**: The number of objects in AD where this group is
  listed as the IdentityReference on an abusable ACE. In other words, the number of
  objects in Active Directory that this group can take control of, without relying
  on security group delegation
* **Group Delegated Object Control**: The number of objects in AD where this group
  has control via security group delegation, regardless of how deep those group
  nestings may go
* **Transitive Object Control**: The number of objects this group can gain control
  of by performing ACL-only based attacks in Active Directory. In other words, the
  maximum number of objects the group can gain control of without needing to pivot
  to any other system in the network, just by manipulating objects in the directory

Inbound Object Control
----------------------

* **Explicit Object Controllers**: The number of principals that are listed as the
  IdentityReference on an abusable ACE on this group’s DACL. In other words, the
  number of users, groups, or computers that directly have control of this group
* **Unrolled Object Controllers**: The actual number of principals that have control
  of this object through security group delegation. This number can sometimes be
  wildly higher than the previous number
* **Transitive Object Controllers**: The number of objects in AD that can achieve
  control of this object through ACL-based attacks

Computers
^^^^^^^^^

At the top of the node info tab you will see the following info:

* **COMPUTERNAME.DOMAIN.COM**: The fully qualified name of the computer
* **Sessions**: The total number of users that have been observed logging onto this
  computer
* **Reachable High Value Targets**: The count of how many high value targets this
  computer has an attack path to. A high value target is by default any computer or
  user that belongs to the domain admins, domain controllers, and several other high
  privilege Active Directory groups. Click this number to see the shortest attack
  paths from this computer to those high value targets
* **Sibling Objects in the Same OU**: the number of other AD users, groups, and
  computers that belong to the same OU as this computer. This can be very helpful
  when trying to figure out the lay of the land for an environment
* **Effective Inbound GPOs**: the count of GPOs that apply to this computer. Click
  the number to see the GPOs and how they apply to this computer
* **See Computer within Domain/OU Tree**: click this to see where the computer is
  placed in the OU tree. This can give you insights about the geographic location of
  the computer as well as the purpose and function of the computer

Node Properties
---------------

* **Object ID**: The SID of the computer. We store this in neo4j as the computer's
  objectid to uniquely identify the node
* **OS**: The operating system running on the computer, according to the corresponding
  property on the computer object in Active Directory
* **Enabled**: Whether the computer object is enabled
* **Allows Unconstrained Delegation**: Whether the computer is trusted to perform
  unconstrained delegation. By default, all domain controllers are trusted for this
  style of kerberos delegation. For information about the abuse related to this
  configuration, see https://blog.harmj0y.net/redteaming/another-word-on-delegation/
* **Compromised**: Whether the computer is marked as Owned. You can mark any computer in
  the BloodHound GUI as Owned by right-clicking it and clicking "Mark Computer as Owned".
* **LAPS Enabled**: Whether LAPS is running on the computer. This is determined by
  checking whether the associated MS LAPS properties are populated on the computer
  object
* **Password Last Changed**: The human readable time for when the computer account's
  password last changed in Active Directory
* **Last Logon (Replicated)**: The last time any domain controller handled a logon
  for this computer. In other words, the last time the computer authenticated to the
  domain

Extra Properties
----------------

This section displays some other information about the node, plus all other non-default,
string-type property values from Active Directory if you used the –CollectAllProperties
flag. The default properties you’ll see here include:

* **distinguishedname**: The distinguished name (DN) of the computer
* **domain**: The fully qualified name of the domain the computer is in
* **name**: The FQDN of the computer
* **serviceprincipalnames**: The list of SPNs on the computer. Very useful for determining
  any non-default services that may be running on the computer, such as MSSQL

Local Admins
------------

* **Explicit Admins**: The count of principals that have been directly added to the local
  administrators group on the computer. If you typed `net localgroup administrators` on
  the computer, these are the principals you would see listed in that output
* **Unrolled Admins**: The real number of principals that have local admin rights on this
  computer via nested group memberships
* **Foreign Admins**: The number of users from other domains that have admin rights on
  this computer
* **Derivative Local Admins**: The count of users that can execute an attack path relying
  on admin rights and token theft to compromise this system. For more information about
  this attack, see http://www.sixdub.net/?p=591

Inbound Execution Privileges
----------------------------

* **First Degree Remote Desktop Users**: The number of principals that have been granted
  RDP rights to this system by being added to the local Remote Desktop Users group
* **Group Delegated Remote Desktop Users**: The real number of users that have RDP access
  to this system through nested group memberships
* **First Degree Distributed COM Users**: The number of principals added to the local
  Distributed COM Users group
* **Group Delegated Distributed COM Users**: The number of users with DCOM access to this
  system through nested group memberships
* **SQL Admins**: The number of users that have SA privileges on an MSSQL instance running
  on this system. This is determined by inspecting the serviceprincipalname attribute on
  user objects in AD

Group Membership
----------------

* **First Degree Group Memberships**: AD security groups the computer is directly added to.
* **Unrolled Group Membership**: The number of groups this computer belongs to through
  nested group memberships
* Foreign Group Membership: Groups in other Active Directory domains this computer belongs
  to

Local Admin Rights
------------------

* **First Degree Local Admin**: The number of computers that this computer itself has been
  added to the local administrators group on.
* **Group Delegation Local Admin Rights**: This number shows the number of computers this
  computer has local admin rights on through security group delegation, regardless of how
  deep those group nestings may go
* **Derivative Local Admin Rights**: This query does not run by default because it’s a very
  expensive query for neo4j to run. If you press the play button here, neo4j will run the
  query and return the number of computers this computer has "derivative" local admin rights
  on. For more info about this concept, see http://www.sixdub.net/?p=591

Outbound Execution Privileges
-----------------------------

* **First Degree RDP Privileges**: The number of computers where this computer has been
  added to the local Remote Desktop Users group.
* **Group Delegated RDP Privileges**: The number of computers where this computer has remote
  desktop logon rights via security group delegation
* **First Degree DCOM Privileges**: The number of computers where this computer has been added
  to the local Distributed COM Users group
* **Group Delegated DCOM Privileges**: The number of computers where this computer has group
  delegated DCOM rights
* Constrained Delegation Privileges: The number of computers that trust this computer to
  perform constrained delegation. This number is inferred by insepecting the
  msDS-AllowedToDelegateTo property on the computer objects in Active Directory and getting a
  count for how many computers are listed in that attribute

Inbound Object Control
----------------------

* **Explicit Object Controllers**: The number of principals that are listed as the
  IdentityReference on an abusable ACE on this computer’s DACL. In other words, the number of
  users, groups, or computers that directly have control of this computer
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  object through security group delegation. This number can sometimes be wildly higher than
  the previous number
* **Transitive Object Controllers**: The number of objects in AD that can achieve control of
  this object through ACL-based attacks

Outbound Object Control
-----------------------

* **First Degree Object Control**: The number of objects in AD where this computer is listed as
  the IdentityReference on an abusable ACE. In other words, the number of objects in Active
  Directory that this computer can take control of, without relying on security group delegation
* **Group Delegated Object Control**: The number of objects in AD where this computer has
  control via security group delegation, regardless of how deep those group nestings may go
* **Transitive Object Control**: The number of objects this computer can gain control of by
  performing ACL-only based attacks in Active Directory. In other words, the maximum number of
  objects the computer can gain control of without needing to pivot to any other system in the
  network, just by manipulating objects in the directory

Domains
^^^^^^^

At the top of the node info tab you'll see this information:

* **Users**: The total number of user objects in the domain
* **Groups**: The total number of security groups in the domain
* **Computers**: The total number of computer objects in the domain
* **OUs**: The total number of organizational units in the domain
* **GPOs**: The total number of group policy objects in the domain
* **Map OU Structure**: Click this to see the entire tree structure, including all OUs, users,
  and computers

Node Properties
---------------

* **Object ID**: The SID of the domain. We map this internally in neo4j to a property called
  objectid to uniquely identify the node
* **Domain Functional Level**: The functional level of the Active Directory domain. This becomes
  particularly relevant in certain attack scenarios, such as resource-based constrained
  delegation

Extra Properties
----------------

This section displays some other information about the node, plus all other non-default,
string-type property values from Active Directory if you used the –CollectAllProperties flag. The
default properties you’ll see here include:

* **distinguishedname**: The distinguished name (DN) of the domain head object
* **domain**: The fully qualified name of the domain
* **name**: The name of the domain, this is what is displayed in the node label

Foreign Members
---------------

* **Foreign Users**: Users from other domains that have been added to security groups in this
  domain
* **Foreign Groups**: Groups from other domains that have been added to security groups in this
  domain
* **Foreign Admins**: Users in other domains that have been granted local admin rights on
  computers in this domain
* **Foreign GPO Controllers**: Users in other domains that have been granted control of group
  policy objects in this domain

Inbound Trusts
--------------

* **First Degree Trusts**: The number of other domains that directly trust this domain
* **Effective Inbound Trusts**: The number of other domains that trust this domain through
  trusting other domains that trust this domain. Easier to understand by clicking the number

Outbound Trusts
---------------

* **First Degree Trusts**: The number of domains tha thtis domain directly trusts
* **Effective Outbound Trusts**: The number of domains this domain trusts by trusting other
  domains

Inbound Object Control
----------------------

* **First Degree Controllers**: The number of principals that are listed as an IdentityReference
  on an abusable ACE on the domain head object. In other words, the number of principals that
  have direct control of the domain head. Control of this object is incredibly dangerous, as
  it gives principals the ability to perform the DCSync attack, or grant themselves any
  privileges on any object in the directory
* **Unrolled Controllers**: The real number of principals that have control of the domain head
  through nested security groups
* **Transitive Controllers**: The number of principals that can gain control of the domain head
  by executing an ACL-only attack path, without the need to pivoting to any other computers in
  the domain
* **Calculated Principals with DCSync Privileges**: The number of principals that have the
  DCSync privilege, which is granted with the combination of two specific rights, GetChanges
  and GetChangesAll

GPOs
^^^^

At the top of the node info tab you will see this info about the GPO:

* **GPO NAME@DOMAIN.COM** The name of the GPO where "GPO NAME" is the display name of the GPO,
  and DOMAIN.COM is the fully qualified name of the domain the GPO resides in
* **Reachable High Value Targets**: The number of high value targets reachable where an attack
  path starts from this Group Policy Object.

Node Properties
---------------

* **Object ID**: The GUID of the GPO, pulled from the GUID property on the GPO from Active
  Directory
* **GPO File Path**: The location on a domain controller where the Group Policy files for this
  GPO are located. Particularly relevant for when you are doing group policy-based attacks,
  or for pillaging group policy files for juicy information such as clear text passwords. For
  more info about GPO-based attacks, see https://wald0.com/?p=179

Extra Properties
----------------

* **distinguishedname** The distinguished name (DN) of the GPO
* **domain**: The FQDN of the domain this GPO resides in
* **name**: The name of the GPO, useful for differentiating GPOs with the same name in different
  domains

Affected Objects
----------------

* **Directly Affected OUs**: GPOs can be linked to domains, OUs, and sites. This number shows
  the number of domain/OU objects this GPO is linked to
* **Affected OUs**: The actual number of OUs affected by the GPO, regardless of OU tree depth
* **Computer Objects**: The number of computers this GPO applies to. Click the number to
  visually see how the GPO applies to those computers
* **User Objects**: The number of user objects this GPO applies to. Click the number to
  visually see how the GPO applies to those users

Inbound Object Control
----------------------

* **Explicit Object Controllers**: The number of principals that are listed as the
  IdentityReference on an abusalbe ACE on the GPO's DACL. In other words, the number of
  principals that can modify the GPO
* **Unrolled Object Controllers**: The real number of principals that have control of this GPO
  through security group nestings
* **Transitive Object Controllers**: The number of principals that can take control of this GPO
  through ACL-based attacks

OUs
^^^

At the top of the node info tab you will see this info about the OU:

* **OU NAME@DOMAIN.COM**: The UPN formatted name of the OU
* **See OU Within Domain Tree**: Click this to see the placement of the OU within the OU tree

Node Properties
---------------

* **Object ID**: The GUID of the OU, mapped internally in the neo4j database as its objectid
* **Blocks Inheritance**: Whether the OU blocks group policy enforcement inheritence. For more
  information about this concept, see https://wald0.com/?p=179

Extra Properties
----------------

* **distinguishedname**: The distinguished name (DN) of the OU
* **domain**: The FQDN of the domain the OU resides in
* **name**: The name of the OU, used to differentiate OUs with the same name in different
  domains

Affecting GPOs
--------------

* **GPOs Directly Affecting This OU**: The number of OUs that are directly linked to this OU
* **GPOs Affecting This OU**: The number of GPOs that apply to this OU, regardless of how
  many levels deep the OU is from the actual object the GPO is applied to. Easier to understand
  by clicking the number and visually seeing the connections

Descendant Objects
------------------

* **Total User Objects**: The total number of users under this OU, regardless of whether those
  users belong to OUs under this OU, etc.
* **Total Group Objects**: The number of security groups under this OU
* **Total Computer Objects**: The number of computer objects under this OU
* **Sibling Objects within OU**: The total number of other objects that belong to the same OU
  this OU belongs to

AZTenant
^^^^^^^^^
At the top of the node info tab you will see the following info:

* **TENANT NAME**: The name of the tenant in Azure.

Node Properties
----------------
* **Object ID**: The tenant ID for the tenant.

Extra Properties
----------------
* **Object ID**: The tenant ID for the tenant.

Descendant Objects
------------------
* **Subscriptions**: The subscriptions that fall under the tenant
* **Total VM Objects**: The virtual machine resources in Azure resources
* **Total Resource Group Objects**: The resource groups contained within the subscriptions under the tenant
* **Total Key Vault Objects**: The key vault resources within Azure resources
* **Total User Objects**: The number of users in AzureAD
* **Total Group Objects**: The number of groups in AzureAD

Inbound Control
---------------
* **Global Admins**: Principals with the Global Admin role activated against this tenant
* **Privileged Role Admins**: Principlas with the Privileged Role Admin role activated against this tenant
* **Transitive Object Controllers**: Principals with an object-control attack path to the tenant

AZUser
^^^^^^^

At the top of the node info tab you will see the following info:

* **USERNAME@DOMAIN.COM**: the fully formatted name of the user, directly from Azure.

Overview
--------------

* **Sessions**: The count of computers this user has been observed
  logging onto. Click this number to visually see the connections
  between those computers and this user.
* **Reachable High Value Targets**: The count of how many high value
  targets this user has an attack path to. A high value target is by
  default any computer or user that belongs to the domain admins,
  domain controllers, and several other high privilege Active Directory
  groups. Click this number to see the shortest attack paths from this user
  to those high value targets.

Node Properties
---------------

* **Object ID**: The user's object ID in AzureAD.

Group Membership
----------------

This section displays stats about Active Directory security groups the user
belongs to:

* **First Degree Group Memberships**:  The AzureAD security groups the user is
  directly added to. 
* **Unrolled Group Membership**: Groups that can be added to groups in AzureAD.

Outbound Object Control
-----------------------

* **First Degree Object Control**: The number of objects where this user has direct control of in AzureAD and Azure resources.
* **Group Delegated Object Control**: The number of objects in AzureAD and Azure resources where the group the user is assigned to has direct control over.
* **Transitive Object Control**: The number of objects this user can gain control
  of by performing ACL-only based attacks in Active Directory. In other words,
  the maximum number of objects the user can gain control of without needing
  to pivot to any other system in the network, just by manipulating objects
  in the directory

Inbound Object Control
----------------------

* **Explicit Object Controllers**: The number of principals that have direct control of  this user.
* **Unrolled Object Controllers**: The number of principals that have
  control of this object through Azure group delegation. 
* **Transitive Object Controllers**: The number of objects in AD that can achieve
  control of this object through ACL-based attacks

AZGroup
^^^^^^^

At the top of the node info tab you will see the following info:

* **GROUPNAME**: The name of the AzureAD Group.

Overview
------------
* **Sessions**: The number of on-premise computers that users belonging to this group have
  been seen logging onto. This will include users that belong to this group through
  any number of nested memberships. Very useful for targetting users that belong
  to a particular security group
* **Reachable High Value Targets**: The count of how many high value targets this
  group (and therefore the users belonging to this group) has an attack path to.
  A high value target is by default any computer or user that belongs to the domain
  admins, domain controllers, and several other high privilege on-premise Active Directory
  groups. Click this number to see the shortest attack paths from this user to
  those high value targets.

Node Properties
---------------

* **Object ID**: The group’s objectID in AzureAD

Extra Properties
-----------------

* **Object ID**: The group’s objectID in AzureAD

Group Members
-------------

* **Direct Members**: The number of principals that have been directly added to
  this in AzureAD. 
* **Unrolled Members**: The actual number of users that effectively belong to
  this group, no matter how many layers of nested group membership that goes
* **On-Prem Members**: The number of users that contain an on-premise SID that are members of the group.

Group Membership
-------------------

* **First Degree Group Membership**: The number of groups this group has been
  added to
* **Unrolled Member Of**: The number of groups this group belongs to through
  nested group memberships

Outbound Object Control
--------------------------

* **First Degree Object Control**: In AzureAD, the number of objects where this group has direct control of. 
* **Group Delegated Object Control**: The number of objects where this
  group has control via security group delegation, regardless of how deep those
  group nestings may go.
* **Transitive Object Control**: The number of objects this group can gain control through an object-control abuse attack path.

Inbound Object Control
-------------------------

* **Explicit Object Controllers**: In AzureAD, the number of principals that have direct control of this group. 
* **Unrolled Object Controllers**: The *actual* number of principals that have
  control of this group through security group delegation. This number can
  sometimes be wildly higher than the previous number
* **Transitive Object Controllers**: The number of objects that can assume control of this group through an object-control attack path.

AZApp
^^^^^
At the top of the node info tab you will see the following info:

* **APPID**: The application ID of the application in AzureAD. 

Inbound Object Control
------------------------------
* **Explicit Object Controllers**: The principals in AzureAD that are part of a role which can directly control the application. 
* **Unrolled Object Controllers**: The number of principals that can control the application through group membership and the roles applied to that group.
* **Transitive Object Controllers**: The number of objects in AzureAD that can achieve control of this object through an object-control attack path.

AZSubscription
^^^^^^^^^^^^^^^
At the top of the node info tab you will see the following info:

* **See Subscription Under Tenant**: See where the subscription lives relative to the tenant it trusts.

Node Properties
------------------

* **Object ID**: The Azure objectid for the resource group.

Descendent Objects
-------------------

* **Total VM Objects**: The VMs in Azure that belong to the subscription
* **Total Resource Group Objects**: The resource groups that belong to the subscription
* **Total Key Vault Objects**: The Key vaults in Azure that belong to the subscription

AZResourceGroup
^^^^^^^^^^^^^^^^
At the top of the node info tab you will see the following info:

* **RESOURCEGROUPNAME**: The full name of the resource group.

Node Properties
----------------

* **Object ID**: The Azure objectid for the resource group.

Descendent Objects
-------------------

* **Descendent VMs**: The VMs in Azure that belong to the resource group
* **Descendent KeyVaults**: The Key vaults in Azure that belong to the resource group

Inbound Object Control
------------------------------
* **Explicit Object Controllers**: The principals in AzureAD that directly can control the resource group.
* **Unrolled Object Controllers**: The number of principals that can control the resource group through group membership.
* **Transitive Object Controllers**: The number of objects in AzureAD that can achieve control of this object through object-control attack paths.

AZVM
^^^^^

At the top of the node info tab you will see the following info:

* **COMPUTERNAME**: The full name of the VM

Overview
------------
* **See VM within Tenant**: Unrolls the VM membership within Azure, displaying the VM’s resource group & subscription.
* **Managed Identities**: Shows the assigned managed identity service principals for the VM.


Node Properties
------------------

* **Object ID**: The Azure objectid for the VM.

Extra Properties
-------------------

* **Object ID**: The Azure objectid for the computer.

Inbound Execution Privileges
-------------------------------

* **First Degree Execution Rights**: Principals that have the ability to execute commands or directly log onto the machine.
* **Group Delegated Execution Rights**: Groups that have the ability to execute commands or directly log onto the machine.

Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to manage or execute code on the machine.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  object through security group delegation. This number can sometimes be wildly higher than
  the previous number
* **Transitive Object Controllers**: The number of objects in AzureAD that can achieve control of this object through object-control attack paths.

AZDevice
^^^^^^^^^

At the top of the node info tab you will see the following info:

* **DEVICENAME**: The full name of the device

Node Properties
---------------

* **Object ID**: The Azure objectid for the device.

Inbound Execution Privileges
----------------------------

* **Owners**: Principals that have the ability to execute commands or directly log onto the machine.
* **InTune Admins**: Principals that have the ability to setup InTune scripts to run on the machine.

AZServicePrincipal
^^^^^^^^^^^^^^^^^^^

At the top of the node info tab you will see the following info:

* **ObjectID**: The object ID of the service principal in AzureAD.

Group Membership
----------------

This section displays stats about Active Directory security groups the user
belongs to:

* **First Degree Group Memberships**:  The AzureAD security groups the service principal is
  directly added to. 
* **Unrolled Group Membership**: Groups that are added to groups in AzureAD.

Outbound Object Control
-----------------------

* **First Degree Object Control**: The number of objects where this service principal has direct control of in AzureAD and Azure resources.
* **Group Delegated Object Control**: The number of objects in AzureAD and Azure resources where the group the service principal is assigned to has direct control over.
* **Transitive Object Control**: The number of objects this service principal can gain control of by performing object-control attack paths

Inbound Object Control
----------------------

* **Explicit Object Controllers**: The number of principals that have direct control of this service principal.
* **Unrolled Object Controllers**: The number of principals that have
  control of this object through Azure group delegation.
* **Transitive Object Controllers**: The number of objects in AD that can achieve
  control of this object through object-control attack paths

AZAutomationAccount
^^^^^

Automation Accounts are one of several services falling under the umbrella of “Azure Automation”. Azure admins can use Automation Accounts to automate a variety of business operations, such as creating and configuring Virtual Machines in Azure.

Automation Accounts offer different process automation services, but at the core of all those services are what are called Runbooks.

Read more about how attackers abuse Automation Accounts in this blog post: https://medium.com/p/82667d17187a 


At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Overview
------------
* **See asset within Tenant**: Unrolls the asset's membership within Azure, displaying the asset’s resource group & subscription.
* **Managed Identities**: Shows the assigned managed identity service principals for the asset.


Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.

Extra Properties
-------------------

* **tenantid**: The Azure tenant ID for the asset.


Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.

AZContainerRegistry
^^^^^

Azure Container Registry (ACR) is Microsoft’s implementation of the Open Container Initiative’s (OCI) Distribution Spec, which itself is based on the original Docker Registry protocol. In plain English: ACR stores and manages container images for you. ACR serves those images, making them available to run locally, on some remote system, or as an Azure Container Instance. You can think of ACR as being somewhat analogous to your very own Docker Registry.

Read more about how attackers abuse Container Registries in this blog post: https://medium.com/p/1f407bfaa465 


At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Overview
------------
* **See asset within Tenant**: Unrolls the asset's membership within Azure, displaying the asset’s resource group & subscription.
* **Managed Identities**: Shows the assigned managed identity service principals for the asset.


Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.

Extra Properties
-------------------

* **tenantid**: The Azure tenant ID for the asset.


Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.

AZFunctionApp
^^^^^

Functions are one of several services falling under the umbrella of “Azure Automation”. Azure admins can create functions using a variety of language (C#, Java, PowerShell, etc.), then run those functions on-demand in Azure. Functions are hosted and grouped together in Azure using Function Apps.

Read more about how attackers abuse Function Apps in this blog post: https://medium.com/p/300065251cbe 


At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Overview
------------
* **See asset within Tenant**: Unrolls the asset's membership within Azure, displaying the asset’s resource group & subscription.
* **Managed Identities**: Shows the assigned managed identity service principals for the asset.


Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.

Extra Properties
-------------------

* **tenantid**: The Azure tenant ID for the asset.


Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.

AZLogicApp
^^^^^

Logic Apps are another Azure service falling under the general umbrella of “Azure Automation”. Admins can use Logic Apps to construct what are called “workflows”. Workflows are comprised of triggers and actions that occur as a result of those triggers.

Read more about how attackers abuse Logic Apps in this blog post: https://medium.com/p/52b29354fc54 


At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Overview
------------
* **See asset within Tenant**: Unrolls the asset's membership within Azure, displaying the asset’s resource group & subscription.
* **Managed Identities**: Shows the assigned managed identity service principals for the asset.


Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.

Extra Properties
-------------------

* **tenantid**: The Azure tenant ID for the asset.


Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.

AZManagedCluster
^^^^^

Azure Kubernetes Service Managed Clusters provide Azure admins an easy way to create and maintain Kubernetes clusters.

Read about how attackers abuse AKS Managed Clusters in this blog post: https://www.netspi.com/blog/technical/cloud-penetration-testing/extract-credentials-from-azure-kubernetes-service/ 


At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Overview
------------
* **See asset within Tenant**: Unrolls the asset's membership within Azure, displaying the asset’s resource group & subscription.
* **Managed Identities**: Shows the assigned managed identity service principals for the asset.


Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.

Extra Properties
-------------------

* **tenantid**: The Azure tenant ID for the asset.


Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.

AZVMScaleSet
^^^^^

Azure Virtual Machine Scale Sets are used by AKS Managed Clusters to spin up and spin down compute nodes. They can also by used by admins to spin up and manage virtual machines outside of the AKS use-case.

Read about how attackers abuse Virtual Machine Scale Sets in this blog post: https://www.netspi.com/blog/technical/cloud-penetration-testing/extract-credentials-from-azure-kubernetes-service/ 


At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Overview
------------
* **See asset within Tenant**: Unrolls the asset's membership within Azure, displaying the asset’s resource group & subscription.
* **Managed Identities**: Shows the assigned managed identity service principals for the asset.


Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.

Extra Properties
-------------------

* **tenantid**: The Azure tenant ID for the asset.


Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.

AzWebApp
^^^^^

Azure App Service is a Platform-as-a-Service product that promises to improve web application deployment, hosting, availability, and security. Web Apps hosted by Azure App Service are organized into Azure App Service Plans, which are Virtual Machines that the Web Apps in that plan all run on.

Read more about how attackers abuse Web Apps in this blog post: https://medium.com/p/c3adefccff95 


At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Overview
------------
* **See asset within Tenant**: Unrolls the asset's membership within Azure, displaying the asset’s resource group & subscription.
* **Managed Identities**: Shows the assigned managed identity service principals for the asset.


Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.

Extra Properties
-------------------

* **tenantid**: The Azure tenant ID for the asset.


Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.

AzManagementGroup
^^^^^

At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Overview
------------
* **Reachable High Value Targets**: The count of how many high value
  targets this asset has an attack path to. Click this number to see the shortest attack paths from this asset
  to those high value targets.

Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.
* **Tenant ID**: The Azure tenant ID for the asset.

Extra Properties
----------------

No extra properties.

Descendent Objects
-------------------

The number of assets under this asset categorized in Azure asset types.

Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.

AzRole
^^^^^

At the top of the node info tab you will see the following info:

* **NAME**: The full name of the role

Node Properties
------------------

* **Object ID**: The Azure objectid for the role.
* **Display Name**: The display name of the role.
* **Enabled**: Whether the role is enabled or disabled.
* **Description**: Description of the role.
* **Template ID**: Template ID of the role.
* **Tenant ID**: The Azure tenant ID for the role.

Extra Properties
----------------

* **isbuiltin**: Whether the role is an Azure built-in role or custom.


Assignments
-------------------

* **Active Assignments**: The assets with this role actively assigned.

AZKeyVault
^^^^^

At the top of the node info tab you will see the following info:

* **NAME**: The full name of the asset

Node Properties
------------------

* **Object ID**: The Azure objectid for the asset.
* **Enable RBAC Authorization**: Whether the Key Vault has RBAC authorization enabled or not.
* **Tenant ID**: The Azure tenant ID for the asset.

Vault Readers
-------------------

The number of assets that can read keys, certificates, and secrets in the Key Vault.

Inbound Object Control
-------------------------

* **Explicit Object Controllers**: The number of principals that are in a role that has the ability to control this asset.
* **Unrolled Object Controllers**: The actual number of principals that have control of this
  asset through security group delegation. This number can sometimes be wildly higher than
  the previous number.
* **Transitive Object Controllers**: The number of assets in Azure that can achieve control of this object through control attack paths.
