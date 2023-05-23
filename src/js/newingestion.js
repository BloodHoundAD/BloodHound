import { groupBy } from 'lodash/collection';

const TRUST_DIRECTION_INBOUND = 'Inbound';
const TRUST_DIRECTION_OUTBOUND = 'Outbound';
const TRUST_DIRECTION_BIDIRECTIONAL = 'Bidirectional';

const PROP_QUERY =
    'UNWIND $props AS prop MERGE (n:Base {objectid:prop.objectid}) SET n:{} SET n += prop.map';
const AZURE_PROP_QUERY =
    'UNWIND $props AS prop MERGE (n:AZBase {objectid:prop.objectid}) SET n:{} SET n += prop.map';
const NON_ACL_PROPS = '{isacl:false}';

const GROUP_OBJECT_TYPE = 'ObjectType';
const GROUP_SERVICE = 'Service';

export const ADLabels = {
    Base: 'Base',
    Group: 'Group',
    User: 'User',
    Computer: 'Computer',
    OU: 'OU',
    GPO: 'GPO',
    Domain: 'Domain',
    Container: 'Container',
    MemberOf: 'MemberOf',
    AllowedToDelegate: 'AllowedToDelegate',
    AllowedToAct: 'AllowedToAct',
    HasSession: 'HasSession',
    AdminTo: 'AdminTo',
    CanRDP: 'CanRDP',
    ExecuteDCOM: 'ExecuteDCOM',
    CanPSRemote: 'CanPSRemote',
    HasSIDHistory: 'HasSIDHistory',
    Contains: 'Contains',
    GPLink: 'GPLink',
    TrustedBy: 'TrustedBy',
    DumpSMSAPassword: 'DumpSMSAPassword',
};

const TrustDirections =
{
    0: "Disabled",
    1: "Inbound",
    2: "Outbound",
    3: "Bidirectional"
}

const TrustTypes =
{
    0: "ParentChild",
    1: "CrossLink",
    2: "Forest",
    3: "External"
}

const AzureApplicationAdministratorRoleId =
    '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3';
const AzureCloudApplicationAdministratorRoleId =
    '158c047a-c907-4556-b7ef-446551a6b5f7';

export const AzureLabels = {
    Base: 'AZBase',
    App: 'AZApp',
    Tenant: 'AZTenant',
    Contains: 'AZContains',
    User: 'AZUser',
    Device: 'AZDevice',
    Group: 'AZGroup',
    ServicePrincipal: 'AZServicePrincipal',
    Owns: 'AZOwns',
    MemberOf: 'AZMemberOf',
    WebApp: 'AZWebApp',
    ContainerRegistry: 'AZContainerRegistry',
    AutomationAccount: 'AZAutomationAccount',
    LogicApp: 'AZLogicApp',
    FunctionApp: 'AZFunctionApp',
    ManagedCluster: 'AZManagedCluster',
    NodeResourceGroup: 'AZNodeResourceGroup',
    VMScaleSet: 'AZVMScaleSet',
    KeyVault: 'AZKeyVault',
    KVContributor: 'AZKeyVaultKVContributor',
    ResourceGroup: 'AZResourceGroup',
    GetCertificates: 'AZGetCertificates',
    GetKeys: 'AZGetKeys',
    GetSecrets: 'AZGetSecrets',
    Contributor: 'AZContributor',
    UserAccessAdministrator: 'AZUserAccessAdministrator',
    ManagementGroup: 'AZManagementGroup',
    Subscription: 'AZSubscription',
    Role: 'AZRole',
    HasRole: 'AZHasRole',
    AppAdmin: 'AZAppAdmin',
    CloudAppAdmin: 'AZCloudAppAdmin',
    RunsAs: 'AZRunsAs',
    VirtualMachine: 'AZVM',
    ManagedIdentity: 'AZManagedIdentity',
    AdminLogin: 'AZVMAdminLogin',
    AvereContributor: 'AZAvereContributor',
    VMContributor: 'AZVMContributor',
    AddSecret: 'AZAddSecret',
    AddOwner: 'AZAddOwner',
    ExecuteCommand: 'AZExecuteCommand',
    ResetPassword: 'AZResetPassword',
    AddMembers: 'AZAddMembers',
    GlobalAdmin: 'AZGlobalAdmin',
    PrivilegedRoleAdmin: 'AZPrivilegedRoleAdmin',
    PrivilegedAuthAdmin: 'AZPrivilegedAuthAdmin',
    ApplicationReadWriteAll: 'AZMGApplication_ReadWrite_All',
    AppRoleAssignmentReadWriteAll: 'AZMGAppRoleAssignment_ReadWrite_All',
    DirectoryReadWriteAll: 'AZMGDirectory_ReadWrite_All',
    GroupReadWriteAll: 'AZMGGroup_ReadWrite_All',
    GroupMemberReadWriteAll: 'AZMGGroupMember_ReadWrite_All',
    RoleManagementReadWriteDirectory: 'AZMGRoleManagement_ReadWrite_Directory',
    ServicePrincipalEndpointReadWriteAll: 'AZMGServicePrincipalEndpoint_ReadWrite_All',
    MGAddSecret: 'AZMGAddSecret',
    MGAddOwner: 'AZMGAddOwner',
    MGAddMember: 'AZMGAddMember',
    MGGrantAppRoles: 'AZMGGrantAppRoles',
    MGGrantRole: 'AZMGGrantRole',
    WebsiteContributor: 'AZWebsiteContributor',
    LogicAppContributor: 'AZLogicAppContributor',
    AutomationContributor: 'AZAutomationContributor',
    AKSContributor: 'AZAKSContributor'
};

const AzurehoundKindLabels = {
    KindAZApp: 'AZApp',
    KindAZAppMember: 'AZAppMember',
    KindAZAppOwner: 'AZAppOwner',
    KindAZAppRoleAssignment: 'AZAppRoleAssignment',
    KindAZDevice: 'AZDevice',
    KindAZDeviceOwner: 'AZDeviceOwner',
    KindAZGroup: 'AZGroup',
    KindAZGroupMember: 'AZGroupMember',
    KindAZGroupOwner: 'AZGroupOwner',
    KindAZContainerRegistry: 'AZContainerRegistry',
    KindAZContainerRegistryRoleAssignment: 'AZContainerRegistryRoleAssignment',
    KindAZFunctionApp: 'AZFunctionApp',
    KindAZFunctionAppRoleAssignment: 'AZFunctionAppRoleAssignment',
    KindAZLogicApp: 'AZLogicApp',
    KindAZLogicAppRoleAssignment: 'AZLogicAppRoleAssignment',
    KindAZAutomationAccount: 'AZAutomationAccount',
    KindAZAutomationAccountRoleAssignment: 'AZAutomationAccountRoleAssignment',
    KindAZWebApp: 'AZWebApp',
    KindAZWebAppRoleAssignment: 'AZWebAppRoleAssignment',
    KindAZManagedCluster: 'AZManagedCluster',
    KindAZManagedClusterRoleAssignment: 'AZManagedClusterRoleAssignment',
    KindAZVMScaleSet: 'AZVMScaleSet',
    KindAZVMScaleSetRoleAssignment: 'AZVMScaleSetRoleAssignment',
    KindAZKeyVault: 'AZKeyVault',
    KindAZKeyVaultAccessPolicy: 'AZKeyVaultAccessPolicy',
    KindAZKeyVaultContributor: 'AZKeyVaultContributor',
    KindAZKeyVaultKVContributor: 'AZKeyVaultKVContributor',
    KindAZKeyVaultOwner: 'AZKeyVaultOwner',
    KindAZKeyVaultUserAccessAdmin: 'AZKeyVaultUserAccessAdmin',
    KindAZManagementGroup: 'AZManagementGroup',
    KindAZManagementGroupOwner: 'AZManagementGroupOwner',
    KindAZManagementGroupDescendant: 'AZManagementGroupDescendant',
    KindAZManagementGroupUserAccessAdmin: 'AZManagementGroupUserAccessAdmin',
    KindAZResourceGroup: 'AZResourceGroup',
    KindAZResourceGroupOwner: 'AZResourceGroupOwner',
    KindAZResourceGroupUserAccessAdmin: 'AZResourceGroupUserAccessAdmin',
    KindAZRole: 'AZRole',
    KindAZRoleAssignment: 'AZRoleAssignment',
    KindAZServicePrincipal: 'AZServicePrincipal',
    KindAZServicePrincipalOwner: 'AZServicePrincipalOwner',
    KindAZSubscription: 'AZSubscription',
    KindAZSubscriptionOwner: 'AZSubscriptionOwner',
    KindAZSubscriptionUserAccessAdmin: 'AZSubscriptionUserAccessAdmin',
    KindAZTenant: 'AZTenant',
    KindAZUser: 'AZUser',
    KindAZVM: 'AZVM',
    KindAZVMAdminLogin: 'AZVMAdminLogin',
    KindAZVMAvereContributor: 'AZVMAvereContributor',
    KindAZVMContributor: 'AZVMContributor',
    KindAZVMOwner: 'AZVMOwner',
    KindAZVMUserAccessAdmin: 'AZVMUserAccessAdmin',
};

