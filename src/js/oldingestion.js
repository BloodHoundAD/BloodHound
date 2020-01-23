function processAceArray(array, objname, objtype, output) {
    let baseAceQuery =
        'UNWIND $props AS prop MERGE (a:{} {name:prop.principal}) MERGE (b:{} {name: prop.obj}) MERGE (a)-[r:{} {isacl:true}]->(b)';

    $.each(array, function(_, ace) {
        let principal = ace.PrincipalName;
        let principaltype = ace.PrincipalType;
        let right = ace.RightName;
        let acetype = ace.AceType;

        if (objname === principal) {
            return;
        }

        let rights = [];

        //Process the right/type to figure out the ACEs we need to add
        if (acetype === 'All') {
            rights.push('AllExtendedRights');
        } else if (acetype === 'User-Force-Change-Password') {
            rights.push('ForceChangePassword');
        } else if (acetype === 'AddMember') {
            rights.push('AddMember');
        } else if (acetype === 'AllowedToAct') {
            rights.push('AddAllowedToAct');
        } else if (right === 'ExtendedRight') {
            rights.push(acetype);
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

        $.each(rights, function(_, right) {
            let hash = right + principaltype;
            let formatted = baseAceQuery.format(
                principaltype.toTitleCase(),
                objtype,
                right
            );

            insert(output, hash, formatted, {
                principal: principal,
                obj: objname,
            });
        });
    });
}

function processSPNTargetArray(array, username, output) {
    let baseSpnQuery =
        'UNWIND $props AS prop MERGE (a:User {name:prop.principal}) MERGE (b:Computer {name: prop.obj}) MERGE (a)-[r:{} {isacl:false, port: prop.port}]->(b)';

    $.each(array, function(_, spn) {
        let target = spn.ComputerName;
        let service = spn.Service;
        let port = spn.Port;

        let hash = target + port + service;
        let formatted = baseSpnQuery.format(service);
        insert(output, hash, formatted, {
            obj: target,
            principal: username,
            port: port,
        });
    });
}

export function buildDomainJson(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Domain {name:prop.name}) SET n += prop.map',
        props: [],
    };

    queries.links = {
        statement:
            'UNWIND $props as prop MERGE (n:Domain {name:prop.domain}) MERGE (m:GPO {name:prop.gpo}) MERGE (m)-[r:GpLink {enforced:prop.enforced, isacl:false}]->(n)',
        props: [],
    };

    queries.trusts = {
        statement:
            'UNWIND $props AS prop MERGE (n:Domain {name: prop.a}) MERGE (m:Domain {name: prop.b}) MERGE (n)-[:TrustedBy {trusttype : prop.trusttype, transitive: prop.transitive, isacl:false}]->(m)',
        props: [],
    };

    queries.childous = {
        statement:
            'UNWIND $props AS prop MERGE (n:Domain {name:prop.domain}) MERGE (m:OU {guid:prop.guid}) MERGE (n)-[r:Contains {isacl:false}]->(m)',
        props: [],
    };

    queries.computers = {
        statement:
            'UNWIND $props AS prop MERGE (n:Domain {name:prop.domain}) MERGE (m:Computer {name:prop.comp}) MERGE (n)-[r:Contains {isacl:false}]->(m)',
        props: [],
    };

    queries.users = {
        statement:
            'UNWIND $props AS prop MERGE (n:Domain {name:prop.domain}) MERGE (m:User {name:prop.user}) MERGE (n)-[r:Contains {isacl:false}]->(m)',
        props: [],
    };

    $.each(chunk, function(_, domain) {
        let name = domain.Name;
        let properties = domain.Properties;

        queries.properties.props.push({ map: properties, name: name });

        let links = domain.Links;
        $.each(links, function(_, link) {
            let enforced = link.IsEnforced;
            let target = link.Name;

            queries.links.props.push({
                domain: name,
                gpo: target,
                enforced: enforced,
            });
        });

        let trusts = domain.Trusts;
        $.each(trusts, function(_, trust) {
            let target = trust.TargetName;
            let transitive = trust.IsTransitive;
            let direction = trust.TrustDirection;
            let type = trust.TrustType;

            switch (direction) {
                case 0:
                    queries.trusts.props.push({
                        a: target,
                        b: name,
                        transitive: transitive,
                        trusttype: type,
                    });
                    break;
                case 1:
                    queries.trusts.props.push({
                        a: name,
                        b: target,
                        transitive: transitive,
                        trusttype: type,
                    });
                    break;
                case 2:
                    queries.trusts.props.push({
                        a: name,
                        b: target,
                        transitive: transitive,
                        trusttype: type,
                    });
                    queries.trusts.props.push({
                        a: target,
                        b: name,
                        transitive: transitive,
                        trusttype: type,
                    });
                    break;
            }
        });

        let aces = domain.Aces;
        processAceArray(aces, name, 'Domain', queries);

        let childous = domain.ChildOus;

        $.each(childous, function(_, ou) {
            queries.childous.props.push({ domain: name, guid: ou });
        });

        let comps = domain.Computers;
        $.each(comps, function(_, computer) {
            queries.computers.props.push({ domain: name, comp: computer });
        });

        let users = domain.Users;
        $.each(users, function(_, user) {
            queries.users.props.push({ domain: name, user: user });
        });
    });

    return queries;
}

