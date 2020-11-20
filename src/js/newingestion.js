import { groupBy } from 'lodash/collection';

export function buildGroupJsonNew(chunk) {
    let queries = {};
    queries.properties = {};
    queries.properties.statement =
        'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:Group SET n += prop.map';
    queries.properties.props = [];

    for (let group of chunk) {
        let properties = group.Properties;
        let identifier = group.ObjectIdentifier;
        let aces = group.Aces;
        let members = group.Members;

        queries.properties.props.push({ source: identifier, map: properties });

        processAceArrayNew(aces, identifier, 'Group', queries);

        let format = ['', 'Group', 'MemberOf', '{isacl: false}'];
        let grouped = groupBy(members || [], 'MemberType');
        for (let group in grouped) {
            format[0] = group;
            let props = grouped[group]
                .filter((g) => {
                    return g.MemberId != null;
                })
                .map((g) => {
                    return { source: g.MemberId, target: identifier };
                });

            insertNew(queries, format, props);
        }
    }
    return queries;
}

export function buildComputerJsonNew(chunk) {
    let queries = {};
    queries.properties = {};
    queries.properties.statement =
        'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:Computer SET n += prop.map';
    queries.properties.props = [];

    for (let computer of chunk) {
        let identifier = computer.ObjectIdentifier;
        let properties = computer.Properties;
        let localAdmins = computer.LocalAdmins;
        let rdp = computer.RemoteDesktopUsers;
        let primaryGroup = computer.PrimaryGroupSid;
        let allowedToAct = computer.AllowedToAct;
        let dcom = computer.DcomUsers;
        let psremote = computer.PSRemoteUsers;
        let allowedToDelegate = computer.AllowedToDelegate;
        let sessions = computer.Sessions;
        let aces = computer.Aces;

        queries.properties.props.push({ source: identifier, map: properties });

        processAceArrayNew(aces, identifier, 'Computer', queries);

        let format = ['Computer', 'Group', 'MemberOf', '{isacl:false}'];
        if (primaryGroup !== null) {
            insertNew(queries, format, {
                source: identifier,
                target: primaryGroup,
            });
        }

        format = ['Computer', 'Computer', 'AllowedToDelegate', '{isacl:false}'];

        let props = (allowedToDelegate || []).map((delegate) => {
            return { source: identifier, target: delegate };
        });

        insertNew(queries, format, props);

        format = ['', 'Computer', 'AllowedToAct', '{isacl:false}'];
        grouped = groupBy(allowedToAct || [], 'MemberType');
        for (let group in grouped) {
            format[0] = group;
            props = grouped[group].map((group) => {
                return { source: group.MemberId, target: identifier };
            });
            insertNew(queries, format, props);
        }

        format = ['Computer', 'User', 'HasSession', '{isacl:false}'];
        props = (sessions || []).map((session) => {
            return { source: session.ComputerId, target: session.UserId };
        });
        insertNew(queries, format, props);

        format = ['', 'Computer', '', '{isacl:false, fromgpo: false}'];
        let grouped = groupBy(localAdmins || [], 'MemberType');
        for (let group in grouped) {
            format[0] = group;
            format[2] = 'AdminTo';
            props = grouped[group].map((group) => {
                return { source: group.MemberId, target: identifier };
            });
            insertNew(queries, format, props);
        }

        grouped = groupBy(rdp || [], 'MemberType');
        for (let group in grouped) {
            format[0] = group;
            format[2] = 'CanRDP';
            props = grouped[group].map((group) => {
                return { source: group.MemberId, target: identifier };
            });
            insertNew(queries, format, props);
        }

        grouped = groupBy(dcom || [], 'MemberType');
        for (let group in grouped) {
            format[0] = group;
            format[2] = 'ExecuteDCOM';
            props = grouped[group].map((group) => {
                return { source: group.MemberId, target: identifier };
            });
            insertNew(queries, format, props);
        }

        grouped = groupBy(psremote || [], 'MemberType');
        for (let group in grouped) {
            format[0] = group;
            format[2] = 'CanPSRemote';
            props = grouped[group].map((group) => {
                return { source: group.MemberId, target: identifier };
            });
            insertNew(queries, format, props);
        }
    }
    return queries;
}

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
        let primaryGroup = user.PrimaryGroupSid;
        let allowedToDelegate = user.AllowedToDelegate;
        let spnTargets = user.SPNTargets;
        let sidHistory = user.HasSIDHistory;
        let aces = user.Aces;

        processAceArrayNew(aces, identifier, 'User', queries);

        queries.properties.props.push({
            source: identifier,
            map: properties,
        });

        let format = ['User', 'Group', 'MemberOf', '{isacl: false}'];
        if (primaryGroup !== null) {
            insertNew(queries, format, {
                source: identifier,
                target: primaryGroup,
            });
        }

        format = ['User', 'Computer', 'AllowedToDelegate', '{isacl: false}'];
        let props = allowedToDelegate.map((x) => {
            return { source: identifier, target: x };
        });

        insertNew(queries, format, props);

        format = ['User', '', 'HasSIDHistory', '{isacl: false}'];
        let grouped = groupBy(sidHistory, 'MemberType');
        for (let x in grouped) {
            format[1] = x;
            format[2] = 'HasSIDHistory';
            props = grouped[x].map((history) => {
                return { source: identifier, target: history.MemberId };
            });

            insertNew(queries, format, props);
        }

        processSPNTargetArrayNew(spnTargets, identifier, queries);
    }
    return queries;
}