const DirectoryObjectEntityTypes = {
    User: '#microsoft.graph.user',
    Device: '#microsoft.graph.device',
    Group: '#microsoft.graph.group',
    ServicePrincipal: '#microsoft.graph.servicePrincipal',
};

/**
 *
 * @param {Array.<Group>} chunk
 * @returns {{}}
 */
export function buildGroupJsonNew(chunk) {
    let queries = {};
    queries.properties = {};
    queries.properties.statement = PROP_QUERY.format(ADLabels.Group);
    queries.properties.props = [];

    for (let group of chunk) {
        let properties = group.Properties;
        let identifier = group.ObjectIdentifier;
        let aces = group.Aces;
        let members = group.Members;

        queries.properties.props.push({
            objectid: identifier,
            map: properties,
        });

        processAceArrayNew(aces, identifier, ADLabels.Group, queries);

        let format = ['', ADLabels.Group, ADLabels.MemberOf, NON_ACL_PROPS];

        let grouped = groupBy(members, GROUP_OBJECT_TYPE);

        for (let objectType in grouped) {
            format[0] = objectType;
            let props = grouped[objectType].map((member) => {
                return { source: member.ObjectIdentifier, target: identifier };
            });

            insertNew(queries, format, props);
        }
    }
    return queries;
}

/**
 *
 * @param {Array.<Computer>} chunk
 * @returns {{}}
 */
export function buildComputerJsonNew(chunk) {
    let queries = {};
    queries.properties = {};
    queries.properties.statement = PROP_QUERY.format(ADLabels.Computer);
    queries.properties.props = [];

    for (let computer of chunk) {
        let identifier = computer.ObjectIdentifier;
        let properties = computer.Properties;
        let localAdmins = computer.LocalAdmins.Results;
        let rdp = computer.RemoteDesktopUsers.Results;
        let dcom = computer.DcomUsers.Results;
        let psremote = computer.PSRemoteUsers.Results;
        let primaryGroup = computer.PrimaryGroupSID;
        let allowedToAct = computer.AllowedToAct;
        let allowedToDelegate = computer.AllowedToDelegate;
        let sessions = computer.Sessions.Results;
        let privSessions = computer.PrivilegedSessions.Results;
        let regSessions = computer.RegistrySessions.Results;
        let aces = computer.Aces;
        let dumpSMSAPassword = computer.DumpSMSAPassword;

        queries.properties.props.push({
            objectid: identifier,
            map: properties,
        });

        processAceArrayNew(aces, identifier, ADLabels.Computer, queries);

        let format = [
            ADLabels.Computer,
            ADLabels.Group,
            ADLabels.MemberOf,
            NON_ACL_PROPS,
        ];
        if (primaryGroup !== null) {
            insertNew(queries, format, {
                source: identifier,
                target: primaryGroup,
            });
        }

        format = [
            ADLabels.Computer,
            ADLabels.Computer,
            ADLabels.AllowedToDelegate,
            NON_ACL_PROPS,
        ];

        let props = allowedToDelegate.map((delegate) => {
            return { source: identifier, target: delegate.ObjectIdentifier };
        });

        insertNew(queries, format, props);

        format = ['', ADLabels.Computer, ADLabels.AllowedToAct, NON_ACL_PROPS];
        let grouped = groupBy(allowedToAct, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return {
                    source: principal.ObjectIdentifier,
                    target: identifier,
                };
            });
            insertNew(queries, format, props);
        }

        format = [
            ADLabels.Computer,
            ADLabels.User,
            ADLabels.DumpSMSAPassword,
            NON_ACL_PROPS,
        ];

        if (dumpSMSAPassword === undefined)
            dumpSMSAPassword = [];

        props = dumpSMSAPassword.map((principal) => {
            return { source: identifier, target: principal.ObjectIdentifier };
        });

        insertNew(queries, format, props);

        format = [
            ADLabels.Computer,
            ADLabels.User,
            ADLabels.HasSession,
            '{isacl:false, source:"netsessionenum"}',
        ];
        props = sessions.map((session) => {
            return { source: session.ComputerSID, target: session.UserSID };
        });
        insertNew(queries, format, props);

        format = [
            ADLabels.Computer,
            ADLabels.User,
            ADLabels.HasSession,
            '{isacl:false, source:"netwkstauserenum"}',
        ];
        props = privSessions.map((session) => {
            return { source: session.ComputerSID, target: session.UserSID };
        });
        insertNew(queries, format, props);

        format = [
            ADLabels.Computer,
            ADLabels.User,
            ADLabels.HasSession,
            '{isacl:false, source:"registry"}',
        ];
        props = regSessions.map((session) => {
            return { source: session.ComputerSID, target: session.UserSID };
        });
        insertNew(queries, format, props);

        format = [
            '',
            ADLabels.Computer,
            ADLabels.AdminTo,
            '{isacl:false, fromgpo: false}',
        ];
        grouped = groupBy(localAdmins, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return {
                    source: principal.ObjectIdentifier,
                    target: identifier,
                };
            });
            insertNew(queries, format, props);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.CanRDP,
            '{isacl:false, fromgpo: false}',
        ];
        grouped = groupBy(rdp, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return {
                    source: principal.ObjectIdentifier,
                    target: identifier,
                };
            });
            insertNew(queries, format, props);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.ExecuteDCOM,
            '{isacl:false, fromgpo: false}',
        ];
        grouped = groupBy(dcom, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return {
                    source: principal.ObjectIdentifier,
                    target: identifier,
                };
            });
            insertNew(queries, format, props);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.CanPSRemote,
            '{isacl:false, fromgpo: false}',
        ];
        grouped = groupBy(psremote || [], GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return {
                    source: principal.ObjectIdentifier,
                    target: identifier,
                };
            });
            insertNew(queries, format, props);
        }
    }
    return queries;
}

/**
 *
 * @param {Array.<User>}chunk
 * @return {{}}
 */
export function buildUserJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement: PROP_QUERY.format(ADLabels.User),
        props: [],
    };

    for (let user of chunk) {
        let properties = user.Properties;
        let identifier = user.ObjectIdentifier;
        let primaryGroup = user.PrimaryGroupSID;
        let allowedToDelegate = user.AllowedToDelegate;
        let spnTargets = user.SPNTargets;
        let sidHistory = user.HasSIDHistory;
        let aces = user.Aces;

        processAceArrayNew(aces, identifier, ADLabels.User, queries);

        queries.properties.props.push({
            objectid: identifier,
            map: properties,
        });

        let format = [
            ADLabels.User,
            ADLabels.Group,
            ADLabels.MemberOf,
            NON_ACL_PROPS,
        ];
        if (primaryGroup !== null) {
            insertNew(queries, format, {
                source: identifier,
                target: primaryGroup,
            });
        }

        format = [
            ADLabels.User,
            ADLabels.Computer,
            ADLabels.AllowedToDelegate,
            NON_ACL_PROPS,
        ];
        let props = allowedToDelegate.map((principal) => {
            return { source: identifier, target: principal.ObjectIdentifier };
        });

        insertNew(queries, format, props);

        format = [ADLabels.User, '', ADLabels.HasSIDHistory, NON_ACL_PROPS];
        let grouped = groupBy(sidHistory, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[1] = objectType;
            props = grouped[objectType].map((principal) => {
                return {
                    source: identifier,
                    target: principal.ObjectIdentifier,
                };
            });

            insertNew(queries, format, props);
        }

        processSPNTargetArrayNew(spnTargets, identifier, queries);
    }
    return queries;
}

/**
 * @param {Array.<IngestBase>} chunk
 * @return {{}}
 */
export function buildGpoJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement: PROP_QUERY.format(ADLabels.GPO),
        props: [],
    };

    for (let gpo of chunk) {
        let identifier = gpo.ObjectIdentifier;
        let aces = gpo.Aces;
        let properties = gpo.Properties;

        queries.properties.props.push({
            objectid: identifier,
            map: properties,
        });
        processAceArrayNew(aces, identifier, ADLabels.GPO, queries);
    }

    return queries;
}

/**
 *
 * @param {Array.<Container>} chunk
 */
export function buildContainerJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement: PROP_QUERY.format(ADLabels.Container),
        props: [],
    };

    for (let container of chunk) {
        let identifier = container.ObjectIdentifier;
        let aces = container.Aces;
        let properties = container.Properties;
        let children = container.ChildObjects;

        queries.properties.props.push({
            objectid: identifier,
            map: properties,
        });
        processAceArrayNew(aces, identifier, ADLabels.Container, queries);

        let format = [ADLabels.Container, '', ADLabels.Contains, NON_ACL_PROPS];
        let grouped = groupBy(children, GROUP_OBJECT_TYPE);

        for (let objectType in grouped) {
            format[1] = objectType;
            let props = grouped[objectType].map((child) => {
                return { source: identifier, target: child.ObjectIdentifier };
            });

            insertNew(queries, format, props);
        }
    }

    return queries;
}

/**
 * @param {Array.<OU>} chunk
 * @return {{}}
 */
