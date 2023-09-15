/**
 * A typed principal
 * @typedef {Object} TypedPrincipal
 * @property {string} ObjectIdentifier
 * @property {('Group'|'User'|'Computer'|'OU'|'GPO'|'Domain'|'Container')} ObjectType
 */

/**
 * An ACE
 * @typedef {Object} ACE
 * @property {string} PrincipalSID
 * @property {string} PrincipalType
 * @property {string} RightName
 * @property {boolean} IsInherited
 */

/**
 * The base ingestion object
 * @typedef {Object} IngestBase
 * @property {Object} Properties
 * @property {string} ObjectIdentifier
 * @property {Array.<ACE>} Aces
 * @property {boolean} IsACLProtected
 */

/**
 * A group object
 * @typedef {Object} GroupProps
 * @property {Array.<TypedPrincipal>} Members
 *
 * @typedef {IngestBase & GroupProps} Group
 */

/**
 * An API result
 * @typedef APIResult
 * @property {boolean} Collected
 * @property {string} FailureReason
 */

/**
 * Sessions
 * @typedef Session
 * @property {string} UserSID
 * @property {string} ComputerSID
 */

/**
 * @typedef SessionAPI
 * @property {Array.<Session>} Results
 *
 * @typedef {APIResult & SessionAPI} SessionAPIResult
 */

/**
 * @typedef LocalGroupAPI
 * @property {Array.<TypedPrincipal>} Results
 *
 * @typedef {APIResult & LocalGroupAPI} LocalGroupAPIResult
 */

/** Computer Status
 * @typedef {Object} ComputerStatus
 * @property {boolean} Connectable
 * @property {string} Error
 */

/**
 * A computer object
 * @typedef {Object} ComputerProps
 * @property {?string} PrimaryGroupSID
 * @property {Array.<TypedPrincipal>} AllowedToDelegate
 * @property {Array.<TypedPrincipal>} AllowedToAct
 * @property {Array.<TypedPrincipal>} HasSIDHistory
 * @property {Array.<TypedPrincipal>} DumpSMSAPassword
 * @property {SessionAPIResult} Sessions
 * @property {SessionAPIResult} PrivilegedSessions
 * @property {SessionAPIResult} RegistrySessions
 * @property {LocalGroupAPIResult} LocalAdmins
 * @property {LocalGroupAPIResult} RemoteDesktopUsers
 * @property {LocalGroupAPIResult} DcomUsers
 * @property {LocalGroupAPIResult} PSRemoteUsers
 * @property {ComputerStatus} Status
 *
 * @typedef {IngestBase & ComputerProps} Computer
 */

/**
 * @typedef SPNPrivilege
 * @property {string} ComputerSID
 * @property {number} Port
 * @property {string} Service
 */

/**
 * A user object
 * @typedef {Object} UserProps
 * @property {Array.<TypedPrincipal>} AllowedToDelegate
 * @property {?string} PrimaryGroupSID
 * @property {Array.<TypedPrincipal>} HasSIDHistory
 * @property {Array.<SPNPrivilege>} SPNTargets
 *
 * @typedef {IngestBase & UserProps} User
 */

/**
 * @typedef {Object} GPLink
 * @property {boolean} IsEnforced
 * @property {string} GUID
 */

/**
 * @typedef {Object} GPOResult
 * @property {Array.<TypedPrincipal>} LocalAdmins
 * @property {Array.<TypedPrincipal>} RemoteDesktopUsers
 * @property {Array.<TypedPrincipal>} DcomUsers
 * @property {Array.<TypedPrincipal>} PSRemoteUsers
 * @property {Array.<TypedPrincipal>} AffectedComputers
 */

/**
 * @typedef {Object} OUProps
 * @property {Array.<GPLink>} Links
 * @property {Array.<TypedPrincipal>} ChildObjects
 * @property {GPOResult} GPOChanges
 *
 * @typedef {IngestBase & OUProps} OU
 */

/**
 * @typedef {Object} DomainTrust
 * @property {string} TargetDomainSid
 * @property {string} TargetDomainName
 * @property {boolean} IsTransitive
 * @property {boolean} SidFilteringEnabled
 * @property {number} TrustDirection
 * @property {number} TrustType
 */

/**
 * @typedef {Object} DomainProps
 * @property {Array.<TypedPrincipal>} ChildObjects
 * @property {Array.<DomainTrust>} Trusts
 * @property {Array.<GPLink>} Links
 * @property {GPOResult} GPOChanges
 *
 * @typedef {IngestBase & DomainProps} Domain
 */

/**
 * @typedef {Object} ContainerProps
 * @property {Array.<TypedPrincipal>} ChildObjects
 *
 * @typedef {IngestBase & ContainerProps} Container
 */