export function buildGpoJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:GPO SET n += prop.map',
        props: [],
    };

    for (let gpo of chunk) {
        let identifier = gpo.ObjectIdentifier;
        let aces = gpo.Aces;
        let properties = gpo.Properties;

        queries.properties.props.push({ source: identifier, map: properties });
        processAceArrayNew(aces, identifier, 'GPO', queries);
    }

    return queries;
}

export function buildOuJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:OU SET n += prop.map',
        props: [],
    };

    for (let ou of chunk) {
        let properties = ou.Properties;
        let users = ou.Users;
        let computers = ou.Computers;
        let childOus = ou.ChildOus;
        let rdpUsers = ou.RemoteDesktopUsers;
        let admins = ou.LocalAdmins;
        let dcomUsers = ou.DcomUsers;
        let psRemoteUsers = ou.PSRemoteUsers;
        let links = ou.Links || [];

        let identifier = ou.ObjectIdentifier.toUpperCase();
        properties.objectid = identifier;
        let aces = ou.Aces;

        processAceArrayNew(aces, identifier, 'OU', queries);

        queries.properties.props.push({ source: identifier, map: properties });

        let format = ['OU', 'User', 'Contains', '{isacl: false}'];
        let props = users.map((user) => {
            return { source: identifier, target: user };
        });
        insertNew(queries, format, props);

        format = ['OU', 'Computer', 'Contains', '{isacl: false}'];
        props = computers.map((computer) => {
            return { source: identifier, target: computer };
        });
        insertNew(queries, format, props);

        format = ['OU', 'OU', 'Contains', '{isacl: false}'];
        props = childOus.map((ou) => {
            return { source: identifier, target: ou };
        });
        insertNew(queries, format, props);

        format = [
            'GPO',
            'OU',
            'GpLink',
            '{isacl: false, enforced: prop.enforced}',
        ];
        props = links.map((link) => {
            return {
                source: link.Guid.toUpperCase(),
                target: identifier,
                enforced: link.IsEnforced,
            };
        });
        insertNew(queries, format, props);

        format = ['', 'Computer', '', '{isacl: false, fromgpo: true}'];
        let grouped = groupBy(admins, 'MemberType');
        for (let x in grouped) {
            format[0] = x;
            format[2] = 'AdminTo';
            let flattened = computers.flatMap((computer) => {
                return grouped[x].map((admin) => {
                    return { source: admin.MemberId, target: computer };
                });
            });

            insertNew(queries, format, flattened);
        }

        grouped = groupBy(psRemoteUsers, 'MemberType');
        for (let x in grouped) {
            format[0] = x;
            format[2] = 'CanPSRemote';
            let flattened = computers.flatMap((computer) => {
                return grouped[x].map((admin) => {
                    return { source: admin.MemberId, target: computer };
                });
            });

            insertNew(queries, format, flattened);
        }

        grouped = groupBy(dcomUsers, 'MemberType');
        for (let x in grouped) {
            format[0] = x;
            format[2] = 'ExecuteDCOM';
            let flattened = computers.flatMap((computer) => {
                return grouped[x].map((admin) => {
                    return { source: admin.MemberId, target: computer };
                });
            });

            insertNew(queries, format, flattened);
        }

        grouped = groupBy(rdpUsers, 'MemberType');

        for (let x in grouped) {
            format[0] = x;
            format[2] = 'CanRDP';
            let flattened = computers.flatMap((computer) => {
                return grouped[x].map((admin) => {
                    return { source: admin.MemberId, target: computer };
                });
            });

            insertNew(queries, format, flattened);
        }
    }
    return queries;
}