export function buildOuJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement: PROP_QUERY.format(ADLabels.OU),
        props: [],
    };

    for (let ou of chunk) {
        let properties = ou.Properties;
        let links = ou.Links;
        let children = ou.ChildObjects;

        let identifier = ou.ObjectIdentifier.toUpperCase();
        properties.objectid = identifier;
        let aces = ou.Aces;

        processAceArrayNew(aces, identifier, 'OU', queries);

        queries.properties.props.push({
            objectid: identifier,
            map: properties,
        });

        let format = [ADLabels.OU, '', ADLabels.Contains, NON_ACL_PROPS];
        let grouped = groupBy(children, GROUP_OBJECT_TYPE);

        for (let objectType in grouped) {
            format[1] = objectType;
            let props = grouped[objectType].map((child) => {
                return { source: identifier, target: child.ObjectIdentifier };
            });

            insertNew(queries, format, props);
        }

        format = [
            ADLabels.GPO,
            ADLabels.OU,
            ADLabels.GPLink,
            '{isacl: false, enforced: prop.enforced}',
        ];
        let props = links.map((link) => {
            return {
                source: link.GUID,
                target: identifier,
                enforced: link.IsEnforced,
            };
        });
        insertNew(queries, format, props);

        let computers = ou.GPOChanges.AffectedComputers;

        format = [
            '',
            ADLabels.Computer,
            ADLabels.AdminTo,
            '{isacl: false, fromgpo: true}',
        ];
        grouped = groupBy(ou.GPOChanges.LocalAdmins, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {
                        source: localPrincipal.ObjectIdentifier,
                        target: computer.ObjectIdentifier,
                    };
                });
            });

            insertNew(queries, format, flattened);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.CanRDP,
            '{isacl: false, fromgpo: true}',
        ];
        grouped = groupBy(ou.GPOChanges.RemoteDesktopUsers, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {
                        source: localPrincipal.ObjectIdentifier,
                        target: computer.ObjectIdentifier,
                    };
                });
            });

            insertNew(queries, format, flattened);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.ExecuteDCOM,
            '{isacl: false, fromgpo: true}',
        ];
        grouped = groupBy(ou.GPOChanges.DcomUsers, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {
                        source: localPrincipal.ObjectIdentifier,
                        target: computer.ObjectIdentifier,
                    };
                });
            });

            insertNew(queries, format, flattened);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.CanPSRemote,
            '{isacl: false, fromgpo: true}',
        ];
        grouped = groupBy(ou.GPOChanges.PSRemoteUsers, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {
                        source: localPrincipal.ObjectIdentifier,
                        target: computer.ObjectIdentifier,
                    };
                });
            });

            insertNew(queries, format, flattened);
        }
    }
    return queries;
}

/**
 *
 * @param {Array.<Domain>} chunk
 * @return {{}}
 */
export function buildDomainJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement: PROP_QUERY.format(ADLabels.Domain),
        props: [],
    };

    for (let domain of chunk) {
        let properties = domain.Properties;
        let children = domain.ChildObjects;
        let identifier = domain.ObjectIdentifier;
        let aces = domain.Aces;
        let links = domain.Links;
        let trusts = domain.Trusts;

        processAceArrayNew(aces, identifier, 'Domain', queries);

        queries.properties.props.push({
            objectid: identifier,
            map: properties,
        });

        let format = [ADLabels.Domain, '', ADLabels.Contains, NON_ACL_PROPS];
        let grouped = groupBy(children, GROUP_OBJECT_TYPE);

        for (let objectType in grouped) {
            format[1] = objectType;
            let props = grouped[objectType].map((child) => {
                return { source: identifier, target: child.ObjectIdentifier };
            });

            insertNew(queries, format, props);
        }

        format = [
            ADLabels.GPO,
            ADLabels.Domain,
            ADLabels.GPLink,
            '{isacl: false, enforced: prop.enforced}',
        ];
        let props = links.map((link) => {
            return {
                source: link.GUID,
                target: identifier,
                enforced: link.IsEnforced,
            };
        });
        insertNew(queries, format, props);

        let computers = domain.GPOChanges.AffectedComputers;

        format = [
            '',
            ADLabels.Computer,
            ADLabels.AdminTo,
            '{isacl: false, fromgpo: true}',
        ];
        grouped = groupBy(domain.GPOChanges.LocalAdmins, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {
                        source: localPrincipal.ObjectIdentifier,
                        target: computer.ObjectIdentifier,
                    };
                });
            });

            insertNew(queries, format, flattened);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.CanRDP,
            '{isacl: false, fromgpo: true}',
        ];
        grouped = groupBy(
            domain.GPOChanges.RemoteDesktopUsers,
            GROUP_OBJECT_TYPE
        );
        for (let objectType in grouped) {
            format[0] = objectType;
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {
                        source: localPrincipal.ObjectIdentifier,
                        target: computer.ObjectIdentifier,
                    };
                });
            });

            insertNew(queries, format, flattened);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.ExecuteDCOM,
            '{isacl: false, fromgpo: true}',
        ];
        grouped = groupBy(domain.GPOChanges.DcomUsers, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {
                        source: localPrincipal.ObjectIdentifier,
                        target: computer.ObjectIdentifier,
                    };
                });
            });

            insertNew(queries, format, flattened);
        }

        format = [
            '',
            ADLabels.Computer,
            ADLabels.CanPSRemote,
            '{isacl: false, fromgpo: true}',
        ];
        grouped = groupBy(domain.GPOChanges.PSRemoteUsers, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {
                        source: localPrincipal.ObjectIdentifier,
                        target: computer.ObjectIdentifier,
                    };
                });
            });

            insertNew(queries, format, flattened);
        }

        /*
        "UNWIND $props AS prop MERGE (n:Domain {name: prop.a}) MERGE (m:Domain {name: prop.b}) MERGE (n)-[:TrustedBy {trusttype : prop.trusttype, transitive: prop.transitive, isacl:false}]->(m)",
        */
        format = [
            ADLabels.Domain,
            ADLabels.Domain,
            ADLabels.TrustedBy,
            '{sidfiltering: prop.sidfiltering, trusttype: prop.trusttype, transitive: prop.transitive, isacl: false}',
        ];

        for (let trust of trusts) {

            let direction = "Unknown"
            let trustType = "Unknown"
            if (TrustDirections.hasOwnProperty(trust.TrustDirection)) {
                direction = TrustDirections[trust.TrustDirection];
            }
            if (TrustTypes.hasOwnProperty(trust.TrustType)) {
                trustType = TrustTypes[trust.TrustType];
            }

            let transitive = trust.IsTransitive;
            let target = trust.TargetDomainSid;
            let sidFilter = trust.SidFilteringEnabled;
            let targetName = trust.TargetDomainName;

            queries.properties.props.push({
                objectid: target,
                map: { name: targetName },
            });

            if (
                direction === TRUST_DIRECTION_INBOUND ||
                direction === TRUST_DIRECTION_BIDIRECTIONAL
            ) {
                insertNew(queries, format, {
                    source: identifier,
                    target: target,
                    trusttype: trustType,
                    transitive: transitive,
                    sidfiltering: sidFilter,
                });
            }

            if (
                direction === TRUST_DIRECTION_OUTBOUND ||
                direction === TRUST_DIRECTION_BIDIRECTIONAL
            ) {
                insertNew(queries, format, {
                    source: target,
                    target: identifier,
                    trusttype: trustType,
                    transitive: transitive,
                    sidfiltering: sidFilter,
                });
            }
        }
    }

    return queries;
}

const baseInsertStatement =
    'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:{0} MERGE (m:Base {objectid: prop.target}) SET m:{1} MERGE (n)-[r:{2} {3}]->(m)';

const azureInsertStatement =
    'UNWIND $props AS prop MERGE (n:AZBase {objectid: prop.source}) SET n:{0} MERGE (m:AZBase {objectid: prop.target}) SET m:{1} MERGE (n)-[r:{2} {3}]->(m)';

/**
 * Inserts a query into the queries table
 *
 * @param {*} queries - Query object being built
 * @param {*} formatProps - SourceLabel, TargetLabel, EdgeType, Edge Props
 * @param {*} queryProps - array of query props
 */
function insertNew(queries, formatProps, queryProps) {
    if (formatProps.length < 4) {
        throw new NotEnoughArgumentsException();
    }
    if (queryProps.length === 0) {
        return;
    }

    if (formatProps[0] === 'Unknown') {
        formatProps[0] = 'Base';
    }

    if (formatProps[1] === 'Unknown') {
        formatProps[1] = 'Base';
    }

    let hash = `${formatProps[0]}-${formatProps[1]}-${formatProps[2]}`;
    if (queries[hash]) {
        queries[hash].props = queries[hash].props.concat(queryProps);
    } else {
        queries[hash] = {};
        queries[hash].statement = baseInsertStatement.formatn(...formatProps);
        queries[hash].props = [].concat(queryProps);
    }
}

/**
 *
 * @param {Array.<ACE>} aces
 * @param {string} target_object_identifier
 * @param {string} target_object_type
 * @param {Object} queries
 */