export function buildGpoJson(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:GPO {name:prop.name}) SET n.guid=prop.guid, n+=prop.map',
        props: [],
    };

    $.each(chunk, function(_, gpo) {
        let name = gpo.Name;
        let guid = gpo.Guid;
        let properties = gpo.Properties;
        queries.properties.props.push({
            name: name,
            guid: guid,
            map: properties,
        });

        let aces = gpo.Aces;
        processAceArray(aces, name, 'GPO', queries);
    });

    return queries;
}

export function buildGroupJson(chunk) {
    let queries = {};
    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:Group {name:prop.name}) SET n += prop.map',
        props: [],
    };

    let baseStatement =
        'UNWIND $props AS prop MERGE (n:Group {name: prop.name}) MERGE (m:{} {name:prop.member}) MERGE (m)-[r:MemberOf {isacl:false}]->(n)';

    $.each(chunk, function(_, group) {
        let name = group.Name;
        let properties = group.Properties;

        queries.properties.props.push({ map: properties, name: name });

        let aces = group.Aces;
        processAceArray(aces, name, 'Group', queries);

        let members = group.Members;
        $.each(members, function(_, member) {
            let mname = member.MemberName;
            let mtype = member.MemberType;

            let statement = baseStatement.format(mtype.toTitleCase());
            insert(queries, mtype, statement, { name: name, member: mname });
        });
    });

    return queries;
}

export function buildOuJson(chunk) {
    let queries = {};

    queries.properties = {
        statement:
            'UNWIND $props AS prop MERGE (n:OU {guid:prop.guid}) SET n += prop.map',
        props: [],
    };

    queries.links = {
        statement:
            'UNWIND $props as prop MERGE (n:OU {guid:prop.guid}) MERGE (m:GPO {name:prop.gpo}) MERGE (m)-[r:GpLink {enforced:prop.enforced, isacl:false}]->(n)',
        props: [],
    };

    queries.childous = {
        statement:
            'UNWIND $props AS prop MERGE (n:OU {guid:prop.parent}) MERGE (m:OU {guid:prop.child}) MERGE (n)-[r:Contains {isacl:false}]->(m)',
        props: [],
    };

    queries.computers = {
        statement:
            'UNWIND $props AS prop MERGE (n:OU {guid:prop.ou}) MERGE (m:Computer {name:prop.comp}) MERGE (n)-[r:Contains {isacl:false}]->(m)',
        props: [],
    };

    queries.users = {
        statement:
            'UNWIND $props AS prop MERGE (n:OU {guid:prop.ou}) MERGE (m:User {name:prop.user}) MERGE (n)-[r:Contains {isacl:false}]->(m)',
        props: [],
    };

    $.each(chunk, function(_, ou) {
        let guid = ou.Guid;
        let properties = ou.Properties;

        let links = ou.Links;
        $.each(links, function(_, link) {
            let enforced = link.IsEnforced;
            let target = link.Name;

            queries.links.props.push({
                guid: guid,
                gpo: target,
                enforced: enforced,
            });
        });

        queries.properties.props.push({ guid: guid, map: properties });

        let childous = ou.ChildOus;
        $.each(childous, function(_, cou) {
            queries.childous.props.push({ parent: guid, child: cou });
        });

        let computers = ou.Computers;
        $.each(computers, function(_, computer) {
            queries.computers.props.push({ ou: guid, comp: computer });
        });

        let users = ou.Users;
        $.each(users, function(_, user) {
            queries.users.props.push({ ou: guid, user: user });
        });
    });

    return queries;
}