/**
 * @typedef {Object} AzureBase
 * @property {string} kind
 * @property {Object} data
 */

/**
 * @typedef {Object} AzureDirectoryObject
 * @property {string} id
 * @property {string} @odata.type
 */

/**
 * @typedef {Object} AzureApp
 * @property {string} description
 * @property {string} displayName
 * @property {Date} createdDateTime
 * @property {string} appId
 * @property {string} publisherDomain
 * @property {string} signInAudience
 * @property {string} tenantId
 * @property {string} tenantName
 */

/**
 * @typedef {Object} AzureAppOwners
 * @property {string} appId
 * @property {Array.<AzureAppOwner>} owners
 */

/**
 * @typedef {Object} AzureAppOwner
 * @property {string} appId
 * @property {AzureDirectoryObject} owner
 */

/**
 * @typedef {Object} AzureDevice
 * @property {string} deviceId
 * @property {string} displayName
 * @property {string} operatingSystem
 * @property {string} operatingSystemVersion
 * @property {string} trustType
 * @property {string} tenantId
 * @property {string} tenantName
 * @property {string} id
 * @property {string} mdmAppId
 */

/**
 * @typedef {Object} AzureDeviceOwners
 * @property {string} deviceId
 * @property {Array.<AzureDeviceOwner>} owners
 */

/**
 * @typedef {Object} AzureDeviceOwner
 * @property {AzureDirectoryObject} owner
 * @property {string} deviceId
 */

/**
 * @typedef {Object} AzureGroup
 * @property {Date} createdDateTime
 * @property {string} description
 * @property {string} displayName
 * @property {boolean} isAssignableToRole
 * @property {string} onPremisesSecurityIdentifier
 * @property {boolean} onPremisesSyncEnabled
 * @property {boolean} securityEnabled
 * @property {string} securityIdentifier
 * @property {string} tenantId
 * @property {string} id
 * @property {string} tenantName
 * @property {String} azureGroupTypes
 * @property {String} azureMembershipRule
 */


/**
 * @typedef {Object} AzureGroupMember
 * @property {AzureDirectoryObject} member
 * @property {string} groupId
 */

/**
 * @typedef {Object} AzureGroupMembers
 * @property {Array.<AzureGroupMember>} members
 * @property {string} groupId
 */

/**
 * @typedef {Object} AzureGroupOwner
 * @property {AzureDirectoryObject} owner
 * @property {string} groupId
 */

/**
 * @typedef {Object} AzureGroupOwners
 * @property {Array.<AzureGroupOwner>} owners
 * @property {string} groupId
 */

/**
 * @typedef {Object} AzureKeyVaultProperties
 * @property {boolean} enableRbacAuthorization
 */

/**
 * @typedef {Object} AzureKeyVault
 * @property {string} name
 * @property {string} tenantId
 * @property {AzureKeyVaultProperties} properties
 * @property {string} id
 * @property {string} resourceGroup
 */

/**
 * @typedef {Object} AzureKeyVaultPermissions
 * @property {Array.<string>} certificates
 * @property {Array.<string>} keys
 * @property {Array.<string>} secrets
 * @property {Array.<string>} storage
 */

/**
 * @typedef {Object} AzureKeyVaultAccessPolicy
 * @property {string} keyVaultId
 * @property {string} objectId
 * @property {AzureKeyVaultPermissions} permissions
 */

/**
 * @typedef {Object} AzureRoleAssignmentPropertiesWithScope
 * @property {string} principalId
 * @property {string} roleDefinitionId
 * @property {string} scope
 */

/**
 * @typedef {Object} AzureRoleAssignment
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {AzureRoleAssignmentPropertiesWithScope} properties
 */

/**
 * @typedef {Object} AzureKeyVaultContributor
 * @property {AzureRoleAssignment} contributor
 * @property {string} keyVaultId
 */

/**
 * @typedef {Object} AzureKeyVaultContributors
 * @property {Array.<AzureKeyVaultContributor>} contributors
 * @property {string} keyVaultId
 */

/**
 * @typedef {Object} AzureKeyVaultOwner
 * @property {AzureRoleAssignment} owner
 * @property {string} keyVaultId
 */

/**
 * @typedef {Object} AzureKeyVaultOwners
 * @property {string} keyVaultId
 * @property {Array.<AzureKeyVaultOwner>} owners
 */

/**
 * @typedef {Object} AzureKeyVaultUserAccessAdmin
 * @property {AzureRoleAssignment} userAccessAdmin
 * @property {string} keyVaultId
 */