function processAceArrayNew(
    aces,
    target_object_identifier,
    target_object_type,
    queries
) {
    let convertedAces = aces
        .map((ace) => {
            if (ace.PrincipalSID === target_object_identifier) return null;

            return {
                pSid: ace.PrincipalSID,
                right: ace.RightName,
                pType: ace.PrincipalType,
                inherited: ace.IsInherited,
            };
        })
        .filter((cAce) => {
            return cAce != null;
        });

    let rightGrouped = groupBy(convertedAces, 'right');
    let format = [
        '',
        target_object_type,
        '',
        '{isacl: true, isinherited: prop.isinherited}',
    ];

    for (let rightName in rightGrouped) {
        let typeGrouped = groupBy(rightGrouped[rightName], 'pType');
        for (let objectType in typeGrouped) {
            format[0] = objectType;
            format[2] = rightName;
            let mapped = typeGrouped[objectType].map((x) => {
                return {
                    source: x.pSid,
                    target: target_object_identifier,
                    isinherited: x.inherited,
                };
            });
            insertNew(queries, format, mapped);
        }
    }
}

function processSPNTargetArrayNew(
    spnTargets,
    source_object_identifier,
    queries
) {
    let format = [
        ADLabels.User,
        ADLabels.Computer,
        '',
        '{isacl: false, port: prop.port}',
    ];
    let grouped = groupBy(spnTargets, GROUP_SERVICE);
    for (let serviceName in grouped) {
        format[2] = serviceName;
        let props = grouped[serviceName].map((spnTarget) => {
            return {
                source: source_object_identifier,
                target: spnTarget.ComputerSID,
                port: spnTarget.Port,
            };
        });

        insertNew(queries, format, props);
    }
}

/**
 *
 * @param {Array.<AzureBase>} chunk
 */
