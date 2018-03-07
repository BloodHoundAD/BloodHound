export function generateUniqueId(sigmaInstance, isNode) {
    var i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
    if (isNode) {
        while (typeof sigmaInstance.graph.nodes(i) !== 'undefined') {
            i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
        }
    } else {
        while (typeof sigmaInstance.graph.edges(i) !== 'undefined') {
            i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
        }
    }

    return i;
}

//Recursive function to highlight paths to start/end nodes
export function findGraphPath(sigmaInstance, reverse, nodeid, traversed) {
    let target = reverse ? appStore.startNode : appStore.endNode;
    traversed.push(nodeid);
    //This is our stop condition for recursing
    if (nodeid !== target.id) {
        var edges = sigmaInstance.graph.adjacentEdges(nodeid);
        var nodes = reverse ? sigmaInstance.graph.inboundNodes(nodeid) : sigmaInstance.graph.outboundNodes(nodeid);
        //Loop over the nodes near us and the edges connecting to those nodes
        $.each(nodes, function(index, node) {
            $.each(edges, function(index, edge) {
                var check = reverse ? edge.source : edge.target;
                //If an edge is pointing in the right direction, set its color
                //Push the edge into our store and then 
                node = parseInt(node);
                if (check === node && !traversed.includes(node)) {
                    edge.color = reverse ? 'blue' : 'red';
                    appStore.highlightedEdges.push(edge);
                    findGraphPath(sigmaInstance, reverse, node, traversed);
                }
            });
        });
    } else {
        return;
    }
}

export function clearSessions(){
    emitter.emit('openClearingModal');
    deleteSessions();
}

function deleteSessions(){
    var session = driver.session();
    session.run("MATCH ()-[r:HasSession]-() WITH r LIMIT 100000 DELETE r RETURN count(r)")
        .then(function(results) {
            session.close();
            emitter.emit("refreshDBData");
            var count = results.records[0]._fields[0].low;
            if (count === 0) {
                emitter.emit('hideDBClearModal');
            } else {
                deleteSessions();
            }
        });
}

export function clearDatabase() {
    emitter.emit('openClearingModal');
    deleteEdges();
}

function deleteEdges() {
    var session = driver.session();
    session.run("MATCH ()-[r]-() WITH r LIMIT 100000 DELETE r RETURN count(r)")
        .then(function(results) {
            emitter.emit("refreshDBData");
            session.close();
            var count = results.records[0]._fields[0].low;
            if (count === 0) {
                deleteNodes();
            } else {
                deleteEdges();
            }
        });
}

function deleteNodes() {
    var session = driver.session();
    session.run("MATCH (n) WITH n LIMIT 100000 DELETE n RETURN count(n)")
        .then(function(results) {
            emitter.emit("refreshDBData");
            session.close();
            var count = results.records[0]._fields[0].low;
            if (count === 0) {
                emitter.emit('hideDBClearModal');
            } else {
                deleteNodes();
            }
        });
}

export function findObjectType(header){
    if (header.includes('UserName') && header.includes('ComputerName') && header.includes('Weight')){
        return 'sessions';
    }else if (header.includes('AccountName') && header.includes('AccountType') && header.includes('GroupName')){
        return 'groupmembership';
    }else if (header.includes('AccountName') && header.includes('AccountType') && header.includes('ComputerName')){
        return 'localadmin';
    }else if (header.includes('SourceDomain') && header.includes('TargetDomain') && header.includes('TrustDirection') && header.includes('TrustType') && header.includes('Transitive')){
        return 'domain';
    }else if (header.includes('ActiveDirectoryRights') && header.includes('ObjectType') && header.includes('PrincipalType') && header.includes('PrincipalName') && header.includes('ObjectName') && header.includes('ACEType') && header.includes('AccessControlType') && header.includes('IsInherited')){
        return 'acl';
    }else if (header.includes('AccountName') && header.includes('Enabled') && header.includes('PwdLastSet') && header.includes('LastLogon') && header.includes('Sid') && header.includes('SidHistory') && header.includes('HasSPN') && header.includes('ServicePrincipalNames')){
        return 'userprops';
    }else if (header.includes('AccountName') && header.includes('Enabled') && header.includes('PwdLastSet') && header.includes('LastLogon') && header.includes('OperatingSystem') && header.includes('Sid')){
        return 'compprops';
    } else if (header.includes('ContainerType') && header.includes('ContainerName') && header.includes('ContainerGUID') && header.includes('ContainerBlocksInheritance') && header.includes('ObjectType') && header.includes('ObjectName') && header.includes('ObjectId')){
        return 'structure';
    } else if (header.includes('ObjectType') && header.includes('ObjectName') && header.includes('ObjectGUID') && header.includes('GPODisplayName') && header.includes('GPOGuid') && header.includes('IsEnforced')){
        return 'gplink';
    }else{
        return 'unknown';
    }
}

export function buildGroupMembershipProps(rows) {
    var users = [];
    var groups = [];
    var computers = [];
    $.each(rows, function(index, row) {
        switch (row.AccountType) {
            case 'user':
                users.push({ account: row.AccountName.toUpperCase(), group: row.GroupName.toUpperCase() });
                break;
            case 'computer':
                computers.push({ account: row.AccountName.toUpperCase(), group: row.GroupName.toUpperCase() });
                break;
            case 'group':
                groups.push({ account: row.AccountName.toUpperCase(), group: row.GroupName.toUpperCase() });
                break;
        }
    });

    return { users: users, groups: groups, computers: computers };
}

