import { groupBy } from 'lodash/collection';

const LABEL_GROUP = 'Group'
const LABEL_USER = 'User'
const LABEL_COMPUTER = 'Computer'
const LABEL_OU = 'OU'
const LABEL_GPO = 'GPO'
const LABEL_DOMAIN = 'Domain'
const LABEL_CONTAINER = 'Container'

const EDGE_MEMBER_OF = 'MemberOf'
const EDGE_ALLOWED_TO_DELEGATE = 'AllowedToDelegate'
const EDGE_ALLOWED_TO_ACT = 'AllowedToAct'
const EDGE_HAS_SESSION = 'HasSession'
const EDGE_ADMIN_TO = 'AdminTo'
const EDGE_CAN_RDP = 'CanRDP'
const EDGE_EXECUTE_DCOM = 'ExecuteDCOM'
const EDGE_CAN_PSREMOTE = 'CanPSRemote'
const EDGE_HAS_SID_HISTORY = 'HasSIDHistory'
const EDGE_CONTAINS = 'Contains'
const EDGE_GP_LINK = 'GpLink'
const EDGE_TRUSTED_BY = 'TrustedBy'

const TRUST_DIRECTION_INBOUND = 'Inbound'
const TRUST_DIRECTION_OUTBOUND = 'Outbound'
const TRUST_DIRECTION_BIDIRECTIONAL = 'Bidirectional'

const PROP_QUERY = 'UNWIND $props AS prop MERGE (n:Base {objectid:prop.source}) SET n:{} SET n += prop.map'
const NON_ACL_PROPS = '{isacl:false}'

const GROUP_OBJECT_TYPE = 'ObjectType'
const GROUP_SERVICE = 'Service'

/**
 *
 * @param {Array.<Group>} chunk
 * @returns {{}}
 */