export function convertAzureData(chunk) {
    let data = {
        AzurePropertyMaps: {},
        OnPremPropertyMaps: {},
        RelPropertyMaps: {},
    };

    for (let item of chunk) {
        switch (item.kind) {
            case AzurehoundKindLabels.KindAZApp:
                convertAzureApp(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZAppOwner:
                convertAzureAppOwner(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZAppRoleAssignment:
                convertAzureAppRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZDevice:
                convertAzureDevice(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZDeviceOwner:
                convertAzureDeviceOwners(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZGroup:
                convertAzureGroup(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZGroupMember:
                convertAzureGroupMembers(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZGroupOwner:
                convertAzureGroupOwners(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZContainerRegistry:
                convertAzureContainerRegistry(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZContainerRegistryRoleAssignment:
                convertAzureContainerRegistryRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZAutomationAccount:
                convertAzureAutomationAccount(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZAutomationAccountRoleAssignment:
                convertAzureAutomationAccountRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZLogicApp:
                convertAzureLogicApp(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZLogicAppRoleAssignment:
                convertAzureLogicAppRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZFunctionApp:
                convertAzureFunctionApp(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZFunctionAppRoleAssignment:
                convertAzureFunctionAppRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZWebApp:
                convertAzureWebApp(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZWebAppRoleAssignment:
                convertAzureWebAppRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZManagedCluster:
                convertAzureManagedCluster(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZManagedClusterRoleAssignment:
                convertAzureManagedClusterRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZVMScaleSet:
                convertAzureVMScaleSet(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZVMScaleSetRoleAssignment:
                convertAzureVMScaleSetRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZKeyVault:
                convertAzureKeyVault(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZKeyVaultAccessPolicy:
                convertAzureKeyVaultAccessPolicy(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZKeyVaultContributor:
                convertAzureKeyVaultContributors(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZKeyVaultKVContributor:
                convertAzureKeyVaultKVContributors(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZKeyVaultOwner:
                convertAzureKeyVaultOwners(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZKeyVaultUserAccessAdmin:
                convertAzureKeyVaultUserAccessAdmins(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZManagementGroup:
                convertAzureManagementGroup(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZManagementGroupOwner:
                convertAzureManagementGroupOwners(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZManagementGroupDescendant:
                convertAzureManagementGroupDescendant(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZManagementGroupUserAccessAdmin:
                convertAzureManagementGroupUserAccessAdmins(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZResourceGroup:
                convertAzureResourceGroup(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZResourceGroupOwner:
                convertAzureResourceGroupOwners(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZResourceGroupUserAccessAdmin:
                convertAzureResourceGroupUserAccessAdmins(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZRole:
                convertAzureRole(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZRoleAssignment:
                convertAzureRoleAssignment(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZServicePrincipal:
                convertAzureServicePrincipal(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZServicePrincipalOwner:
                convertAzureServicePrincipalOwners(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZSubscription:
                convertAzureSubscription(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZSubscriptionOwner:
                convertAzureSubscriptionOwners(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZSubscriptionUserAccessAdmin:
                convertAzureSubscriptionUserAccessAdmins(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZTenant:
                convertAzureTenant(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZUser:
                convertAzureUser(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZVM:
                convertAzureVirtualMachine(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZVMAdminLogin:
                convertAzureVirtualMachineAdminLogins(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZVMAvereContributor:
                convertAzureVirtualMachineAvereContributors(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZVMContributor:
                convertAzureVirtualMachineContributors(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZVMOwner:
                convertAzureVirtualMachineOwners(item.data, data);
                break;
            case AzurehoundKindLabels.KindAZVMUserAccessAdmin:
                convertAzureVirtualMachineUserAccessAdmins(item.data, data);
                break;
            default:
                console.error(`invalid azure type detected: ${item.kind}`);
                break;
        }
    }

    return data;
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureApp} data
 */
export function convertAzureApp(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.App,
        {
            objectid: data.appId.toUpperCase(),
            map: {
                description: data.description,
                displayname: data.displayName,
                whencreated: data.createdDateTime,
                appid: data.appId.toUpperCase(),
                publisherdomain: data.publisherDomain,
                signinaudience: data.signInAudience,
                name: `${data.displayName}@${data.publisherDomain}`.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(AzureLabels.Tenant, AzureLabels.App, AzureLabels.Contains),
        {
            source: data.tenantId.toUpperCase(),
            target: data.appId.toUpperCase(),
        }
    );
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureAppOwners} data
 */
export function convertAzureAppOwner(data, ingestionData) {
    if (data.owners === null) return;
    for (let owner of data.owners) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                getTypeFromDirectoryObject(owner.owner),
                AzureLabels.App,
                AzureLabels.Owns
            ),
            {
                source: owner.owner.id.toUpperCase(),
                target: data.appId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureAppRoleAssignment} data
 */
export function convertAzureAppRoleAssignment(data, ingestionData) {
    if (data.appId !== "00000003-0000-0000-c000-000000000000") return;
    if (data.principalType !== "ServicePrincipal") return;

    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.ServicePrincipal,
        {
            objectid: data.principalId.toUpperCase(),
            map: {
                displayname: data.principalDisplayName.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.ServicePrincipal,
        {
            objectid: data.resourceId.toUpperCase(),
            map: {
                displayname: data.resourceDisplayName.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    if (data.appRoleId.toLowerCase() === "1bfefb4e-e0b5-418b-a88f-73c46d2cc8e9") {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.ServicePrincipal, AzureLabels.ServicePrincipal, AzureLabels.ApplicationReadWriteAll),
            { source: data.principalId.toUpperCase(), target: data.resourceId.toUpperCase() }
        );
    }

    if (data.appRoleId.toLowerCase() === "06b708a9-e830-4db3-a914-8e69da51d44f") {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.ServicePrincipal, AzureLabels.ServicePrincipal, AzureLabels.AppRoleAssignmentReadWriteAll),
            { source: data.principalId.toUpperCase(), target: data.resourceId.toUpperCase() }
        );
    }

    if (data.appRoleId.toLowerCase() === "19dbc75e-c2e2-444c-a770-ec69d8559fc7") {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.ServicePrincipal, AzureLabels.ServicePrincipal, AzureLabels.DirectoryReadWriteAll),
            { source: data.principalId.toUpperCase(), target: data.resourceId.toUpperCase() }
        );
    }

    if (data.appRoleId.toLowerCase() === "62a82d76-70ea-41e2-9197-370581804d09") {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.ServicePrincipal, AzureLabels.ServicePrincipal, AzureLabels.GroupReadWriteAll),
            { source: data.principalId.toUpperCase(), target: data.resourceId.toUpperCase() }
        );
    }

    if (data.appRoleId.toLowerCase() === "dbaae8cf-10b5-4b86-a4a1-f871c94c6695") {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.ServicePrincipal, AzureLabels.ServicePrincipal, AzureLabels.GroupMemberReadWriteAll),
            { source: data.principalId.toUpperCase(), target: data.resourceId.toUpperCase() }
        );
    }

    if (data.appRoleId.toLowerCase() === "9e3f62cf-ca93-4989-b6ce-bf83c28f9fe8") {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.ServicePrincipal, AzureLabels.ServicePrincipal, AzureLabels.RoleManagementReadWriteDirectory),
            { source: data.principalId.toUpperCase(), target: data.resourceId.toUpperCase() }
        );
    }

    if (data.appRoleId.toLowerCase() === "89c8469c-83ad-45f7-8ff2-6e3d4285709e") {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.ServicePrincipal, AzureLabels.ServicePrincipal, AzureLabels.ServicePrincipalEndpointReadWriteAll),
            { source: data.principalId.toUpperCase(), target: data.resourceId.toUpperCase() }
        );
    }
}

/**
 *
 * @param {AzureDevice} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureDevice(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.Device,
        {
            objectid: data.id.toUpperCase(),
            map: {
                deviceid: data.deviceId,
                displayname: data.displayName,
                operatingsystem: data.operatingSystem,
                operatingsystemversion: data.operatingSystemVersion,
                trusttype: data.trustType,
                name: `${data.displayName}@${data.tenantName}`.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
                mdmappid: data.mdmAppId?.toUpperCase() ?? '',
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(AzureLabels.Tenant, AzureLabels.Device, AzureLabels.Contains),
        { source: data.tenantId.toUpperCase(), target: data.id.toUpperCase() }
    );
}

/**
 *
 * @param {AzureDeviceOwners} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureDeviceOwners(data, ingestionData) {
    if (data.owners === null) return;
    for (let owner of data.owners) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                getTypeFromDirectoryObject(owner.owner),
                AzureLabels.Device,
                AzureLabels.Owns
            ),
            {
                source: owner.owner.id.toUpperCase(),
                target: data.deviceId.toUpperCase(),
            }
        );
    }
}

/**
 * @param {AzureGroup} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureGroup(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.Group,
        {
            objectid: data.id.toUpperCase(),
            map: {
                whencreated: data.createdDateTime,
                description: data.description,
                displayname: data.displayName,
                isassignabletorole: data.isAssignableToRole,
                onpremid: data.onPremisesSecurityIdentifier,
                onpremsyncenabled: data.onPremisesSyncEnabled,
                securityenabled: data.securityEnabled,
                securityidentifier: data.securityIdentifier,
                name: `${data.displayName}@${data.tenantName}`.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
                groupTypes: data.groupTypes,
                membershipRule: data.membershipRule,
            },
        },
        false
    );

    if (data.onPremisesSecurityIdentifier) {
        insertNewAzureNodeProp(
            ingestionData,
            ADLabels.Group,
            {
                objectid: data.onPremisesSecurityIdentifier.toUpperCase(),
                map: {},
            },
            true
        );
    }

    insertNewAzureRel(
        ingestionData,
        fProps(AzureLabels.Tenant, AzureLabels.Group, AzureLabels.Contains),
        { source: data.tenantId.toUpperCase(), target: data.id.toUpperCase() }
    );
}

/**
 *
 * @param {AzureGroupMembers} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureGroupMembers(data, ingestionData) {
    if (data.members === null) return;
    for (let member of data.members) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                getTypeFromDirectoryObject(member.member),
                AzureLabels.Group,
                AzureLabels.MemberOf
            ),
            {
                source: member.member.id.toUpperCase(),
                target: data.groupId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureGroupOwners} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureGroupOwners(data, ingestionData) {
    if (data.owners === null) return;
    for (let owner of data.owners) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                getTypeFromDirectoryObject(owner.owner),
                AzureLabels.Group,
                AzureLabels.Owns
            ),
            {
                source: owner.owner.id.toUpperCase(),
                target: owner.groupId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureKeyVault} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureKeyVault(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.KeyVault,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                enablerbacauthorization:
                    data.properties.enableRbacAuthorization,
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.KeyVault,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroup.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );
}

/**
 *
 * @param {AzureContainerRegistry} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureContainerRegistry(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.ContainerRegistry,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.ContainerRegistry,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroupId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );

    if (data.identity.principalId) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.ContainerRegistry,
                AzureLabels.ServicePrincipal,
                AzureLabels.ManagedIdentity
            ),
            {
                source: data.id.toUpperCase(),
                target: data.identity.principalId.toUpperCase(),
            }
        );
    }

    if (data.identity.userAssignedIdentities) {
        for (let key in data.identity.userAssignedIdentities) {
            let user = data.identity.userAssignedIdentities[key];
            if (user.clientId !== '') {
                insertNewAzureRel(
                    ingestionData,
                    fProps(
                        AzureLabels.ContainerRegistry,
                        AzureLabels.ServicePrincipal,
                        AzureLabels.ManagedIdentity
                    ),
                    {
                        source: data.id.toUpperCase(),
                        target: user.principalId.toUpperCase(),
                    }
                );
            }
        }
    }
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureContainerRegistryRoleAssignment} data
 */
export function convertAzureContainerRegistryRoleAssignment(data, ingestionData) {
    if (data.assignees === null) return;
    for (let entry of data.assignees) {
        if (data.objectId.toUpperCase() === entry.assignee.properties.scope.toUpperCase()) {

            if (entry.roleDefinitionId.toLowerCase() === "8e3af657-a8ff-443c-a75c-2fe8c4bcb635") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.ContainerRegistry, AzureLabels.Owns),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "b24988ac-6180-42a0-ab88-20f7382dd24c") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.ContainerRegistry, AzureLabels.Contributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.ContainerRegistry, AzureLabels.UserAccessAdministrator),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

        }
    }
}

/**
 *
 * @param {AzureAutomationAccount} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureAutomationAccount(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.AutomationAccount,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.AutomationAccount,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroupId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );

    if (data.identity.principalId) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.AutomationAccount,
                AzureLabels.ServicePrincipal,
                AzureLabels.ManagedIdentity
            ),
            {
                source: data.id.toUpperCase(),
                target: data.identity.principalId.toUpperCase(),
            }
        );
    }

    if (data.identity.userAssignedIdentities) {
        for (let key in data.identity.userAssignedIdentities) {
            let user = data.identity.userAssignedIdentities[key];
            if (user.clientId !== '') {
                insertNewAzureRel(
                    ingestionData,
                    fProps(
                        AzureLabels.AutomationAccount,
                        AzureLabels.ServicePrincipal,
                        AzureLabels.ManagedIdentity
                    ),
                    {
                        source: data.id.toUpperCase(),
                        target: user.principalId.toUpperCase(),
                    }
                );
            }
        }
    }
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureAutomationAccountRoleAssignment} data
 */
export function convertAzureAutomationAccountRoleAssignment(data, ingestionData) {
    if (data.assignees === null) return;
    for (let entry of data.assignees) {
        if (data.objectId.toUpperCase() === entry.assignee.properties.scope.toUpperCase()) {

            if (entry.roleDefinitionId.toLowerCase() === "8e3af657-a8ff-443c-a75c-2fe8c4bcb635") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.AutomationAccount, AzureLabels.Owns),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "b24988ac-6180-42a0-ab88-20f7382dd24c") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.AutomationAccount, AzureLabels.Contributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.AutomationAccount, AzureLabels.UserAccessAdministrator),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "f353d9bd-d4a6-484e-a77a-8050b599b867") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.AutomationAccount, AzureLabels.AutomationContributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

        }
    }
}

/**
 *
 * @param {AzureLogicApp} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureLogicApp(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.LogicApp,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.LogicApp,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroupId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );

    if (data.identity.principalId) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.LogicApp,
                AzureLabels.ServicePrincipal,
                AzureLabels.ManagedIdentity
            ),
            {
                source: data.id.toUpperCase(),
                target: data.identity.principalId.toUpperCase(),
            }
        );
    }

    if (data.identity.userAssignedIdentities) {
        for (let key in data.identity.userAssignedIdentities) {
            let user = data.identity.userAssignedIdentities[key];
            if (user.clientId !== '') {
                insertNewAzureRel(
                    ingestionData,
                    fProps(
                        AzureLabels.LogicApp,
                        AzureLabels.ServicePrincipal,
                        AzureLabels.ManagedIdentity
                    ),
                    {
                        source: data.id.toUpperCase(),
                        target: user.principalId.toUpperCase(),
                    }
                );
            }
        }
    }
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureLogicAppRoleAssignment} data
 */
export function convertAzureLogicAppRoleAssignment(data, ingestionData) {
    if (data.assignees === null) return;
    for (let entry of data.assignees) {
        if (data.objectId.toUpperCase() === entry.assignee.properties.scope.toUpperCase()) {

            if (entry.roleDefinitionId.toLowerCase() === "8e3af657-a8ff-443c-a75c-2fe8c4bcb635") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.LogicApp, AzureLabels.Owns),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "b24988ac-6180-42a0-ab88-20f7382dd24c") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.LogicApp, AzureLabels.Contributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.LogicApp, AzureLabels.UserAccessAdministrator),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "87a39d53-fc1b-424a-814c-f7e04687dc9e") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.LogicApp, AzureLabels.LogicAppContributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

        }
    }
}

/**
 *
 * @param {AzureFunctionApp} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureFunctionApp(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.FunctionApp,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.FunctionApp,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroupId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );

    if (data.identity.principalId) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.FunctionApp,
                AzureLabels.ServicePrincipal,
                AzureLabels.ManagedIdentity
            ),
            {
                source: data.id.toUpperCase(),
                target: data.identity.principalId.toUpperCase(),
            }
        );
    }

    if (data.identity.userAssignedIdentities) {
        for (let key in data.identity.userAssignedIdentities) {
            let user = data.identity.userAssignedIdentities[key];
            if (user.clientId !== '') {
                insertNewAzureRel(
                    ingestionData,
                    fProps(
                        AzureLabels.FunctionApp,
                        AzureLabels.ServicePrincipal,
                        AzureLabels.ManagedIdentity
                    ),
                    {
                        source: data.id.toUpperCase(),
                        target: user.principalId.toUpperCase(),
                    }
                );
            }
        }
    }
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureFunctionAppRoleAssignment} data
 */
export function convertAzureFunctionAppRoleAssignment(data, ingestionData) {
    if (data.assignees === null) return;
    for (let entry of data.assignees) {
        if (data.objectId.toUpperCase() === entry.assignee.properties.scope.toUpperCase()) {

            if (entry.roleDefinitionId.toLowerCase() === "8e3af657-a8ff-443c-a75c-2fe8c4bcb635") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.FunctionApp, AzureLabels.Owns),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "b24988ac-6180-42a0-ab88-20f7382dd24c") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.FunctionApp, AzureLabels.Contributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.FunctionApp, AzureLabels.UserAccessAdministrator),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "de139f84-1756-47ae-9be6-808fbbe84772") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.FunctionApp, AzureLabels.WebsiteContributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

        }
    }
}

/**
 *
 * @param {AzureWebApp} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureWebApp(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.WebApp,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.WebApp,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroupId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );

    if (data.identity.principalId) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.WebApp,
                AzureLabels.ServicePrincipal,
                AzureLabels.ManagedIdentity
            ),
            {
                source: data.id.toUpperCase(),
                target: data.identity.principalId.toUpperCase(),
            }
        );
    }

    if (data.identity.userAssignedIdentities) {
        for (let key in data.identity.userAssignedIdentities) {
            let user = data.identity.userAssignedIdentities[key];
            if (user.clientId !== '') {
                insertNewAzureRel(
                    ingestionData,
                    fProps(
                        AzureLabels.WebApp,
                        AzureLabels.ServicePrincipal,
                        AzureLabels.ManagedIdentity
                    ),
                    {
                        source: data.id.toUpperCase(),
                        target: user.principalId.toUpperCase(),
                    }
                );
            }
        }
    }
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureWebAppRoleAssignment} data
 */
export function convertAzureWebAppRoleAssignment(data, ingestionData) {
    if (data.assignees === null) return;
    for (let entry of data.assignees) {
        if (data.objectId.toUpperCase() === entry.assignee.properties.scope.toUpperCase()) {

            if (entry.roleDefinitionId.toLowerCase() === "8e3af657-a8ff-443c-a75c-2fe8c4bcb635") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.WebApp, AzureLabels.Owns),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "b24988ac-6180-42a0-ab88-20f7382dd24c") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.WebApp, AzureLabels.Contributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.WebApp, AzureLabels.UserAccessAdministrator),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "de139f84-1756-47ae-9be6-808fbbe84772") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.WebApp, AzureLabels.WebsiteContributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

        }
    }
}

/**
 *
 * @param {AzureManagedCluster} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureManagedCluster(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.ManagedCluster,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.ManagedCluster,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroupId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );

    let NodeResourceGroupID = "/SUBSCRIPTIONS/" + data.subscriptionId.toUpperCase() + "/RESOURCEGROUPS/" + data.properties.nodeResourceGroup.toUpperCase()
    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ManagedCluster,
            AzureLabels.ResourceGroup,
            AzureLabels.NodeResourceGroup
        ),
        {
            target: NodeResourceGroupID.toUpperCase(),
            source: data.id.toUpperCase(),
        }
    );

    //Todo: Create edge from ManagedCluster to VMSS resource group 
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureManagedClusterRoleAssignment} data
 */
export function convertAzureManagedClusterRoleAssignment(data, ingestionData) {
    if (data.assignees === null) return;
    for (let entry of data.assignees) {
        if (data.objectId.toUpperCase() === entry.assignee.properties.scope.toUpperCase()) {

            if (entry.roleDefinitionId.toLowerCase() === "8e3af657-a8ff-443c-a75c-2fe8c4bcb635") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.ManagedCluster, AzureLabels.Owns),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "b24988ac-6180-42a0-ab88-20f7382dd24c") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.ManagedCluster, AzureLabels.Contributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.ManagedCluster, AzureLabels.UserAccessAdministrator),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "ed7f3fbd-7b88-4dd4-9017-9adb7ce333f8") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.ManagedCluster, AzureLabels.AKSContributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

        }
    }
}

/**
 *
 * @param {AzureVMScaleSet} data
 * @param {AzureIngestionData} ingestionData
 */
export function convertAzureVMScaleSet(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.VMScaleSet,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.VMScaleSet,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroupId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );

    if (data.identity.principalId) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.VMScaleSet,
                AzureLabels.ServicePrincipal,
                AzureLabels.ManagedIdentity
            ),
            {
                source: data.id.toUpperCase(),
                target: data.identity.principalId.toUpperCase(),
            }
        );
    }

    if (data.identity.userAssignedIdentities) {
        for (let key in data.identity.userAssignedIdentities) {
            let user = data.identity.userAssignedIdentities[key];
            if (user.clientId !== '') {
                insertNewAzureRel(
                    ingestionData,
                    fProps(
                        AzureLabels.VMScaleSet,
                        AzureLabels.ServicePrincipal,
                        AzureLabels.ManagedIdentity
                    ),
                    {
                        source: data.id.toUpperCase(),
                        target: user.principalId.toUpperCase(),
                    }
                );
            }
        }
    }
}

/**
 *
 * @param {AzureIngestionData} ingestionData
 * @param {AzureVMScaleSetRoleAssignment} data
 */
export function convertAzureVMScaleSetRoleAssignment(data, ingestionData) {
    if (data.assignees === null) return;
    for (let entry of data.assignees) {
        if (data.objectId.toUpperCase() === entry.assignee.properties.scope.toUpperCase()) {

            if (entry.roleDefinitionId.toLowerCase() === "8e3af657-a8ff-443c-a75c-2fe8c4bcb635") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.VMScaleSet, AzureLabels.Owns),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "b24988ac-6180-42a0-ab88-20f7382dd24c") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.VMScaleSet, AzureLabels.Contributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "18d7d88d-d35e-4fb5-a5c3-7773c20a72d9") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.VMScaleSet, AzureLabels.UserAccessAdministrator),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

            if (entry.roleDefinitionId.toLowerCase() === "9980e02c-c2be-4d73-94e8-173b1dc7cf3c") {
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.VMScaleSet, AzureLabels.VMContributor),
                    { source: entry.assignee.properties.principalId.toUpperCase(), target: data.objectId.toUpperCase() }
                );
            }

        }
    }
}