export function buildLocalAdminProps(rows) {
    var users = [];
    var groups = [];
    var computers = [];
    $.each(rows, function(index, row) {
        if (row.AccountName.startsWith('@')) {
            return;
        }
        switch (row.AccountType) {
            case 'user':
                users.push({ account: row.AccountName.toUpperCase(), computer: row.ComputerName.toUpperCase() });
                break;
            case 'group':
                groups.push({ account: row.AccountName.toUpperCase(), computer: row.ComputerName.toUpperCase() });
                break;
            case 'computer':
                computers.push({ account: row.AccountName.toUpperCase(), computer: row.ComputerName.toUpperCase() });
                break;
        }
    });
    return { users: users, groups: groups, computers: computers };
}

export function buildSessionProps(rows) {
    var sessions = [];
    $.each(rows, function(index, row) {
        if (row.UserName === 'ANONYMOUS LOGON@UNKNOWN' || row.UserName === '') {
            return;
        }
        sessions.push({ account: row.UserName.toUpperCase(), computer: row.ComputerName.toUpperCase(), weight: row.Weight });
    });

    return sessions;
}

export function buildDomainProps(rows) {
    var domains = [];
    $.each(rows, function(index, row) {
        switch (row.TrustDirection) {
            case 'Inbound':
                domains.push({ domain1: row.TargetDomain.toUpperCase(), domain2: row.SourceDomain.toUpperCase(), trusttype: row.TrustType, transitive: row.Transitive });
                break;
            case 'Outbound':
                domains.push({ domain1: row.SourceDomain.toUpperCase(), domain2: row.TargetDomain.toUpperCase(), trusttype: row.TrustType, transitive: row.Transitive });
                break;
            case 'Bidirectional':
                domains.push({ domain1: row.TargetDomain.toUpperCase(), domain2: row.SourceDomain.toUpperCase(), trusttype: row.TrustType, transitive: row.Transitive });
                domains.push({ domain1: row.SourceDomain.toUpperCase(), domain2: row.TargetDomain.toUpperCase(), trusttype: row.TrustType, transitive: row.Transitive });
                break;
        }
    });

    return domains;
}

export function buildStructureProps(rows){
    var datadict = {};

    $.each(rows, function(index, row){
        var hash = (row.ContainerType + row.ObjectType).toUpperCase();
        var atype = row.ContainerType.toTitleCase();
        var btype = row.ObjectType.toTitleCase();

        if (datadict[hash]){
            datadict[hash].props.push({
                container: row.ContainerName.toUpperCase(),
                object: row.ObjectName.toUpperCase()
            });
        }else{
            datadict[hash] = {
                statement: 'UNWIND {props} AS prop MERGE (a:{} {name:prop.container}) WITH a,prop MERGE (b:{} {name: prop.object}) WITH a,b,prop MERGE (a)-[r:Contains]->(b) SET a.blocksInheritance={}'.format(atype, btype, row.ContainerBlocksInheritance),
                props: [{ container: row.ContainerName.toUpperCase(), object: row.ObjectName.toUpperCase() }]
            };
        }
    });

    return datadict;
}

export function buildGplinkProps(rows){
    var datadict = {};

    $.each(rows, function (index, row) {
        var type = row.ObjectType.toTitleCase();

        if (datadict[type]){
            datadict[type].props.push({
                gponame: row.GPODisplayName.toUpperCase(),
                objectname: row.ObjectName.toUpperCase(),
                enforced: row.IsEnforced
            });
        }else{
            datadict[type] = {
                statement: 'UNWIND {props} as prop MERGE (a:Gpo {name: prop.gponame}) WITH a,prop MERGE (b:{} {name: prop.objectname}) WITH a,b,prop MERGE (a)-[r:GpLink {enforced: prop.enforced}]->(b)'.format(type),
                props:[{gponame: row.GPODisplayName.toUpperCase(), objectname: row.ObjectName.toUpperCase(), enforced: row.IsEnforced}]
            };
        }
    });
    return datadict;
}

export function buildACLProps(rows) {
    var datadict = {};

    $.each(rows, function(index, row) {
        var b = row.ObjectName.toUpperCase();
        var a = row.PrincipalName.toUpperCase();
        if (a === b){
            return;
        }
        var btype = row.ObjectType.toTitleCase();
        var atype = row.PrincipalType.toTitleCase();
        var rel = row.ActiveDirectoryRights;
        var extright = row.ACEType;

        var rights = [];

        if (extright === 'All'){
            rights.push("AllExtendedRights");
        }else if (extright === 'User-Force-Change-Password'){
            rights.push("ForceChangePassword");
        }else if (rel === "ExtendedRight"){
            rights.push(extright);
        }

        if (rel.includes("GenericAll")){
            rights.push("GenericAll");
        }

        if (rel.includes("WriteDacl")){
            rights.push("WriteDacl");
        }

        if (rel.includes("WriteOwner")){
            rights.push("WriteOwner");
        }

        if (rel.includes("GenericWrite")){
            rights.push("GenericWrite");
        }

        if (rel.includes("WriteProperty") && extright === "Member"){
            rights.push("AddMember");
        }

        if (rel.includes("Owner")){
            rights.push("Owns");
        }

        $.each(rights, function(index, record){
            var hash = (atype + record + btype).toUpperCase();
            if (btype === 'Computer') {
                return;
            }

            if (datadict[hash]) {
                datadict[hash].props.push({
                    account: a,
                    principal: b
                });
            } else {
                datadict[hash] = {
                    statement: 'UNWIND {props} AS prop MERGE (a:{} {name:prop.account}) WITH a,prop MERGE (b:{} {name: prop.principal}) WITH a,b,prop MERGE (a)-[r:{} {isACL:true}]->(b)'.format(atype, btype, record),
                    props: [{ account: a, principal: b }]
                };
            }
        });
    });

    return datadict;
}