export function buildDomainJsonNew(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:Domain SET n += prop.map',
        props: [],
    };

    for (let domain of chunk) {
        let properties = domain.Properties;
        let users = domain.Users;
        let computers = domain.Computers;
        let childOus = domain.ChildOus;
        let rdpUsers = domain.RemoteDesktopUsers;
        let admins = domain.LocalAdmins;
        let dcomUsers = domain.DcomUser;
        let psRemoteUsers = domain.PSRemoteUsers;
        let identifier = domain.ObjectIdentifier;
        let aces = domain.Aces;
        let links = domain.Links || [];
        let trusts = domain.Trusts || [];

        processAceArrayNew(aces, identifier, 'Domain', queries);

        queries.properties.props.push({
            source: identifier,
            map: properties,
        });

        let format = ['Domain', 'User', 'Contains', '{isacl: false}'];
        let props = users.map((user) => {
            return { source: identifier, target: user };
        });
        insertNew(queries, format, props);

        format = ['Domain', 'Computer', 'Contains', '{isacl: false}'];
        props = computers.map((computer) => {
            return { source: identifier, target: computer };
        });
        insertNew(queries, format, props);

        format = ['Domain', 'OU', 'Contains', '{isacl: false}'];
        props = childOus.map((ou) => {
            return { source: identifier, target: ou.toUpperCase() };
        });
        insertNew(queries, format, props);

        format = [
            'GPO',
            'Domain',
            'GpLink',
            '{isacl: false, enforced: prop.enforced}',
        ];
        props = links.map((link) => {
            return {
                source: link.Guid,
                target: identifier,
                enforced: link.IsEnforced,
            };
        });

        insertNew(queries, format, props);

        /*
        TrustDirection
        Disabled = 0
        Inbound = 1,
        Outbound = 2,
        Bidirectional = 3

        TrustType
        ParentChild = 0,
        CrossLink = 1,
        Forest = 2,
        External = 3,
        Unknown = 4
        "UNWIND $props AS prop MERGE (n:Domain {name: prop.a}) MERGE (m:Domain {name: prop.b}) MERGE (n)-[:TrustedBy {trusttype : prop.trusttype, transitive: prop.transitive, isacl:false}]->(m)",
        */
        format = [
            'Domain',
            'Domain',
            'TrustedBy',
            '{sidfiltering: prop.sidfiltering, trusttype: prop.trusttype, transitive: prop.transitive, isacl: false}',
        ];
        for (let trust of trusts) {
            let direction = trust.TrustDirection;
            let transitive = trust.IsTransitive;
            let target = trust.TargetDomainSid;
            let sidFilter = trust.SidFilteringEnabled;
            let trustType = trust.TrustType;
            let targetName = trust.TargetDomainName;

            switch (trustType) {
                case 0:
                    trustType = 'ParentChild';
                    break;
                case 1:
                    trustType = 'CrossLink';
                    break;
                case 2:
                    trustType = 'Forest';
                    break;
                case 3:
                    trustType = 'External';
                    break;
                case 4:
                    trustType = 'Unknown';
            }

            queries.properties.props.push({
                source: target,
                map: { name: targetName },
            });

            if (direction === 1 || direction === 3) {
                insertNew(queries, format, {
                    source: identifier,
                    target: target,
                    trusttype: trustType,
                    transitive: transitive,
                    sidfiltering: sidFilter,
                });
            }

            if (direction === 2 || direction === 3) {
                insertNew(queries, format, {
                    source: target,
                    target: identifier,
                    trusttype: trustType,
                    transitive: transitive,
                    sidfiltering: sidFilter,
                });
            }
        }

        format = ['', 'Computer', '', '{isacl: false, fromgpo: true}'];

        let grouped = groupBy(admins, 'MemberType');
        for (let x in grouped) {
            format[0] = x;
            format[2] = 'AdminTo';
            let flattened = computers.flatMap((computer) => {
                return grouped[x].map((admin) => {
                    return { source: admin.MemberId, target: computer };
                });
            });

            insertNew(queries, format, flattened);
        }

        grouped = groupBy(psRemoteUsers, 'MemberType');
        for (let x in grouped) {
            format[0] = x;
            format[2] = 'CanPSRemote';
            let flattened = computers.flatMap((computer) => {
                return grouped[x].map((admin) => {
                    return { source: admin.MemberId, target: computer };
                });
            });

            insertNew(queries, format, flattened);
        }

        grouped = groupBy(dcomUsers, 'MemberType');
        for (let x in grouped) {
            format[0] = x;
            format[2] = 'ExecuteDCOM';
            let flattened = computers.flatMap((computer) => {
                return grouped[x].map((admin) => {
                    return { source: admin.MemberId, target: computer };
                });
            });

            insertNew(queries, format, flattened);
        }

        grouped = groupBy(rdpUsers, 'MemberType');

        for (let x in grouped) {
            format[0] = x;
            format[2] = 'CanRDP';
            let flattened = computers.flatMap((computer) => {
                return grouped[x].map((admin) => {
                    return { source: admin.MemberId, target: computer };
                });
            });

            insertNew(queries, format, flattened);
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
 * @param {*} queryProp - array of query props
 */
function insertNew(queries, formatProps, queryProps) {
    if (formatProps.length < 4) {
        throw new NotEnoughArgumentsException();
    }
    if (queryProps.length == 0) {
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

function processAceArrayNew(aces, objectid, objecttype, queries) {
    var convertedAces = aces.flatMap((ace) => {
        let pSid = ace.PrincipalSID;
        let pType = ace.PrincipalType;
        let right = ace.RightName;
        let aceType = ace.AceType;
        let isInherited = ace.IsInherited || false;

        if (objectid == pSid) {
            return null;
        }

        let rights = [];

        //Process the right/type to figure out the ACEs we need to add
        if (aceType === 'All') {
            rights.push('AllExtendedRights');
        } else if (aceType === 'User-Force-Change-Password') {
            rights.push('ForceChangePassword');
        } else if (aceType === 'AddMember') {
            rights.push('AddMember');
        } else if (aceType === 'AllowedToAct') {
            rights.push('AddAllowedToAct');
        } else if (right === 'ExtendedRight' && aceType != '') {
            rights.push(aceType);
        }

        if (right === 'GenericAll') {
            rights.push('GenericAll');
        }

        if (right === 'WriteDacl') {
            rights.push('WriteDacl');
        }

        if (right === 'WriteOwner') {
            rights.push('WriteOwner');
        }

        if (right === 'GenericWrite') {
            rights.push('GenericWrite');
        }

        if (right === 'Owner') {
            rights.push('Owns');
        }

        if (right === 'ReadLAPSPassword') {
            rights.push('ReadLAPSPassword');
        }

        if (right === 'ReadGMSAPassword') {
            rights.push('ReadGMSAPassword');
        }

        return rights.map((right) => {
            return {
                pSid: pSid,
                right: right,
                pType: pType,
                isInherited: isInherited,
            };
        });
    });

    convertedAces = convertedAces.filter((ace) => {
        return ace != null;
    });

    var grouped = groupBy(convertedAces, 'right');
    let format = [
        '',
        objecttype,
        '',
        '{isacl: true, isinherited: prop.isinherited}',
    ];
    for (let right in grouped) {
        let innerGrouped = groupBy(grouped[right], 'pType');
        for (let inner in innerGrouped) {
            format[0] = inner;
            format[2] = right;
            var mapped = innerGrouped[inner].map((x) => {
                return {
                    source: x.pSid,
                    target: objectid,
                    isinherited: x.isInherited,
                };
            });
            insertNew(queries, format, mapped);
        }
    }
}

function processSPNTargetArrayNew(spns, objectid, queries) {
    let format = ['User', 'Computer', '', '{isacl: false, port: prop.port}'];
    let grouped = groupBy(spns, 'Service');
    for (let group in grouped) {
        format[2] = group;
        let props = grouped[group].map((spn) => {
            return {
                source: objectid,
                target: spn.ComputerSid,
                port: spn.Port,
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
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.id}) SET n:AZDevice SET n.name = prop.name',
        props: [],
    };

    let format = [
        'AZUser',
        'AZDevice',
        'AZOwns',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        queries.properties.props.push({
            id: row.DeviceID.toUpperCase(),
            name: row.DeviceDisplayname.toUpperCase(),
        });

        if (row.OwnerID !== null) {
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
    }

    return queries;
}

export function buildAzureUsers(chunk) {
    let queries = {};
    queries.azproperties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZUser SET n.name = prop.name',
        props: [],
    };

    queries.opproperties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:User SET n.name = prop.name',
        props: [],
    };

    let format = [
        'AzureUser',
        'AZTenant',
        'AZGlobalAdmin',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
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
    }
    return queries;
}

export function buildAzureGroups(chunk) {
    let queries = {};
    queries.azproperties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZGroup SET n.name = prop.name',
        props: [],
    };

    queries.opproperties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:Group SET n.name = prop.name SET n.azsyncid=prop.sync',
        props: [],
    };
    let format = [
        'AZTenant',
        'AZGroup',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
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
    }

    return queries;
}

export function buildAzureTenants(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZTenant SET n.name = prop.name',
        props: [],
    };

    for (let row of chunk) {
        queries.properties.props.push({
            source: row.ObjectID.toUpperCase(),
            name: row.DisplayName.toUpperCase(),
        });
    }

    return queries;
}

export function buildAzureSubscriptions(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZSubscription SET n.name = prop.name',
        props: [],
    };
    let format = [
        'AZTenant',
        'AZSubscription',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];
    for (let row of chunk) {
        queries.properties.props.push({
            source: row.SubscriptionId.toUpperCase(),
            name: row.Name.toUpperCase(),
        });

        insertNew(queries, format, {
            source: row.TenantId.toUpperCase(),
            target: row.SubscriptionId.toUpperCase(),
        });
    }
    return queries;
}