/**
 *
 * @param {AzureKeyVaultAccessPolicy} data
 * @param ingestionData
 */
export function convertAzureKeyVaultAccessPolicy(data, ingestionData) {
    const get = (ele) => ele === 'Get';
    if (data.permissions.keys !== null && data.permissions.keys.some(get)) {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.Base, AzureLabels.KeyVault, AzureLabels.GetKeys),
            {
                source: data.objectId.toUpperCase(),
                target: data.keyVaultId.toUpperCase(),
            }
        );
    }

    if (
        data.permissions.secrets !== null &&
        data.permissions.secrets.some(get)
    ) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.Base,
                AzureLabels.KeyVault,
                AzureLabels.GetSecrets
            ),
            {
                source: data.objectId.toUpperCase(),
                target: data.keyVaultId.toUpperCase(),
            }
        );
    }

    if (
        data.permissions.certificates !== null &&
        data.permissions.certificates.some(get)
    ) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.Base,
                AzureLabels.KeyVault,
                AzureLabels.GetCertificates
            ),
            {
                source: data.objectId.toUpperCase(),
                target: data.keyVaultId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureKeyVaultContributors} data
 * @param ingestionData
 */
export function convertAzureKeyVaultContributors(data, ingestionData) {
    if (data.contributors === null) return;
    for (let contributor of data.contributors) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.Base,
                AzureLabels.KeyVault,
                AzureLabels.Contributor
            ),
            {
                source: contributor.contributor.properties.principalId.toUpperCase(),
                target: data.keyVaultId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureKeyVaultKVContributors} data
 * @param ingestionData
 */
export function convertAzureKeyVaultKVContributors(data, ingestionData) {
    if (data.kvContributors === null) return;
    for (let kvContributor of data.kvContributors) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.Base,
                AzureLabels.KeyVault,
                AzureLabels.KVContributor
            ),
            {
                source: kvContributor.kvContributor.properties.principalId.toUpperCase(),
                target: data.keyVaultId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureKeyVaultOwners} data
 * @param ingestionData
 */