export function buildGroupJsonNew(chunk) {
    let queries = {};
    queries.properties = {};
    queries.properties.statement = PROP_QUERY.format(LABEL_GROUP);
    queries.properties.props = [];

    for (let group of chunk) {
        let properties = group.Properties;
        let identifier = group.ObjectIdentifier;
        let aces = group.Aces;
        let members = group.Members;

        queries.properties.props.push({ source: identifier, map: properties });

        processAceArrayNew(aces, identifier, LABEL_GROUP, queries);

        let format = ['', LABEL_GROUP, EDGE_MEMBER_OF, NON_ACL_PROPS];

        let grouped = groupBy(members, GROUP_OBJECT_TYPE);

        for (let objectType in grouped) {
            format[0] = objectType;
            let props = grouped[objectType]
                .map((member) => {
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
    queries.properties.statement = PROP_QUERY.format(LABEL_COMPUTER);
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

        queries.properties.props.push({ source: identifier, map: properties });

        processAceArrayNew(aces, identifier, LABEL_COMPUTER, queries);

        let format = [LABEL_COMPUTER, LABEL_GROUP, EDGE_MEMBER_OF, NON_ACL_PROPS];
        if (primaryGroup !== null) {
            insertNew(queries, format, {
                source: identifier,
                target: primaryGroup,
            });
        }

        format = [LABEL_COMPUTER, LABEL_COMPUTER, EDGE_ALLOWED_TO_DELEGATE, NON_ACL_PROPS];

        let props = allowedToDelegate.map((delegate) => {
            return { source: identifier, target: delegate };
        });

        insertNew(queries, format, props);

        format = ['', LABEL_COMPUTER, EDGE_ALLOWED_TO_ACT, NON_ACL_PROPS];
        let grouped = groupBy(allowedToAct, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return { source: principal.ObjectIdentifier, target: identifier };
            });
            insertNew(queries, format, props);
        }

        format = [LABEL_COMPUTER, LABEL_USER, EDGE_HAS_SESSION, '{isacl:false, source:"netsessionenum"}'];
        props = sessions.map((session) => {
            return { source: session.ComputerSID, target: session.UserSID };
        });
        insertNew(queries, format, props);

        format = [LABEL_COMPUTER, LABEL_USER, EDGE_HAS_SESSION, '{isacl:false, source:"netwkstauserenum"}'];
        props = privSessions.map((session) => {
            return { source: session.ComputerSID, target: session.UserSID };
        });
        insertNew(queries, format, props);

        format = [LABEL_COMPUTER, LABEL_USER, EDGE_HAS_SESSION, '{isacl:false, source:"registry"}'];
        props = regSessions.map((session) => {
            return { source: session.ComputerSID, target: session.UserSID };
        });
        insertNew(queries, format, props);

        format = ['', LABEL_COMPUTER, EDGE_ADMIN_TO, '{isacl:false, fromgpo: false}'];
        grouped = groupBy(localAdmins, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return { source: principal.ObjectIdentifier, target: identifier };
            });
            insertNew(queries, format, props);
        }

        format = ['', LABEL_COMPUTER, EDGE_CAN_RDP, '{isacl:false, fromgpo: false}'];
        grouped = groupBy(rdp, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return { source: principal.ObjectIdentifier, target: identifier };
            });
            insertNew(queries, format, props);
        }

        format = ['', LABEL_COMPUTER, EDGE_EXECUTE_DCOM, '{isacl:false, fromgpo: false}'];
        grouped = groupBy(dcom, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return { source: principal.ObjectIdentifier, target: identifier };
            });
            insertNew(queries, format, props);
        }

        format = ['', LABEL_COMPUTER, EDGE_CAN_PSREMOTE, '{isacl:false, fromgpo: false}'];
        grouped = groupBy(psremote || [], GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[0] = objectType;
            props = grouped[objectType].map((principal) => {
                return { source: principal.ObjectIdentifier, target: identifier };
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
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:User SET n += prop.map',
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

        processAceArrayNew(aces, identifier, LABEL_USER, queries);

        queries.properties.props.push({
            source: identifier,
            map: properties,
        });

        let format = [LABEL_USER, LABEL_GROUP, EDGE_MEMBER_OF, NON_ACL_PROPS];
        if (primaryGroup !== null) {
            insertNew(queries, format, {
                source: identifier,
                target: primaryGroup,
            });
        }

        format = [LABEL_USER, LABEL_COMPUTER, EDGE_ALLOWED_TO_DELEGATE, NON_ACL_PROPS];
        let props = allowedToDelegate.map((principal) => {
            return { source: identifier, target: principal };
        });

        insertNew(queries, format, props);

        format = [LABEL_USER, '', EDGE_HAS_SID_HISTORY, NON_ACL_PROPS];
        let grouped = groupBy(sidHistory, GROUP_OBJECT_TYPE);
        for (let objectType in grouped) {
            format[1] = objectType;
            props = grouped[objectType].map((principal) => {
                return { source: identifier, target: principal.ObjectIdentifier };
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
        statement:
            PROP_QUERY.format(LABEL_GPO),
        props: [],
    };

    for (let gpo of chunk) {
        let identifier = gpo.ObjectIdentifier;
        let aces = gpo.Aces;
        let properties = gpo.Properties;

        queries.properties.props.push({ source: identifier, map: properties });
        processAceArrayNew(aces, identifier, LABEL_GPO, queries);
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
        statement:
            PROP_QUERY.format(LABEL_CONTAINER),
        props: [],
    };

    for (let container of chunk) {
        let identifier = container.ObjectIdentifier;
        let aces = container.Aces;
        let properties = container.Properties;
        let children = container.ChildObjects

        queries.properties.props.push({ source: identifier, map: properties });
        processAceArrayNew(aces, identifier, LABEL_CONTAINER, queries);

        let format = [LABEL_CONTAINER, '', EDGE_CONTAINS, NON_ACL_PROPS]
        let grouped = groupBy(children, GROUP_OBJECT_TYPE)

        for (let objectType in grouped){
            format[1] = objectType
            let props = grouped[objectType].map((child) => {
                return {source: identifier, target: child.ObjectIdentifier}
            })

            insertNew(queries, format, props)
        }
    }

    return queries
}

/**
 * @param {Array.<OU>} chunk
 * @return {{}}
 */
export function buildOuJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            PROP_QUERY.format(LABEL_OU),
        props: [],
    };

    for (let ou of chunk) {
        let properties = ou.Properties;
        let links = ou.Links;
        let children = ou.ChildObjects

        let identifier = ou.ObjectIdentifier.toUpperCase();
        properties.objectid = identifier;
        let aces = ou.Aces;

        processAceArrayNew(aces, identifier, 'OU', queries);

        queries.properties.props.push({ source: identifier, map: properties });

        let format = [LABEL_OU, '', EDGE_CONTAINS, NON_ACL_PROPS]
        let grouped = groupBy(children, GROUP_OBJECT_TYPE)

        for (let objectType in grouped){
            format[1] = objectType
            let props = grouped[objectType].map((child) => {
                return {source: identifier, target: child.ObjectIdentifier}
            })

            insertNew(queries, format, props)
        }

        format = [LABEL_GPO, LABEL_OU, EDGE_GP_LINK, '{isacl: false, enforced: prop.enforced}'];
        let props = links.map((link) => {
            return {
                source: link.GUID,
                target: identifier,
                enforced: link.IsEnforced,
            };
        });
        insertNew(queries, format, props);

        let computers = ou.GPOChanges.AffectedComputers;

        format = ['', LABEL_COMPUTER, EDGE_ADMIN_TO, '{isacl: false, fromgpo: true}']
        grouped = groupBy(ou.GPOChanges.LocalAdmins, GROUP_OBJECT_TYPE)
        for (let objectType in grouped){
            format[0] = objectType
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {source: localPrincipal.ObjectIdentifier, target: computer.ObjectIdentifier}
                })
            })

            insertNew(queries, format, flattened)
        }

        format = ['', LABEL_COMPUTER, EDGE_CAN_RDP, '{isacl: false, fromgpo: true}']
        grouped = groupBy(ou.GPOChanges.RemoteDesktopUsers, GROUP_OBJECT_TYPE)
        for (let objectType in grouped){
            format[0] = objectType
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {source: localPrincipal.ObjectIdentifier, target: computer.ObjectIdentifier}
                })
            })

            insertNew(queries, format, flattened)
        }

        format = ['', LABEL_COMPUTER, EDGE_EXECUTE_DCOM, '{isacl: false, fromgpo: true}']
        grouped = groupBy(ou.GPOChanges.DcomUsers, GROUP_OBJECT_TYPE)
        for (let objectType in grouped){
            format[0] = objectType
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {source: localPrincipal.ObjectIdentifier, target: computer.ObjectIdentifier}
                })
            })

            insertNew(queries, format, flattened)
        }

        format = ['', LABEL_COMPUTER, EDGE_CAN_PSREMOTE, '{isacl: false, fromgpo: true}']
        grouped = groupBy(ou.GPOChanges.PSRemoteUsers, GROUP_OBJECT_TYPE)
        for (let objectType in grouped){
            format[0] = objectType
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {source: localPrincipal.ObjectIdentifier, target: computer.ObjectIdentifier}
                })
            })

            insertNew(queries, format, flattened)
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
        statement:
            PROP_QUERY.format(LABEL_DOMAIN),
        props: [],
    };

    for (let domain of chunk) {
        let properties = domain.Properties;
        let children = domain.ChildObjects
        let identifier = domain.ObjectIdentifier;
        let aces = domain.Aces;
        let links = domain.Links;
        let trusts = domain.Trusts;

        processAceArrayNew(aces, identifier, 'Domain', queries);

        queries.properties.props.push({
            source: identifier,
            map: properties,
        });

        let format = [LABEL_DOMAIN, '', EDGE_CONTAINS, NON_ACL_PROPS]
        let grouped = groupBy(children, GROUP_OBJECT_TYPE)

        for (let objectType in grouped){
            format[1] = objectType
            let props = grouped[objectType].map((child) => {
                return {source: identifier, target: child.ObjectIdentifier}
            })

            insertNew(queries, format, props)
        }

        format = [LABEL_GPO, LABEL_DOMAIN, EDGE_GP_LINK, '{isacl: false, enforced: prop.enforced}'];
        let props = links.map((link) => {
            return {
                source: link.GUID,
                target: identifier,
                enforced: link.IsEnforced,
            };
        });
        insertNew(queries, format, props);

        let computers = domain.GPOChanges.AffectedComputers;

        format = ['', LABEL_COMPUTER, EDGE_ADMIN_TO, '{isacl: false, fromgpo: true}']
        grouped = groupBy(domain.GPOChanges.LocalAdmins, GROUP_OBJECT_TYPE)
        for (let objectType in grouped){
            format[0] = objectType
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {source: localPrincipal.ObjectIdentifier, target: computer.ObjectIdentifier}
                })
            })

            insertNew(queries, format, flattened)
        }

        format = ['', LABEL_COMPUTER, EDGE_CAN_RDP, '{isacl: false, fromgpo: true}']
        grouped = groupBy(domain.GPOChanges.RemoteDesktopUsers, GROUP_OBJECT_TYPE)
        for (let objectType in grouped){
            format[0] = objectType
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {source: localPrincipal.ObjectIdentifier, target: computer.ObjectIdentifier}
                })
            })

            insertNew(queries, format, flattened)
        }

        format = ['', LABEL_COMPUTER, EDGE_EXECUTE_DCOM, '{isacl: false, fromgpo: true}']
        grouped = groupBy(domain.GPOChanges.DcomUsers, GROUP_OBJECT_TYPE)
        for (let objectType in grouped){
            format[0] = objectType
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {source: localPrincipal.ObjectIdentifier, target: computer.ObjectIdentifier}
                })
            })

            insertNew(queries, format, flattened)
        }

        format = ['', LABEL_COMPUTER, EDGE_CAN_PSREMOTE, '{isacl: false, fromgpo: true}']
        grouped = groupBy(domain.GPOChanges.PSRemoteUsers, GROUP_OBJECT_TYPE)
        for (let objectType in grouped){
            format[0] = objectType
            let flattened = computers.flatMap((computer) => {
                return grouped[objectType].map((localPrincipal) => {
                    return {source: localPrincipal.ObjectIdentifier, target: computer.ObjectIdentifier}
                })
            })

            insertNew(queries, format, flattened)
        }

        /*
        "UNWIND $props AS prop MERGE (n:Domain {name: prop.a}) MERGE (m:Domain {name: prop.b}) MERGE (n)-[:TrustedBy {trusttype : prop.trusttype, transitive: prop.transitive, isacl:false}]->(m)",
        */
        format = [
            LABEL_DOMAIN,
            LABEL_DOMAIN,
            EDGE_TRUSTED_BY,
            '{sidfiltering: prop.sidfiltering, trusttype: prop.trusttype, transitive: prop.transitive, isacl: false}',
        ];

        for (let trust of trusts) {
            let direction = trust.TrustDirection;
            let transitive = trust.IsTransitive;
            let target = trust.TargetDomainSid;
            let sidFilter = trust.SidFilteringEnabled;
            let trustType = trust.TrustType;
            let targetName = trust.TargetDomainName;

            queries.properties.props.push({
                source: target,
                map: { name: targetName },
            });

            if (direction === TRUST_DIRECTION_INBOUND || direction === TRUST_DIRECTION_BIDIRECTIONAL) {
                insertNew(queries, format, {
                    source: identifier,
                    target: target,
                    trusttype: trustType,
                    transitive: transitive,
                    sidfiltering: sidFilter,
                });
            }

            if (direction === TRUST_DIRECTION_OUTBOUND || direction === TRUST_DIRECTION_BIDIRECTIONAL) {
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
        if (formatProps.length < 4) {
            throw new NotEnoughArgumentsException();
        }
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
function processAceArrayNew(aces, target_object_identifier, target_object_type, queries) {
    let convertedAces = aces.map((ace) => {
        if (ace.PrincipalSID === target_object_identifier)
            return null

        return {
            pSid: ace.PrincipalSID,
            right: ace.RightName,
            pType: ace.PrincipalType,
            inherited: ace.IsInherited
        }
    }).filter((cAce) => {
        return cAce != null
    })

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

function processSPNTargetArrayNew(spnTargets, source_object_identifier, queries) {
    let format = [LABEL_USER, LABEL_COMPUTER, '', '{isacl: false, port: prop.port}'];
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

//Azure Functions
export function buildAzureDevices(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.id}) SET n:AZDevice SET n.azname = prop.name',
        props: [],
    };

    let format = [
        'AZUser',
        'AZDevice',
        'AZOwns',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        try {
            queries.properties.props.push({
                id: row.DeviceID.toUpperCase(),
                name: row.DeviceDisplayname.toUpperCase(),
            });

            if (row.OwnerID !== null && row.OwnerOnPremID == null) {
                format[0] = 'AZUser';
                insertNew(queries, format, {
                    source: row.OwnerID.toUpperCase(),
                    target: row.DeviceID.toUpperCase(),
                });
            }
            if (row.OwnerOnPremID !== null) {
                format[0] = 'User';
                insertNew(queries, format, {
                    source: row.OwnerOnPremID.toUpperCase(),
                    target: row.DeviceID.toUpperCase(),
                });
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureGlobalAdminRights(chunk) {
    let queries = {};

    let format = [
        '',
        'AZTenant',
        'AZGlobalAdmin',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        try {
            let type = row.ObjectType.toUpperCase();
            if (type === 'USER') {
                if (row.UserOnPremID === null) {
                    format[0] = 'AZUser';
                    insertNew(queries, format, {
                        source: row.UserID.toUpperCase(),
                        target: row.TenantID.toUpperCase(),
                    });
                } else {
                    format[0] = 'User';
                    insertNew(queries, format, {
                        source: row.UserOnPremID.toUpperCase(),
                        target: row.TenantID.toUpperCase(),
                    });
                }
            } else if (type === 'GROUP') {
                format[0] = 'AZGroup';
                insertNew(queries, format, {
                    source: row.UserID.toUpperCase(),
                    target: row.TenantID.toUpperCase(),
                });
            } else if (type === 'SERVICEPRINCIPAL') {
                format[0] = 'AZServicePrincipal';
                insertNew(queries, format, {
                    source: row.UserID.toUpperCase(),
                    target: row.TenantID.toUpperCase(),
                });
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureUsers(chunk) {
    let queries = {};
    queries.azproperties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZUser SET n.azname = prop.name',
        props: [],
    };

    queries.opproperties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:User SET n.azname = prop.name',
        props: [],
    };

    let format = [
        'AzureUser',
        'AZTenant',
        'AZGlobalAdmin',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        try {
            if (
                row.OnPremisesSecurityIdentifier === null &&
                row.TenantID === null
            ) {
                queries.azproperties.props.push({
                    source: row.ObjectID.toUpperCase(),
                    name: row.UserPrincipalName.toUpperCase(),
                });
            } else if (
                row.OnPremisesSecurityIdentifier === null &&
                row.TenantID !== null
            ) {
                format[0] = 'AZTenant';
                format[1] = 'AZUser';
                format[2] = 'AZContains';
                queries.azproperties.props.push({
                    source: row.ObjectID.toUpperCase(),
                    name: row.UserPrincipalName.toUpperCase(),
                });
                insertNew(queries, format, {
                    source: row.TenantID.toUpperCase(),
                    target: row.ObjectID.toUpperCase(),
                });
            } else if (row.OnPremisesSecurityIdentifier !== null) {
                queries.opproperties.props.push({
                    source: row.OnPremisesSecurityIdentifier.toUpperCase(),
                    name: row.UserPrincipalName.toUpperCase(),
                });
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }
    return queries;
}

export function buildAzureGroups(chunk) {
    let queries = {};
    queries.azproperties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZGroup SET n.azname = prop.name',
        props: [],
    };

    queries.opproperties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:Group SET n.azname = prop.name SET n.azsyncid=prop.sync',
        props: [],
    };
    let format = [
        'AZTenant',
        'AZGroup',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        try {
            if (row.OnPremisesSecurityIdentifier !== null) {
                queries.opproperties.props.push({
                    source: row.OnPremisesSecurityIdentifier.toUpperCase(),
                    name: row.DisplayName.toUpperCase(),
                    sync: row.ObjectID.toUpperCase(),
                });
            } else {
                queries.azproperties.props.push({
                    source: row.ObjectID.toUpperCase(),
                    name: row.DisplayName.toUpperCase(),
                });

                insertNew(queries, format, {
                    source: row.TenantID.toUpperCase(),
                    target: row.ObjectID.toUpperCase(),
                });
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureTenants(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZTenant SET n.azname = prop.name',
        props: [],
    };

    for (let row of chunk) {
        try {
            queries.properties.props.push({
                source: row.ObjectID.toUpperCase(),
                name: row.DisplayName.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureSubscriptions(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZSubscription SET n.azname = prop.name',
        props: [],
    };
    let format = [
        'AZTenant',
        'AZSubscription',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        try {
            queries.properties.props.push({
                source: row.SubscriptionId.toUpperCase(),
                name: row.Name.toUpperCase(),
            });

            insertNew(queries, format, {
                source: row.TenantId.toUpperCase(),
                target: row.SubscriptionId.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }
    return queries;
}

export function buildAzureResourceGroups(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZResourceGroup SET n.azname = prop.name',
        props: [],
    };
    let format = [
        'AZSubscription',
        'AZResourceGroup',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        try {
            queries.properties.props.push({
                source: row.ResourceGroupID.toUpperCase(),
                name: row.ResourceGroupName.toUpperCase(),
            });

            insertNew(queries, format, {
                source: row.SubscriptionID.toUpperCase(),
                target: row.ResourceGroupID.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureVMs(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZVM SET n.azname = prop.name',
        props: [],
    };
    let format = [
        'AZResourceGroup',
        'AZVM',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        try {
            queries.properties.props.push({
                source: row.AZID.toUpperCase(),
                name: row.AzVMName.toUpperCase(),
            });

            insertNew(queries, format, {
                source: row.ResourceGroupID.toUpperCase(),
                target: row.AZID.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureKeyVaults(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZKeyVault SET n.azname = prop.name',
        props: [],
    };
    let format = [
        'AZResourceGroup',
        'AZKeyVault',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        try {
            queries.properties.props.push({
                source: row.AzKeyVaultID.toUpperCase(),
                name: row.AzKeyVaultName.toUpperCase(),
            });

            insertNew(queries, format, {
                source: row.ResourceGroupID.toUpperCase(),
                target: row.AzKeyVaultID.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureGroupOwners(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZGroup SET n.azname = prop.name',
        props: [],
    };
    let format = ['', 'AZGroup', 'AZOwns', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
        try {
            queries.properties.props.push({
                source: row.GroupID.toUpperCase(),
                name: row.GroupName.toUpperCase(),
            });

            if (row.OwnerOnPremID === null) {
                format[0] = 'AZUser';
                insertNew(queries, format, {
                    source: row.OwnerID.toUpperCase(),
                    target: row.GroupID.toUpperCase(),
                });
            } else {
                format[0] = 'User';
                insertNew(queries, format, {
                    source: row.OwnerOnPremID.toUpperCase(),
                    target: row.GroupID.toUpperCase(),
                });
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureAppOwners(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZApp SET n.azname = prop.name',
        props: [],
    };
    let format = ['', 'AZApp', 'AZOwns', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
        try {
            queries.properties.props.push({
                source: row.AppId.toUpperCase(),
                name: row.AppName.toUpperCase(),
            });

            if (row.OwnerOnPremID === null) {
                format[0] = 'AZUser';
                insertNew(queries, format, {
                    source: row.OwnerID.toUpperCase(),
                    target: row.AppId.toUpperCase(),
                });
            } else {
                format[0] = 'User';
                insertNew(queries, format, {
                    source: row.OwnerOnPremID.toUpperCase(),
                    target: row.AppId.toUpperCase(),
                });
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureAppToSP(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZApp SET n.azname = prop.name',
        props: [],
    };
    let format = [
        '',
        'AZServicePrincipal',
        'AZRunsAs',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        try {
            queries.properties.props.push({
                source: row.AppId.toUpperCase(),
                name: row.AppName.toUpperCase(),
            });

            format[0] = 'AZApp';
            insertNew(queries, format, {
                source: row.AppId.toUpperCase(),
                target: row.ServicePrincipalId.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureGroupMembers(chunk) {
    let queries = {};
    let format = ['', '', 'MemberOf', '{isacl: false, isazure: false}'];

    for (let row of chunk) {
        try {
            let type = row.MemberType.toUpperCase();
            if (row.GroupOnPremID === null) {
                if (type === 'GROUP') {
                    if (row.MemberOnPremID === null) {
                        format[0] = 'AZGroup';
                        format[1] = 'AZGroup';
                        insertNew(queries, format, {
                            source: row.MemberID.toUpperCase(),
                            target: row.GroupID.toUpperCase(),
                        });
                    } else {
                        format[0] = 'Group';
                        format[1] = 'AZGroup';
                        insertNew(queries, format, {
                            source: row.MemberOnPremID.toUpperCase(),
                            target: row.GroupID.toUpperCase(),
                        });
                    }
                } else if (type === 'USER') {
                    if (row.MemberOnPremID === null) {
                        format[0] = 'AZUser';
                        format[1] = 'AZGroup';
                        insertNew(queries, format, {
                            source: row.MemberID.toUpperCase(),
                            target: row.GroupID.toUpperCase(),
                        });
                    } else {
                        format[0] = 'User';
                        format[1] = 'AZGroup';
                        insertNew(queries, format, {
                            source: row.MemberOnPremID.toUpperCase(),
                            target: row.GroupID.toUpperCase(),
                        });
                    }
                }
            } else {
                if (type === 'GROUP') {
                    format[0] = 'Group';
                    format[1] = 'Group';
                    insertNew(queries, format, {
                        source: row.MemberOnPremID.toUpperCase(),
                        target: row.GroupOnPremID.toUpperCase(),
                    });
                } else if (type === 'USER') {
                    format[0] = 'User';
                    format[1] = 'Group';
                    insertNew(queries, format, {
                        source: row.MemberOnPremID.toUpperCase(),
                        target: row.GroupOnPremID.toUpperCase(),
                    });
                }
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureVmPerms(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZGroup SET n.azname = prop.name',
        props: [],
    };
    let format = ['', 'AZVM', '', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
        try {
            let role = row.RoleName.toUpperCase();
            let controllerType = row.ControllerType.toUpperCase();
            let vmid = row.VMID.toUpperCase();
            let source;

            if (controllerType === 'UNKNOWN') continue;

            if (role === 'OWNER') {
                format[2] = 'AZOwns';
            } else if (role === 'CONTRIBUTOR') {
                format[2] = 'AZContributor';
            } else if (role === 'VIRTUAL MACHINE CONTRIBUTOR') {
                format[2] = 'AZVMContributor';
            } else if (role === 'AVERE CONTRIBUTOR') {
                format[2] = 'AZAvereContributor';
            } else if (role === 'USER ACCESS ADMINISTRATOR') {
                format[2] = 'AZUserAccessAdministrator';
            } else {
                continue;
            }

            if (row.ControllerOnPremID === null) {
                source = row.ControllerID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'AZUser';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'AZGroup';
                } else if (controllerType === 'SERVICEPRINCIPAL') {
                    format[0] = 'AZServicePrincipal';
                }
            } else {
                source = row.ControllerOnPremID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'User';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'Group';
                }
            }

            insertNew(queries, format, {
                source: source,
                target: vmid,
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureRGPermissions(chunk) {
    let queries = {};
    let format = ['', 'AZResourceGroup', '', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
        try {
            let role = row.RoleName.toUpperCase();
            let controllerType = row.ControllerType.toUpperCase();
            let rgid = row.RGID.toUpperCase();
            let source;

            if (controllerType === 'UNKNOWN' || role === 'CONTRIBUTOR')
                continue;

            if (role === 'OWNER') {
                format[2] = 'AZOwns';
            } else if (role === 'USER ACCESS ADMINISTRATOR') {
                format[2] = 'AZUserAccessAdministrator';
            } else {
                continue;
            }

            if (row.ControllerOnPremID === null) {
                source = row.ControllerID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'AZUser';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'AZGroup';
                } else if (controllerType === 'SERVICEPRINCIPAL') {
                    format[0] = 'AZServicePrincipal';
                }
            } else {
                source = row.ControllerOnPremID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'User';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'Group';
                }
            }

            insertNew(queries, format, {
                source: source,
                target: rgid,
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureKVPermissions(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZGroup SET n.azname = prop.name',
        props: [],
    };
    let format = ['', 'AZKeyVault', '', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
        try {
            let role = row.RoleName.toUpperCase();
            let controllerType = row.ControllerType.toUpperCase();
            let kvid = row.KVID.toUpperCase();
            let source;
            if (controllerType === 'UNKNOWN') continue;

            if (role === 'OWNER') {
                format[2] = 'AZOwns';
            } else if (role === 'CONTRIBUTOR') {
                format[2] = 'AZContributor';
            } else if (role === 'USER ACCESS ADMINISTRATOR') {
                format[2] = 'AZUserAccessAdministrator';
            } else if (role === 'KEY VAULT CONTRIBUTOR') {
                format[2] = 'AZKeyVaultContributor';
            } else {
                continue;
            }

            if (row.ControllerOnPremID === null) {
                source = row.ControllerID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'AZUser';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'AZGroup';
                } else if (controllerType === 'SERVICEPRINCIPAL') {
                    format[0] = 'AZServicePrincipal';
                }
            } else {
                source = row.ControllerOnPremID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'User';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'Group';
                }
            }

            insertNew(queries, format, {
                source: source,
                target: kvid,
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureKVAccessPolicies(chunk) {
    let queries = {};

    let format = ['Base', 'AZKeyVault', '', '{isacl: false, isazure: true}'];
    for (let row of chunk) {
        try {
            let kvid = row.KVID.toUpperCase();
            let access = row.Access.toUpperCase();

            if (access === 'GETKEYS') {
                format[2] = 'AZGetKeys';
            } else if (access === 'GETCERTIFICATES') {
                format[2] = 'AZGetCertificates';
            } else if (access === 'GETSECRETS') {
                format[2] = 'AZGetSecrets';
            }

            if (row.ControllerOnPremID !== null) {
                insertNew(queries, format, {
                    source: row.ControllerOnPremID.toUpperCase(),
                    target: kvid,
                });
            } else {
                insertNew(queries, format, {
                    source: row.ControllerID.toUpperCase(),
                    target: kvid,
                });
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzurePWResetRights(chunk) {
    let queries = {};

    let format = ['', '', 'AZResetPassword', '{isacl: false, isazure: true}'];
    for (let row of chunk) {
        try {
            let source;
            let target;

            if (row.UserOnPremID === null) {
                format[0] = 'AZUser';
                source = row.UserID.toUpperCase();
            } else {
                format[0] = 'User';
                source = row.UserOnPremID.toUpperCase();
            }

            if (row.TargetUserOnPremID === null) {
                format[1] = 'AZUser';
                target = row.TargetUserID.toUpperCase();
            } else {
                format[1] = 'User';
                target = row.TargetUserOnPremID.toUpperCase();
            }

            insertNew(queries, format, { source: source, target: target });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureGroupRights(chunk) {
    let queries = {};

    let format = [
        '',
        'AZGroup',
        'AZAddMembers',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        try {
            let type = row.ObjectType.toUpperCase();
            if (type === 'USER') {
                if (row.UserOnPremID === null) {
                    format[0] = 'AZUser';
                    insertNew(queries, format, {
                        source: row.UserID.toUpperCase(),
                        target: row.TargetGroupID.toUpperCase(),
                    });
                } else {
                    format[0] = 'User';
                    insertNew(queries, format, {
                        source: row.UserOnPremID.toUpperCase(),
                        target: row.TargetGroupID.toUpperCase(),
                    });
                }
            } else if (type === 'GROUP') {
                format[0] = 'AZGroup';
                insertNew(queries, format, {
                    source: row.UserID.toUpperCase(),
                    target: row.TargetGroupID.toUpperCase(),
                });
            } else if (type === 'SERVICEPRINCIPAL') {
                format[0] = 'AZServicePrincipal';
                insertNew(queries, format, {
                    source: row.UserID.toUpperCase(),
                    target: row.TargetGroupID.toUpperCase(),
                });
            }
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzurePrivRileAdminRights(chunk) {
    let queries = {};

    let format = [
        '',
        'AZTenant',
        'AZPrivilegedRoleAdmin',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        try {
            let source;

            if (row.UserOnPremID === null) {
                format[0] = 'AZUser';
                source = row.UserID.toUpperCase();
            } else {
                format[0] = 'User';
                source = row.UserOnPremID.toUpperCase();
            }

            insertNew(queries, format, {
                source: source,
                target: row.TenantID.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureApplicationAdmins(chunk) {
    let queries = {};

    let format = ['', 'AZApp', 'AZAppAdmin', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
        try {
            let source;
            let controllerType = row.AppAdminType.toUpperCase();
            if (row.AppAdminOnPremID === null) {
                source = row.AppAdminID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'AZUser';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'AZGroup';
                } else if (controllerType === 'SERVICEPRINCIPAL') {
                    format[0] = 'AZServicePrincipal';
                }
            } else {
                source = row.AppAdminOnPremID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'User';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'Group';
                }
            }

            insertNew(queries, format, {
                source: source,
                target: row.TargetAppID.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}

export function buildAzureCloudApplicationAdmins(chunk) {
    let queries = {};

    let format = [
        '',
        'AZApp',
        'AZCloudAppAdmin',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        try {
            let source;
            let controllerType = row.AppAdminType.toUpperCase();
            if (row.AppAdminOnPremID === null) {
                source = row.AppAdminID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'AZUser';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'AZGroup';
                } else if (controllerType === 'SERVICEPRINCIPAL') {
                    format[0] = 'AZServicePrincipal';
                }
            } else {
                source = row.AppAdminOnPremID.toUpperCase();
                if (controllerType === 'USER') {
                    format[0] = 'User';
                } else if (controllerType === 'GROUP') {
                    format[0] = 'Group';
                }
            }

            insertNew(queries, format, {
                source: source,
                target: row.TargetAppID.toUpperCase(),
            });
        } catch (e) {
            console.log(e);
            console.log(row);
        }
    }

    return queries;
}