export function buildSessionJson(chunk) {
    let queries = {};
    queries.sessions = {
        statement:
            'UNWIND $props AS prop MERGE (n:User {name:prop.user}) MERGE (m:Computer {name:prop.comp}) MERGE (m)-[r:HasSession {isacl:false}]->(n)',
        props: [],
    };

    $.each(chunk, function(_, session) {
        let name = session.UserName;
        let comp = session.ComputerName;

        queries.sessions.props.push({ user: name, comp: comp });
    });
    return queries;
}

export function buildGpoAdminJson(chunk) {
    let queries = {};

    let baseQuery =
        'UNWIND $props AS prop MERGE (n:{} {name:prop.member}) MERGE (m:Computer {name:prop.comp}) MERGE (n)-[r:{} {isacl:false}]->(m)';
    $.each(chunk, function(_, gpoadmin) {
        let computers = gpoadmin.AffectedComputers;
        let localadmins = gpoadmin.LocalAdmins;
        let rdpers = gpoadmin.RemoteDesktopUsers;
        let dcom = gpoadmin.DcomUsers;

        $.each(computers, function(_, comp) {
            $.each(localadmins, function(_, admin) {
                let member = admin.Name;
                let type = admin.Type;
                let rel = 'AdminTo';
                let hash = rel + type;
                let statement = baseQuery.format(type, rel);

                insert(queries, hash, statement, {
                    comp: comp,
                    member: member,
                });
            });

            $.each(rdpers, function(_, admin) {
                let member = admin.Name;
                let type = admin.Type;
                let rel = 'CanRDP';
                let hash = rel + type;
                let statement = baseQuery.format(type, rel);

                insert(queries, hash, statement, {
                    comp: comp,
                    member: member,
                });
            });

            $.each(dcom, function(_, admin) {
                let member = admin.Name;
                let type = admin.Type;
                let rel = 'ExecuteDCOM';
                let hash = rel + type;
                let statement = baseQuery.format(type, rel);

                insert(queries, hash, statement, {
                    comp: comp,
                    member: member,
                });
            });
        });
    });
    return queries;
}

export function buildUserJson(chunk) {
    let queries = {};

    queries.delegate = {
        statement:
            'UNWIND $props AS prop MERGE (n:User {name: prop.name}) MERGE (m:Computer {name: prop.comp}) MERGE (n)-[r:AllowedToDelegate {isacl: false}]->(m)',
        props: [],
    };

    $.each(chunk, function(_, user) {
        let name = user.Name;
        let properties = user.Properties;
        let primarygroup = user.PrimaryGroup;

        if (!queries.properties) {
            if (primarygroup === null) {
                queries.properties = {
                    statement:
                        'UNWIND $props AS prop MERGE (n:User {name:prop.name}) SET n += prop.map',
                    props: [],
                };
            } else {
                queries.properties = {
                    statement:
                        'UNWIND $props AS prop MERGE (n:User {name:prop.name}) MERGE (m:Group {name:prop.pg}) MERGE (n)-[r:MemberOf {isacl:false}]->(m) SET n += prop.map',
                    props: [],
                };
            }
        }

        queries.properties.props.push({
            map: properties,
            name: name,
            pg: primarygroup,
        });

        let aces = user.Aces;
        processAceArray(aces, name, 'User', queries);

        let allowedToDelegate = user.AllowedToDelegate;
        $.each(allowedToDelegate, (_, comp) => {
            queries.delegate.props.push({ name: name, comp: comp });
        });

        let spnTargets = user.SPNTargets;
        processSPNTargetArray(spnTargets, name, queries);
    });
    return queries;
}