export function buildAzureResourceGroups(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZResourceGroup SET n.name = prop.name',
        props: [],
    };
    let format = [
        'AZSubscription',
        'AZResourceGroup',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        queries.properties.props.push({
            source: row.ResourceGroupID.toUpperCase(),
            name: row.ResourceGroupName.toUpperCase(),
        });

        insertNew(queries, format, {
            source: row.SubscriptionID.toUpperCase(),
            target: row.ResourceGroupID.toUpperCase(),
        });
    }

    return queries;
}

export function buildAzureVMs(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZVM SET n.name = prop.name',
        props: [],
    };
    let format = [
        'AZResourceGroup',
        'AZVM',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        queries.properties.props.push({
            source: row.AZID.toUpperCase(),
            name: row.AzVMName.toUpperCase(),
        });

        insertNew(queries, format, {
            source: row.ResourceGroupID.toUpperCase(),
            target: row.AZID.toUpperCase(),
        });
    }

    return queries;
}

export function buildAzureKeyVaults(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZKeyVault SET n.name = prop.name',
        props: [],
    };
    let format = [
        'AZResourceGroup',
        'AZKeyVault',
        'AZContains',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        queries.properties.props.push({
            source: row.AzKeyVaultID.toUpperCase(),
            name: row.AzKeyVaultName.toUpperCase(),
        });

        insertNew(queries, format, {
            source: row.ResourceGroupID.toUpperCase(),
            target: row.AzKeyVaultID.toUpperCase(),
        });
    }

    return queries;
}

