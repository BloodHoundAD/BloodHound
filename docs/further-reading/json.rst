.. note::
   This documentation applies to Legacy BloodHound and is no longer maintained.

   See up-to-date documentation for BloodHound CE here: `BloodHound Support`_

.. _BloodHound Support: https://support.bloodhoundenterprise.io/hc/en-us

BloodHound JSON Formats
=======================

Data exported by SharpHound is stored in JSON files. There are eight
seperate JSON files that provide different data. The structure is
documented here

Basic JSON Format
^^^^^^^^^^^^^^^^^

All JSON files end with a meta tag that contains the number of objects in the file as well as the type of data in the file. The actual data is stored in an array with a key that matches the string in the meta tag.

::

   {
       "users":[
           {
               "name": "ADMIN@TESTLAB.LOCAL"
           }
       ],
       "meta":{
           "type" : "users",
           "count": 1,
           "version": 3
       }
   }

Possible types/meta tags are:
* users
* groups
* ous
* computers
* gpos
* domains

Object Formats
^^^^^^^^^^^^^^

Users
-----

::

   {
     "Properties": {
       "highvalue": false,
       "name": "ADMINISTRATOR@TESTLAB.LOCAL",
       "domain": "TESTLAB.LOCAL",
       "objectid": "S-1-5-21-3130019616-2776909439-2417379446-500",
       "distinguishedname": "CN=Administrator,CN=Users,DC=testlab,DC=local",
       "description": "Built-in account for administering the computer/domain",
       "dontreqpreauth": false,
       "passwordnotreqd": false,
       "unconstraineddelegation": false,
       "sensitive": false,
       "enabled": true,
       "pwdneverexpires": true,
       "lastlogon": 1579223741,
       "lastlogontimestamp": 1578330279,
       "pwdlastset": 1568654366,
       "serviceprincipalnames": [],
          "hasspn": false,
          "displayname": null,
          "email": null,
          "title": null,
          "homedirectory": null,
       "userpassword": null,
       "admincount": true,
       "sidhistory": []
     },
     "AllowedToDelegate": [],
     "SPNTargets": [],
     "PrimaryGroupSid": "S-1-5-21-3130019616-2776909439-2417379446-513",
     "HasSIDHistory": [],
     "ObjectIdentifier": "S-1-5-21-3130019616-2776909439-2417379446-500",
     "Aces": [
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "Owner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "All",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "All",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "All",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       }
     ]
   }

Computers
---------

::

   {
     "Properties": {
       "haslaps": false,
       "highvalue": false,
       "name": "PRIMARY.TESTLAB.LOCAL",
       "domain": "TESTLAB.LOCAL",
       "objectid": "S-1-5-21-3130019616-2776909439-2417379446-1001",
       "distinguishedname": "CN=PRIMARY,OU=Domain Controllers,DC=testlab,DC=local",
       "description": null,
       "enabled": true,
       "unconstraineddelegation": true,
       "serviceprincipalnames": [
         "Dfsr-12F9A27C-BF97-4787-9364-D31B6C55EB04/PRIMARY.testlab.local",
         "ldap/PRIMARY.testlab.local/ForestDnsZones.testlab.local",
         "ldap/PRIMARY.testlab.local/DomainDnsZones.testlab.local",
         "DNS/PRIMARY.testlab.local",
         "GC/PRIMARY.testlab.local/testlab.local",
         "RestrictedKrbHost/PRIMARY.testlab.local",
         "RestrictedKrbHost/PRIMARY",
         "RPC/a052f434-0629-458a-bd51-48118140ae3c._msdcs.testlab.local",
         "HOST/PRIMARY/TESTLAB",
         "HOST/PRIMARY.testlab.local/TESTLAB",
         "HOST/PRIMARY",
         "HOST/PRIMARY.testlab.local",
         "HOST/PRIMARY.testlab.local/testlab.local",
         "E3514235-4B06-11D1-AB04-00C04FC2DCD2/a052f434-0629-458a-bd51-48118140ae3c/testlab.local",
         "ldap/PRIMARY/TESTLAB",
         "ldap/a052f434-0629-458a-bd51-48118140ae3c._msdcs.testlab.local",
         "ldap/PRIMARY.testlab.local/TESTLAB",
         "ldap/PRIMARY",
         "ldap/PRIMARY.testlab.local",
         "ldap/PRIMARY.testlab.local/testlab.local"
       ],
       "lastlogontimestamp": 1583951963,
       "pwdlastset": 1583951963,
       "operatingsystem": "Windows Server 2012 R2 Standard Evaluation"
     },
     "AllowedToDelegate": [],
     "AllowedToAct": [],
     "PrimaryGroupSid": "S-1-5-21-3130019616-2776909439-2417379446-516",
     "Sessions": [
       {
         "UserId": "S-1-5-21-3130019616-2776909439-2417379446-500",
         "ComputerId": "S-1-5-21-3130019616-2776909439-2417379446-1001"
       }
     ],
     "LocalAdmins": [
       {
         "MemberId": "S-1-5-21-3130019616-2776909439-2417379446-500",
         "MemberType": "User"
       },
       {
         "MemberId": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "MemberType": "Group"
       },
       {
         "MemberId": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "MemberType": "Group"
       }
     ],
     "RemoteDesktopUsers": [],
     "DcomUsers": [],
     "PSRemoteUsers": [],
     "ObjectIdentifier": "S-1-5-21-3130019616-2776909439-2417379446-1001",
     "Aces": [
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "Owner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "GenericAll",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "GenericAll",
         "AceType": "",
         "IsInherited": true
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": true
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": true
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": true
       }
     ]
   }

Groups
------