/**
 * @typedef {Object} AzureKeyVaultUserAccessAdmins
 * @property {string} keyVaultId
 * @property {Array.<AzureKeyVaultUserAccessAdmin>} userAccessAdmins
 */

/**
 * @typedef {Object} AzureDescendantParentGroupInfo
 * @property {string} id
 */

/**
 * @typedef {Object} AzureDescendantInfoProperties
 * @property {string} displayName
 * @property {AzureDescendantParentGroupInfo} parent
 */

/**
 * @typedef {Object} AzureDescendantInfo
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {AzureDescendantInfoProperties} properties
 */

/**
 * @typedef {Object} AzureManagementGroupOwner
 * @property {string} managementGroupId
 * @property {AzureRoleAssignment} owner
 */

/**
 * @typedef {Object} AzureManagementGroupOwners
 * @property {string} managementGroupId
 * @property {Array.<AzureManagementGroupOwner>} owners
 */

/**
 * @typedef {Object} AzureManagementGroupUserAccessAdmin
 * @property {AzureRoleAssignment} userAccessAdmin
 * @property {string} managementGroupId
 */

/**
 * @typedef {Object} AzureManagementGroupUserAccessAdmins
 * @property {string} managementGroupId
 * @property {Array.<AzureManagementGroupUserAccessAdmin>} userAccessAdmins
 */

/**
 * @typedef {Object} AzureManagementGroupProperties
 * @property {string} displayName
 */

/**
 * @typedef {Object} AzureManagementGroup
 * @property {string} id
 * @property {AzureManagementGroupProperties} properties
 * @property {string} tenantName
 * @property {string} tenantId
 */

/**
 * @typedef {Object} AzureResourceGroup
 * @property {string} id
 * @property {string} name
 * @property {string} tenantId
 * @property {string} subscriptionId
 */

/**
 * @typedef {Object} AzureResourceGroupOwner
 * @property {AzureRoleAssignment} owner
 * @property {string} resourceGroupId
 */

/**
 * @typedef {Object} AzureResourceGroupOwners
 * @property {string} resourceGroupId
 * @property {Array.<AzureResourceGroupOwner>} owners
 */

/**
 * @typedef {Object} AzureResourceGroupUserAccessAdmin
 * @property {AzureRoleAssignment} userAccessAdmin
 * @property {string} resourceGroupId
 */

/**
 * @typedef {Object} AzureResourceGroupUserAccessAdmins
 * @property {string} resourceGroupId
 * @property {Array.<AzureResourceGroupUserAccessAdmin>} userAccessAdmins
 */

/**
 * @typedef {Object} AzureRole
 * @property {string} description
 * @property {string} displayName
 * @property {boolean} isBuiltIn
 * @property {boolean} isEnabled
 * @property {string} templateId
 * @property {string} tenantId
 * @property {string} tenantName
 * @property {string} id
 */

/**
 * @typedef {Object} AzureUnifiedRoleAssignment
 * @property {string} roleDefinitionId
 * @property {string} directoryScopeId
 * @property {string} principalId
 */

/**
 * @typedef {Object} AzureRoleAssignments
 * @property {string} roleDefinitionId
 * @property {Array.<AzureUnifiedRoleAssignment>} roleAssignments
 */

/**
 * @typedef {Object} AzureServicePrincipal
 * @property {boolean} accountEnabled
 * @property {string} displayName
 * @property {string} description
 * @property {string} appOwnerOrganizationId
 * @property {string} appDescription
 * @property {string} appDisplayName
 * @property {string} servicePrincipalType
 * @property {string} tenantName
 * @property {string} tenantId
 * @property {string} id
 * @property {string} appId
 */

/**
 * @typedef {Object} AzureServicePrincipalOwner
 * @property {AzureDirectoryObject} owner
 * @property {string} servicePrincipalId
 */

/**
 * @typedef {Object} AzureServicePrincipalOwners
 * @property {string} servicePrincipalId
 * @property {Array.<AzureServicePrincipalOwner>} owners
 */

/**
 * @typedef {Object} AzureSubscription
 * @property {string} displayName
 * @property {string} subscriptionId
 * @property {string} tenantId
 * @property {string} id
 */

/**
 * @typedef {Object} AzureSubscriptionOwner
 * @property {string} subscriptionId
 * @property {AzureRoleAssignment} owner
 */

/**
 * @typedef {Object} AzureSubscriptionOwners
 * @property {string} subscriptionId
 * @property {Array.<AzureSubscriptionOwner>} owners
 */

/**
 * @typedef {Object} AzureSubscriptionUserAccessAdmin
 * @property {AzureRoleAssignment} userAccessAdmin
 * @property {string} subscriptionId
 */