export function buildAzureGroupOwners(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZGroup SET n.name = prop.name',
        props: [],
    };
    let format = ['', 'AZGroup', 'AZOwns', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
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
    }

    return queries;
}

export function buildAzureAppOwners(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZApp SET n.name = prop.name',
        props: [],
    };
    let format = ['', 'AZApp', 'AZOwns', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
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
    }

    return queries;
}

export function buildAzureAppToSP(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZApp SET n.name = prop.AppName',
        props: [],
    };
    let format = [
        '',
        'AZServicePrincipal',
        'AZRunsAs',
        '{isacl: false, isazure: true}',
    ];

    for (let row of chunk) {
        queries.properties.props.push({
            source: row.AppId.toUpperCase(),
            name: row.AppName.toUpperCase(),
        });

        format[0] = 'AZApp';
        insertNew(queries, format, {
            source: row.AppId.toUpperCase(),
            target: row.ServicePrincipalId.toUpperCase(),
        });
    }

    return queries;
}

export function buildAzureGroupMembers(chunk) {
    let queries = {};
    let format = ['', '', 'MemberOf', '{isacl: false, isazure: false}'];

    for (let row of chunk) {
        let type = row.MemberType.toUpperCase();
        if (row.GroupOnPremID === null) {
            if (type === 'GROUP') {
                if (row.GroupOnPremID === null) {
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
                if (row.GroupOnPremID === null) {
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
    }

    return queries;
}

export function buildAzureVmPerms(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZGroup SET n.name = prop.name',
        props: [],
    };
    let format = ['', 'AZVM', '', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
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
    }

    return queries;
}

export function buildAzureRGPermissions(chunk) {
    let queries = {};
    let format = ['', 'AZResourceGroup', '', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
        let role = row.RoleName.toUpperCase();
        let controllerType = row.ControllerType.toUpperCase();
        let rgid = row.RGID.toUpperCase();
        let source;

        if (controllerType === 'UNKNOWN' || role === 'CONTRIBUTOR') continue;

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
    }

    return queries;
}

export function buildAzureKVPermissions(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Base {objectid: prop.source}) SET n:AZGroup SET n.name = prop.name',
        props: [],
    };
    let format = ['', 'AZKeyVault', '', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
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
    }

    return queries;
}

export function buildAzureKVAccessPolicies(chunk) {
    let queries = {};

    let format = ['Base', 'AZKeyVault', '', '{isacl: false, isazure: true}'];
    for (let row of chunk) {
        let kvid = row.KVID.toUpperCase();
        let access = row.Access.toUpperCase();

        if (access === 'GETKEYS') {
            format[2] = 'AZGetKeys';
        } else if (access === 'GETCERTIFICATES') {
            format[2] = 'AZGetCertificates';
        } else if (access === 'GETSECRETS') {
            format[2] = 'AZGetSecrets';
        }

        if (row.ControllerOnPremID === null) {
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
    }

    return queries;
}

export function buildAzurePWResetRights(chunk) {
    let queries = {};

    let format = ['', '', 'AZResetPassword', '{isacl: false, isazure: true}'];
    for (let row of chunk) {
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
    }

    return queries;
}

export function buildAzureApplicationAdmins(chunk) {
    let queries = {};

    let format = ['', 'AZApp', 'AZAppAdmin', '{isacl: false, isazure: true}'];

    for (let row of chunk) {
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
    }

    return queries;
}