::

   {
     "Properties": {
       "highvalue": true,
       "name": "ADMINISTRATORS@TESTLAB.LOCAL",
       "domain": "TESTLAB.LOCAL",
       "objectid": "TESTLAB.LOCAL-S-1-5-32-544",
       "distinguishedname": "CN=Administrators,CN=Builtin,DC=testlab,DC=local",
       "description": "Administrators have complete and unrestricted access to the computer/domain",
       "admincount": true
     },
     "Members": [
       {
         "MemberId": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "MemberType": "Group"
       },
       {
         "MemberId": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "MemberType": "Group"
       },
       {
         "MemberId": "S-1-5-21-3130019616-2776909439-2417379446-500",
         "MemberType": "User"
       }
     ],
     "ObjectIdentifier": "TESTLAB.LOCAL-S-1-5-32-544",
     "Aces": [
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "Owner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       }
     ]
   }

Domains
-------

::

   {
     "Properties": {
       "highvalue": true,
       "name": "TESTLAB.LOCAL",
       "domain": "TESTLAB.LOCAL",
       "objectid": "S-1-5-21-3130019616-2776909439-2417379446",
       "distinguishedname": "DC=testlab,DC=local",
       "description": null,
       "functionallevel": "2012 R2"
     },
     "Users": [
       "S-1-5-21-3130019616-2776909439-2417379446-2103",
       "S-1-5-21-3130019616-2776909439-2417379446-500",
       "S-1-5-21-3130019616-2776909439-2417379446-501",
       "S-1-5-21-3130019616-2776909439-2417379446-502",
       "S-1-5-21-3130019616-2776909439-2417379446-1105",
       "S-1-5-21-3130019616-2776909439-2417379446-2106",
       "S-1-5-21-3130019616-2776909439-2417379446-2107"
     ],
     "Computers": [
       "S-1-5-21-3130019616-2776909439-2417379446-2105"
     ],
     "ChildOus": [
       "0DE400CD-2FF3-46E0-8A26-2C917B403C65",
       "2A374493-816A-4193-BEFD-D2F4132C6DCA"
     ],
     "Trusts": [
       {
         "TargetDomainSid": "S-1-5-21-3084884204-958224920-2707782874",
         "IsTransitive": true,
         "TrustDirection": 3,
         "TrustType": 4,
         "SidFilteringEnabled": true,
         "TargetDomainName": "EXTERNAL.LOCAL"
       }
     ],
     "Links": [
       {
         "IsEnforced": false,
         "Guid": "BE91688F-1333-45DF-93E4-4D2E8A36DE2B"
       }
     ],
     "RemoteDesktopUsers": [],
     "LocalAdmins": [],
     "DcomUsers": [],
     "PSRemoteUsers": [],
     "ObjectIdentifier": "S-1-5-21-3130019616-2776909439-2417379446",
     "Aces": [
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "Owner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "All",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "All",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "GenericAll",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-9",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "GetChanges",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "GetChangesAll",
         "IsInherited": false
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "GetChanges",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-498",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "GetChanges",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-516",
         "PrincipalType": "Group",
         "RightName": "ExtendedRight",
         "AceType": "GetChangesAll",
         "IsInherited": false
       }
     ]
   }

GPOs
----

::

   {
     "Properties": {
       "highvalue": false,
       "name": "DEFAULT DOMAIN POLICY@TESTLAB.LOCAL",
       "domain": "TESTLAB.LOCAL",
       "objectid": "BE91688F-1333-45DF-93E4-4D2E8A36DE2B",
       "distinguishedname": "CN={31B2F340-016D-11D2-945F-00C04FB984F9},CN=Policies,CN=System,DC=testlab,DC=local",
       "description": null,
       "gpcpath": "\\\\testlab.local\\sysvol\\testlab.local\\Policies\\{31B2F340-016D-11D2-945F-00C04FB984F9}"
     },
     "ObjectIdentifier": "BE91688F-1333-45DF-93E4-4D2E8A36DE2B",
     "Aces": [
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "Owner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "GenericWrite",
         "AceType": "",
         "IsInherited": false
       }
     ]
   }

OUs
---

::

   {
     "Properties": {
       "highvalue": false,
       "name": "DOMAIN CONTROLLERS@TESTLAB.LOCAL",
       "domain": "TESTLAB.LOCAL",
       "objectid": "0DE400CD-2FF3-46E0-8A26-2C917B403C65",
       "distinguishedname": "OU=Domain Controllers,DC=testlab,DC=local",
       "description": "Default container for domain controllers",
       "blocksinheritance": false
     },
     "Links": [
       {
         "IsEnforced": false,
         "Guid": "F5BDDA03-0183-4F41-93A2-DCA253BE6450"
       }
     ],
     "ACLProtected": false,
     "Users": [],
     "Computers": [
       "S-1-5-21-3130019616-2776909439-2417379446-1001"
     ],
     "ChildOus": [],
     "RemoteDesktopUsers": [],
     "LocalAdmins": [],
     "DcomUsers": [],
     "PSRemoteUsers": [],
     "ObjectIdentifier": "0DE400CD-2FF3-46E0-8A26-2C917B403C65",
     "Aces": [
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "Owner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-512",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": false
       },
       {
         "PrincipalSID": "S-1-5-21-3130019616-2776909439-2417379446-519",
         "PrincipalType": "Group",
         "RightName": "GenericAll",
         "AceType": "",
         "IsInherited": true
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteDacl",
         "AceType": "",
         "IsInherited": true
       },
       {
         "PrincipalSID": "TESTLAB.LOCAL-S-1-5-32-544",
         "PrincipalType": "Group",
         "RightName": "WriteOwner",
         "AceType": "",
         "IsInherited": true
       }
     ]
   }
