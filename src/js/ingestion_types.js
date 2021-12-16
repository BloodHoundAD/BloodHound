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
 * @property {string} TrustDirection
 * @property {string} TrustType
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