export function buildComputerJson(chunk) {
    let queries = {};
    let baseQuery =
        'UNWIND $props AS prop MERGE (n:Computer {name:prop.name}) MERGE (m:{} {name:prop.target}) MERGE (m)-[r:{} {isacl: false}]->(n)';

    queries.delegate = {
        statement:
            'UNWIND $props AS prop MERGE (n:Computer {name: prop.name}) MERGE (m:Computer {name: prop.comp}) MERGE (n)-[r:AllowedToDelegate {isacl: false}]->(m)',
        props: [],
    };

    $.each(chunk, function(_, comp) {
        let name = comp.Name;
        let properties = comp.Properties;
        let localadmins = comp.LocalAdmins;
        let rdpers = comp.RemoteDesktopUsers;
        let primarygroup = comp.PrimaryGroup;
        let allowedtoact = comp.AllowedToAct;
        let dcom = comp.DcomUsers;
        let psremote = comp.PsRemoteUsers;

        if (!queries.properties) {
            if (primarygroup === null) {
                queries.properties = {
                    statement:
                        'UNWIND $props AS prop MERGE (n:Computer {name:prop.name}) SET n += prop.map',
                    props: [],
                };
            } else {
                queries.properties = {
                    statement:
                        'UNWIND $props AS prop MERGE (n:Computer {name:prop.name}) MERGE (m:Group {name:prop.pg}) MERGE (n)-[r:MemberOf {isacl:false}]->(m) SET n += prop.map',
                    props: [],
                };
            }
        }

        queries.properties.props.push({
            map: properties,
            name: name,
            pg: primarygroup,
        });
        $.each(localadmins, function(_, admin) {
            let aType = admin.Type;
            let aName = admin.Name;
            let rel = 'AdminTo';

            let hash = rel + aType;

            let statement = baseQuery.format(aType, rel);
            let p = { name: name, target: aName };
            insert(queries, hash, statement, p);
        });

        $.each(psremote, function(_, psr) {
            let aType = psr.Type;
            let aName = psr.Name;
            let rel = 'CanPSRemote';

            let hash = rel + aType;

            let statement = baseQuery.format(aType, rel);
            let p = { name: name, target: aName };
            insert(queries, hash, statement, p);
        });

        $.each(rdpers, function(_, rdp) {
            let aType = rdp.Type;
            let aName = rdp.Name;
            let rel = 'CanRDP';

            let hash = rel + aType;

            let statement = baseQuery.format(aType, rel);
            let p = { name: name, target: aName };
            insert(queries, hash, statement, p);
        });

        $.each(dcom, function(_, dcomu) {
            let aType = dcomu.Type;
            let aName = dcomu.Name;
            let rel = 'ExecuteDCOM';

            let hash = rel + aType;

            let statement = baseQuery.format(aType, rel);
            let p = { name: name, target: aName };
            insert(queries, hash, statement, p);
        });

        $.each(allowedtoact, function(_, atau) {
            let aType = atau.Type;
            let aName = atau.Name;
            let rel = 'AllowedToAct';

            let hash = rel + aType;

            let statement = baseQuery.format(aType, rel);
            let p = { name: name, target: aName };
            insert(queries, hash, statement, p);
        });

        let aces = comp.Aces;
        processAceArray(aces, name, 'Computer', queries);

        let allowedToDelegate = comp.AllowedToDelegate;
        $.each(allowedToDelegate, (_, comp) => {
            queries.delegate.props.push({ name: name, comp: comp });
        });
    });
    return queries;
}

function insert(obj, hash, statement, prop) {
    if (obj[hash]) {
        obj[hash].props.push(prop);
    } else {
        obj[hash] = {};
        obj[hash].statement = statement;
        obj[hash].props = [];
        obj[hash].props.push(prop);
    }
}