/**
 * @typedef {Object} AzureSubscriptionUserAccessAdmins
 * @property {string} subscriptionId
 * @property {Array.<AzureSubscriptionUserAccessAdmin>} userAccessAdmins
 */

/**
 * @typedef {Object} AzureTenant
 * @property {string} displayName
 * @property {string} id
 * @property {string} tenantId
 */

/**
 * @typedef {Object} AzureUser
 * @property {boolean} accountEnabled
 * @property {Date} createdDateTime
 * @property {string} displayName
 * @property {string} jobTitle
 * @property {Date} lastPasswordChangeDateTime
 * @property {string} mail
 * @property {string} onPremisesSecurityIdentifier
 * @property {boolean} onPremisesSyncEnabled
 * @property {string} userPrincipalName
 * @property {string} userType
 * @property {string} tenantId
 * @property {string} id
 */

/**
 * @typedef {Object} AzureOSDisk
 * @property {string} osType
 */

/**
 * @typedef {Object} AzureStorageProfile
 * @property {AzureOSDisk} osDisk
 */

/**
 * @typedef {Object} AzureVirtualMachineProperties
 * @property {string} vmId
 * @property {AzureStorageProfile} storageProfile
 */

/**
 * @typedef {Object} UserAssignedIdentity
 * @property {string} clientId
 * @property {string} principalId
 */

/**
 * @typedef {Object} AzureVirtualMachineIdentity
 * @property {string} principalId
 * @property {string} tenantId
 * @property {string} type
 * @property {Object.<string,UserAssignedIdentity>} userAssignedIdentities
 */

/**
 * @typedef {Object} AzureVirtualMachine
 * @property {AzureVirtualMachineProperties} properties
 * @property {string} tenantId
 * @property {string} name
 * @property {string} id
 * @property {string} resourceGroupId
 * @property {string} principalId
 * @property {AzureVirtualMachineIdentity} identity
 */

/**
 * @typedef {Object} AzureVirtualMachineAdminLogin
 * @property {string} virtualMachineId
 * @property {AzureRoleAssignment} adminLogin
 */

/**
 * @typedef {Object} AzureVirtualMachineAdminLogins
 * @property {string} virtualMachineId
 * @property {Array.<AzureVirtualMachineAdminLogin>} adminLogins
 */

/**
 * @typedef {Object} AzureVirtualMachineAvereContributor
 * @property {string} virtualMachineId
 * @property {AzureRoleAssignment} avereContributor
 */

/**
 * @typedef {Object} AzureVirtualMachineAvereContributors
 * @property {string} virtualMachineId
 * @property {Array.<AzureVirtualMachineAvereContributor>} avereContributors
 */

/**
 * @typedef {Object} AzureVirtualMachineContributor
 * @property {string} virtualMachineId
 * @property {AzureRoleAssignment} contributor
 */

/**
 * @typedef {Object} AzureVirtualMachineContributors
 * @property {string} virtualMachineId
 * @property {Array.<AzureVirtualMachineContributor>} contributors
 */

/**
 * @typedef {Object} AzureVirtualMachineOwner
 * @property {string} virtualMachineId
 * @property {AzureRoleAssignment} owner
 */

/**
 * @typedef {Object} AzureVirtualMachineOwners
 * @property {string} virtualMachineId
 * @property {Array.<AzureVirtualMachineOwner>} owners
 */

/**
 * @typedef {Object} AzureVirtualUserAccessAdmin
 * @property {string} virtualMachineId
 * @property {AzureRoleAssignment} userAccessAdmin
 */

/**
 * @typedef {Object} AzureVirtualUserAccessAdmins
 * @property {string} virtualMachineId
 * @property {Array.<AzureVirtualUserAccessAdmin>} userAccessAdmins
 */

/**
 * @typedef {Object} RelPropWrapper
 * @property {string} Statement
 * @property {Array.<RelProp>} Props
 */

/**
 * @typedef {Object} NodePropWrapper
 * @property {string} Statement
 * @property {Array.<NodeProp>} Props
 */

/**
 * @typedef {Object} NodeProp
 * @property {string} objectid
 * @property {object} map
 */

/**
 * @typedef {Object} RelProp
 * @property {string} source
 * @property {string} target
 */

/**
 * @typedef {Object} AzureIngestionData
 * @property {Object.<string, NodePropWrapper>} AzurePropertyMaps
 * @property {Object.<string, NodePropWrapper>} OnPremPropertyMaps
 * @property {Object.<string, RelPropWrapper>} RelPropertyMaps
 */

/**
 * @typedef {Object} FormatProps
 * @property {string} SourceLabel
 * @property {string} TargetLabel
 * @property {string} EdgeLabel
 * @property {string} EdgeProps
 */