export function convertAzureKeyVaultOwners(data, ingestionData) {
    if (data.owners === null) return;
    for (let entry of data.owners) {
        if (data.keyVaultId === entry.owner.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(AzureLabels.Base, AzureLabels.KeyVault, AzureLabels.Owns),
                {
                    source: entry.owner.properties.principalId.toUpperCase(),
                    target: data.keyVaultId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureKeyVaultUserAccessAdmins} data
 * @param ingestionData
 */
export function convertAzureKeyVaultUserAccessAdmins(data, ingestionData) {
    if (data.userAccessAdmins === null) return;
    for (let entry of data.userAccessAdmins) {
        if (data.keyVaultId === entry.userAccessAdmin.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.KeyVault,
                    AzureLabels.UserAccessAdministrator
                ),
                {
                    source: entry.userAccessAdmin.properties.principalId.toUpperCase(),
                    target: data.keyVaultId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureDescendantInfo} data
 * @param ingestionData
 */
export function convertAzureManagementGroupDescendant(data, ingestionData) {
    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ManagementGroup,
            AzureLabels.Base,
            AzureLabels.Contains
        ),
        {
            source: data.properties.parent.id.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );
}

/**
 *
 * @param {AzureManagementGroupOwners} data
 * @param ingestionData
 */
export function convertAzureManagementGroupOwners(data, ingestionData) {
    if (data.owners === null) return;
    for (let entry of data.owners) {
        if (data.managementGroupId === entry.owner.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.ManagementGroup,
                    AzureLabels.Owns
                ),
                {
                    source: entry.owner.properties.principalId.toUpperCase(),
                    target: data.managementGroupId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureManagementGroupUserAccessAdmins} data
 * @param ingestionData
 */
export function convertAzureManagementGroupUserAccessAdmins(
    data,
    ingestionData
) {
    if (data.userAccessAdmins === null) return;
    for (let entry of data.userAccessAdmins) {
        if (data.managementGroupId === entry.userAccessAdmin.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.ManagementGroup,
                    AzureLabels.UserAccessAdministrator
                ),
                {
                    source: entry.userAccessAdmin.properties.principalId.toUpperCase(),
                    target: data.managementGroupId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureManagementGroup} data
 * @param ingestionData
 */
export function convertAzureManagementGroup(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.ManagementGroup,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: `${data.properties.displayName}@${data.tenantName}`.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    if (data.id.toUpperCase().endsWith(data.tenantId.toUpperCase())) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.Tenant,
                AzureLabels.ManagementGroup,
                AzureLabels.Contains
            ),
            {
                source: data.tenantId.toUpperCase(),
                target: data.id.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureResourceGroup} data
 * @param ingestionData
 */
export function convertAzureResourceGroup(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.ResourceGroup,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.Subscription,
            AzureLabels.ResourceGroup,
            AzureLabels.Contains
        ),
        {
            source: data.subscriptionId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );
}

/**
 *
 * @param {AzureResourceGroupOwners} data
 * @param ingestionData
 */
export function convertAzureResourceGroupOwners(data, ingestionData) {
    if (data.owners === null) return;
    for (let entry of data.owners) {
        if (data.resourceGroupId === entry.owner.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.ResourceGroup,
                    AzureLabels.Owns
                ),
                {
                    source: entry.owner.properties.principalId.toUpperCase(),
                    target: data.resourceGroupId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureResourceGroupUserAccessAdmins} data
 * @param ingestionData
 */
export function convertAzureResourceGroupUserAccessAdmins(data, ingestionData) {
    if (data.userAccessAdmins === null) return;
    for (let entry of data.userAccessAdmins) {
        if (data.resourceGroupId === entry.userAccessAdmin.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.ResourceGroup,
                    AzureLabels.UserAccessAdministrator
                ),
                {
                    source: entry.userAccessAdmin.properties.principalId.toUpperCase(),
                    target: data.resourceGroupId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureRole} data
 * @param ingestionData
 */
export function convertAzureRole(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.Role,
        {
            objectid: `${data.id}@${data.tenantId}`.toUpperCase(),
            map: {
                description: data.description,
                displayname: data.displayName,
                isbuiltin: data.isBuiltIn,
                enabled: data.isEnabled,
                templateid: data.templateId.toUpperCase(),
                name: `${data.displayName}@${data.tenantName}`.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(AzureLabels.Tenant, AzureLabels.Role, AzureLabels.Contains),
        {
            source: data.tenantId.toUpperCase(),
            target: `${data.id}@${data.tenantId}`.toUpperCase(),
        }
    );
}

/**
 *
 * @param {AzureRoleAssignments} data
 * @param ingestionData
 */
export function convertAzureRoleAssignment(data, ingestionData) {
    if (data.roleAssignments === null) return;
    for (let roleAssignment of data.roleAssignments) {
        if (canAddSecret(roleAssignment.roleDefinitionId)) {
            if (roleAssignment.directoryScopeId === '/') {
                insertNewAzureRel(
                    ingestionData,
                    fProps(
                        AzureLabels.Base,
                        AzureLabels.Role,
                        AzureLabels.HasRole
                    ),
                    {
                        source: roleAssignment.principalId.toUpperCase(),
                        target: `${roleAssignment.roleDefinitionId}@${data.tenantId}`.toUpperCase(),
                    }
                );
            } else {
                let relType =
                    roleAssignment.roleDefinitionId ===
                        AzureApplicationAdministratorRoleId
                        ? AzureLabels.AppAdmin
                        : AzureLabels.CloudAppAdmin;
                insertNewAzureRel(
                    ingestionData,
                    fProps(AzureLabels.Base, AzureLabels.Base, relType),
                    {
                        source: roleAssignment.principalId.toUpperCase(),
                        target: roleAssignment.directoryScopeId
                            .substring(1)
                            .toUpperCase(),
                    }
                );
            }
        } else {
            insertNewAzureRel(
                ingestionData,
                fProps(AzureLabels.Base, AzureLabels.Role, AzureLabels.HasRole),
                {
                    source: roleAssignment.principalId.toUpperCase(),
                    target: `${roleAssignment.roleDefinitionId}@${data.tenantId}`.toUpperCase(),
                }
            );
        }
    }
}

/*
 *
 * @param {string} roleDefinitionId
*/
export function canAddSecret(roleDefinitionId) {
    return [AzureApplicationAdministratorRoleId, AzureCloudApplicationAdministratorRoleId].indexOf(roleDefinitionId) != -1;
}

/**
 *
 * @param {AzureServicePrincipal} data
 * @param ingestionData
 */
export function convertAzureServicePrincipal(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.ServicePrincipal,
        {
            objectid: data.id.toUpperCase(),
            map: {
                enabled: data.accountEnabled,
                displayname: data.displayName,
                description: data.description,
                appownerorganizationid: data.appOwnerOrganizationId,
                appdescription: data.appDescription,
                appdisplayname: data.appDisplayName,
                serviceprincipaltype: data.servicePrincipalType,
                name: `${data.displayName}@${data.tenantName}`,
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.App,
        {
            objectid: data.appId.toUpperCase(),
            map: {
                displayname: data.appDisplayName,
                tenantid: data.tenantId,
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.App,
            AzureLabels.ServicePrincipal,
            AzureLabels.RunsAs
        ),
        { source: data.appId.toUpperCase(), target: data.id.toUpperCase() }
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.Tenant,
            AzureLabels.ServicePrincipal,
            AzureLabels.Contains
        ),
        { source: data.tenantId.toUpperCase(), target: data.id.toUpperCase() }
    );
}

/**
 *
 * @param {AzureServicePrincipalOwners} data
 * @param ingestionData
 */
export function convertAzureServicePrincipalOwners(data, ingestionData) {
    if (data.owners === null) return;
    for (let owner of data.owners) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                getTypeFromDirectoryObject(owner.owner),
                AzureLabels.ServicePrincipal,
                AzureLabels.Owns
            ),
            {
                source: owner.owner.id.toUpperCase(),
                target: data.servicePrincipalId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureSubscription} data
 * @param ingestionData
 */
export function convertAzureSubscription(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.Subscription,
        {
            objectid: data.id.toUpperCase(),
            map: {
                displayname: data.displayName,
                id: data.subscriptionId,
                name: data.displayName.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    // insertNewAzureRel(
    //     ingestionData,
    //     fProps(
    //         AzureLabels.Tenant,
    //         AzureLabels.Subscription,
    //         AzureLabels.Contains
    //     ),
    //     {source: data.tenantId.toUpperCase(), target: data.id.toUpperCase()}
    // );
}

/**
 *
 * @param {AzureSubscriptionOwners} data
 * @param ingestionData
 */
export function convertAzureSubscriptionOwners(data, ingestionData) {
    if (data.owners === null) return;
    for (let entry of data.owners) {
        if (data.subscriptionId === entry.owner.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.Subscription,
                    AzureLabels.Owns
                ),
                {
                    source: entry.owner.properties.principalId.toUpperCase(),
                    target: data.subscriptionId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureSubscriptionUserAccessAdmins} data
 * @param ingestionData
 */
export function convertAzureSubscriptionUserAccessAdmins(data, ingestionData) {
    if (data.userAccessAdmins === null) return;
    for (let entry of data.userAccessAdmins) {
        if (data.subscriptionId === entry.userAccessAdmin.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.Subscription,
                    AzureLabels.UserAccessAdministrator
                ),
                {
                    source: entry.userAccessAdmin.properties.principalId.toUpperCase(),
                    target: data.subscriptionId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureTenant} data
 * @param ingestionData
 */
export function convertAzureTenant(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.Tenant,
        {
            objectid: data.tenantId.toUpperCase(),
            map: {
                displayname: data.displayName,
                id: data.id,
                name: data.displayName.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );
}

/**
 *
 * @param {AzureUser} data
 * @param ingestionData
 */
export function convertAzureUser(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.User,
        {
            objectid: data.id.toUpperCase(),
            map: {
                enabled: data.accountEnabled,
                whencreated: data.createdDateTime,
                displayname: data.displayName,
                title: data.jobTitle,
                pwdlastset: data.lastPasswordChangeDateTime,
                mail: data.mail,
                onpremisesecurityidentifier: data.onPremisesSecurityIdentifier,
                onpremisesyncenabled: data.onPremisesSyncEnabled,
                userprincipalname: data.userPrincipalName,
                usertype: data.userType,
                name: data.userPrincipalName.toUpperCase(),
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    if (data.onPremisesSecurityIdentifier) {
        insertNewAzureNodeProp(
            ingestionData,
            ADLabels.User,
            {
                objectid: data.onPremisesSecurityIdentifier.toUpperCase(),
                map: {},
            },
            true
        );
    }

    if (!data.userPrincipalName.toUpperCase().includes('#EXT#')) {
        insertNewAzureRel(
            ingestionData,
            fProps(AzureLabels.Tenant, AzureLabels.User, AzureLabels.Contains),
            {
                source: data.tenantId.toUpperCase(),
                target: data.id.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureVirtualMachine} data
 * @param ingestionData
 */
export function convertAzureVirtualMachine(data, ingestionData) {
    insertNewAzureNodeProp(
        ingestionData,
        AzureLabels.VirtualMachine,
        {
            objectid: data.id.toUpperCase(),
            map: {
                name: data.name.toUpperCase(),
                id: data.properties.vmId,
                operatingsystem: data.properties.storageProfile.osDisk.osType,
                tenantid: data.tenantId.toUpperCase(),
            },
        },
        false
    );

    insertNewAzureRel(
        ingestionData,
        fProps(
            AzureLabels.ResourceGroup,
            AzureLabels.VirtualMachine,
            AzureLabels.Contains
        ),
        {
            source: data.resourceGroupId.toUpperCase(),
            target: data.id.toUpperCase(),
        }
    );

    if (data.identity.principalId) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.VirtualMachine,
                AzureLabels.ServicePrincipal,
                AzureLabels.ManagedIdentity
            ),
            {
                source: data.id.toUpperCase(),
                target: data.identity.principalId.toUpperCase(),
            }
        );
    }

    if (data.identity.userAssignedIdentities) {
        for (let key in data.identity.userAssignedIdentities) {
            let user = data.identity.userAssignedIdentities[key];
            if (user.clientId !== '') {
                insertNewAzureRel(
                    ingestionData,
                    fProps(
                        AzureLabels.VirtualMachine,
                        AzureLabels.ServicePrincipal,
                        AzureLabels.ManagedIdentity
                    ),
                    {
                        source: data.id.toUpperCase(),
                        target: user.principalId.toUpperCase(),
                    }
                );
            }
        }
    }
}

/**
 *
 * @param {AzureVirtualMachineAdminLogins} data
 * @param ingestionData
 */
export function convertAzureVirtualMachineAdminLogins(data, ingestionData) {
    if (data.adminLogins === null) return;
    for (let admin of data.adminLogins) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.Base,
                AzureLabels.VirtualMachine,
                AzureLabels.AdminLogin
            ),
            {
                source: admin.adminLogin.properties.principalId.toUpperCase(),
                target: data.virtualMachineId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureVirtualMachineAvereContributors} data
 * @param ingestionData
 */
export function convertAzureVirtualMachineAvereContributors(
    data,
    ingestionData
) {
    if (data.avereContributors === null) return;
    for (let contributor of data.avereContributors) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.Base,
                AzureLabels.VirtualMachine,
                AzureLabels.AvereContributor
            ),
            {
                source: contributor.avereContributor.properties.principalId.toUpperCase(),
                target: data.virtualMachineId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureVirtualMachineContributors} data
 * @param ingestionData
 */
export function convertAzureVirtualMachineContributors(data, ingestionData) {
    if (data.contributors === null) return;
    for (let contributor of data.contributors) {
        insertNewAzureRel(
            ingestionData,
            fProps(
                AzureLabels.Base,
                AzureLabels.VirtualMachine,
                AzureLabels.VMContributor
            ),
            {
                source: contributor.contributor.properties.principalId.toUpperCase(),
                target: data.virtualMachineId.toUpperCase(),
            }
        );
    }
}

/**
 *
 * @param {AzureVirtualMachineOwners} data
 * @param ingestionData
 */
export function convertAzureVirtualMachineOwners(data, ingestionData) {
    if (data.owners === null) return;
    for (let entry of data.owners) {
        if (data.virtualMachineId === entry.owner.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.VirtualMachine,
                    AzureLabels.Owns
                ),
                {
                    source: entry.owner.properties.principalId.toUpperCase(),
                    target: data.virtualMachineId.toUpperCase(),
                }
            );
        }
    }
}

/**
 *
 * @param {AzureVirtualUserAccessAdmins} data
 * @param ingestionData
 */
export function convertAzureVirtualMachineUserAccessAdmins(
    data,
    ingestionData
) {
    if (data.userAccessAdmins === null) return;
    for (let entry of data.userAccessAdmins) {
        if (data.virtualMachineId === entry.userAccessAdmin.properties.scope) {
            insertNewAzureRel(
                ingestionData,
                fProps(
                    AzureLabels.Base,
                    AzureLabels.VirtualMachine,
                    AzureLabels.UserAccessAdministrator
                ),
                {
                    source: entry.userAccessAdmin.properties.principalId.toUpperCase(),
                    target: data.virtualMachineId.toUpperCase(),
                }
            );
        }
    }
}

/**
 * Inserts a query into the azure ingestion table
 *
 * @param {AzureIngestionData} Queries
 * @param {FormatProps} FormatProps
 * @param {RelProp} QueryProps
 */
function insertNewAzureRel(Queries, FormatProps, QueryProps) {
    if (FormatProps.SourceLabel === 'Unknown') {
        FormatProps.SourceLabel = AzureLabels.Base;
    }

    if (FormatProps.TargetLabel === 'Unknown') {
        FormatProps.TargetLabel = AzureLabels.Base;
    }

    let hash = `${FormatProps.SourceLabel}-${FormatProps.TargetLabel}-${FormatProps.EdgeLabel}`;
    if (Queries.RelPropertyMaps[hash]) {
        Queries.RelPropertyMaps[hash].Props.push(QueryProps);
    } else {
        Queries.RelPropertyMaps[hash] = {};
        Queries.RelPropertyMaps[hash].Statement = azureInsertStatement.formatn(
            FormatProps.SourceLabel,
            FormatProps.TargetLabel,
            FormatProps.EdgeLabel,
            FormatProps.EdgeProps
        );
        Queries.RelPropertyMaps[hash].Props = [];
        Queries.RelPropertyMaps[hash].Props.push(QueryProps);
    }
}

/**
 * Inserts a query into the azure ingestion table
 *
 * @param {AzureIngestionData} Queries
 * @param {string} Type
 * @param {NodeProp} QueryProp
 * @param {boolean} OnPrem
 *
 */
function insertNewAzureNodeProp(Queries, Type, QueryProp, OnPrem) {
    if (OnPrem) {
        if (Queries.OnPremPropertyMaps[Type]) {
            Queries.OnPremPropertyMaps[Type].Props.push(QueryProp);
        } else {
            Queries.OnPremPropertyMaps[Type] = {};
            Queries.OnPremPropertyMaps[Type].Statement =
                PROP_QUERY.format(Type);
            Queries.OnPremPropertyMaps[Type].Props = [];
            Queries.OnPremPropertyMaps[Type].Props.push(QueryProp);
        }
    } else {
        if (Queries.AzurePropertyMaps[Type]) {
            Queries.AzurePropertyMaps[Type].Props.push(QueryProp);
        } else {
            Queries.AzurePropertyMaps[Type] = {};
            Queries.AzurePropertyMaps[Type].Statement =
                AZURE_PROP_QUERY.format(Type);
            Queries.AzurePropertyMaps[Type].Props = [];
            Queries.AzurePropertyMaps[Type].Props.push(QueryProp);
        }
    }
}

/**
 * Extracts a label from a directoryobject
 *
 * @param {AzureDirectoryObject} directoryObject
 *
 */
function getTypeFromDirectoryObject(directoryObject) {
    switch (directoryObject['@odata.type']) {
        case DirectoryObjectEntityTypes.User:
            return AzureLabels.User;
        case DirectoryObjectEntityTypes.Device:
            return AzureLabels.Device;
        case DirectoryObjectEntityTypes.Group:
            return AzureLabels.Group;
        case DirectoryObjectEntityTypes.ServicePrincipal:
            return AzureLabels.ServicePrincipal;
        default:
            console.error(
                `unexpected entity type: ${directoryObject['@odata.type']}`
            );
            console.log(directoryObject);
            return AzureLabels.Base;
    }
}

/**
 *
 * @param sourceLabel
 * @param targetLabel
 * @param edgeLabel
 * @param edgeProps
 * @returns {FormatProps}
 */
function fProps(sourceLabel, targetLabel, edgeLabel, edgeProps = '') {
    return {
        SourceLabel: sourceLabel,
        TargetLabel: targetLabel,
        EdgeLabel: edgeLabel,
        EdgeProps: '',
    };
}
