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
                grabConstraints();
            } else {
                deleteNodes();
            }
        });
}

function grabConstraints(){
    var session = driver.session();
    let constraints = [];
    session.run("CALL db.constraints")
        .then(function(results){
            $.each(results.records, function(index, container){
                let constraint = container._fields[0];
                let query = "DROP " + constraint;
                constraints.push(query);
            });

            session.close();

            dropConstraints(constraints);
        });
}

function dropConstraints(constraints){
    if (constraints.length > 0){
        let constraint = constraints.shift();
        let session = driver.session();
        session.run(constraint)
            .then(function(){
                dropConstraints(constraints);
                session.close();
            });
    }else{
        grabIndexes();
    }
}

function grabIndexes(){
    var session = driver.session();
    let constraints = [];

    session.run("CALL db.indexes")
        .then(function (results) {
            $.each(results.records, function (index, container) {
                let constraint = container._fields[0];
                let query = "DROP " + constraint;
                constraints.push(query);
            });

            session.close();

            dropIndexes(constraints);
        });
}

function dropIndexes(indexes){
    if (indexes.length > 0) {
        let constraint = indexes.shift();
        let session = driver.session();
        session.run(constraint)
            .then(function () {
                dropConstraints(indexes);
                session.close();
            });
    } else {
        addConstraints();
    }
}

function addConstraints(){
    var s1 = driver.session();
    var s2 = driver.session();
    var s3 = driver.session();
    var s4 = driver.session();
    var s5 = driver.session();
    var s6 = driver.session();

    s1.run("CREATE CONSTRAINT ON (c:User) ASSERT c.name IS UNIQUE")
        .then(function () {
            s1.close();
            s2.run("CREATE CONSTRAINT ON (c:Computer) ASSERT c.name IS UNIQUE")
                .then(function () {
                    s2.close();
                    s3.run("CREATE CONSTRAINT ON (c:Group) ASSERT c.name IS UNIQUE")
                        .then(function () {
                            s3.close();
                            s4.run("CREATE CONSTRAINT ON (c:Domain) ASSERT c.name IS UNIQUE")
                                .then(function () {
                                    s4.close();
                                    s5.run("CREATE CONSTRAINT on (c:OU) ASSERT c.guid IS UNIQUE")
                                        .then(function () {
                                            s5.close();
                                            s6.run("CREATE CONSTRAINT on (c:GPO) ASSERT c.name is UNIQUE")
                                                .then(function () {
                                                    s6.close();
                                                })
                                                .catch(function () {
                                                    s6.close();
                                                });
                                        })
                                        .catch(function () {
                                            s5.close();
                                        });
                                })
                                .catch(function () {
                                    s4.close();
                                });
                        })
                        .catch(function () {
                            s3.close();
                        });
                })
                .catch(function () {
                    s2.close();
                });
        })
        .catch(function () {
            s1.close();
        });

    emitter.emit('hideDBClearModal');
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

function getDomainFromLabel(label, type){
    if (type === 'Domain'){
        return label;
    }
    if (label.includes('@')){
        return label.split('@').pop();
    }else{
        let d = label.split('.');
        d.shift();
        return d.join('.');
    }
}

export function buildGroupMembershipProps(rows) {
    var datadict = {};

    $.each(rows, function (index, row) {
        let type = row.AccountType.toTitleCase();
        let account = row.AccountName.toUpperCase();
        let group = row.GroupName.toUpperCase();

        if (datadict[type]){
            datadict[type].props.push({
                accountName: account,
                accountDomain: getDomainFromLabel(account, type),
                groupName: group,
                groupDomain: getDomainFromLabel(group, "group")
            });
        }else{
            datadict[type] = {
                statement: `UNWIND {props} AS prop MERGE (a:{} {name:prop.accountName}) WITH a,prop MERGE (b:Group {name:prop.groupName}) WITH a,b,prop MERGE (a)-[r:MemberOf {isACL:false}]->(b) SET a.domain=prop.accountDomain,b.domain=prop.groupDomain`.format(type),
                props:[{
                    accountName: account,
                    accountDomain: getDomainFromLabel(account, type),
                    groupName: group,
                    groupDomain: getDomainFromLabel(group, "group")
                }]
            };
        }
    });

    return datadict;
}

export function buildLocalAdminProps(rows) {
    var datadict = {};

    $.each(rows, function (index, row) {
        let type = row.AccountType.toTitleCase();
        let account = row.AccountName.toUpperCase();
        let computer = row.ComputerName.toUpperCase();

        if (datadict[type]) {
            datadict[type].props.push({
                accountName: account,
                accountDomain: getDomainFromLabel(account, type),
                computerName: computer,
                computerDomain: getDomainFromLabel(computer, "computer")
            });
        } else {
            datadict[type] = {
                statement: `UNWIND {props} AS prop MERGE (a:{} {name:prop.accountName}) WITH a,prop MERGE (b:Computer {name:prop.computerName}) WITH a,b,prop MERGE (a)-[r:AdminTo {isACL: false}]->(b) SET a.domain=prop.accountDomain, b.domain=prop.computerDomain`.format(type),
                props: [{
                    accountName: account,
                    accountDomain: getDomainFromLabel(account, type),
                    computerName: computer,
                    computerDomain: getDomainFromLabel(computer, "computer")
                }]
            };
        }
    });

    return datadict;
}

export function buildSessionProps(rows) {
    var datadict = {};

    $.each(rows, function (index, row) {
        let account = row.UserName.toUpperCase();
        let computer = row.ComputerName.toUpperCase();

        if (datadict['user']) {
            datadict['user'].props.push({
                accountName: account,
                accountDomain: getDomainFromLabel(account, "user"),
                computerName: computer,
                computerDomain: getDomainFromLabel(computer, "computer"),
                weight: row.Weight
            });
        } else {
            datadict['user'] = {
                statement: `UNWIND {props} AS prop MERGE (a:User {name:prop.accountName}) WITH a,prop MERGE (b:Computer {name: prop.computerName}) WITH a,b,prop MERGE (b)-[:HasSession {Weight : prop.weight, isACL:false}]-(a) SET a.domain=prop.accountDomain,b.domain=prop.computerDomain`,
                props: [{
                    accountName: account,
                    accountDomain: getDomainFromLabel(account, "user"),
                    computerName: computer,
                    computerDomain: getDomainFromLabel(computer, "computer"),
                    weight: row.Weight
                }]
            };
        }
    });

    return datadict;
}

export function buildDomainProps(rows) {
    var datadict = {};

    datadict['domain'] = {
        statement: 'UNWIND {props} AS prop MERGE (domain1:Domain {name: prop.domain1}) WITH domain1,prop MERGE (domain2:Domain {name: prop.domain2}) WITH domain1,domain2,prop MERGE (domain1)-[:TrustedBy {TrustType : prop.trusttype, Transitive: toBoolean(prop.transitive), isACL:false}]->(domain2) SET domain1.domain=prop.domain1,domain2.domain=prop.domain2',
        props: []
    };

    $.each(rows, function (index, row) {
        let type = row.TrustDirection;
        let domaina = row.TargetDomain.toUpperCase();
        let domainb = row.SourceDomain.toUpperCase();
        
        switch (type){
            case 'Inbound':
                datadict['domain'].props.push({
                    domain1: domaina,
                    domain2: domainb,
                    trusttype: row.TrustType,
                    transitive: row.Transitive
                });
                break;
            case 'Outbound':
                datadict['domain'].props.push({
                    domain1: domainb,
                    domain2: domaina,
                    trusttype: row.TrustType,
                    transitive: row.Transitive
                });
                break;
            case 'Bidirectional':
                datadict['domain'].props.push({
                    domain1: domaina,
                    domain2: domainb,
                    trusttype: row.TrustType,
                    transitive: row.Transitive
                });
                datadict['domain'].props.push({
                    domain1: domainb,
                    domain2: domaina,
                    trusttype: row.TrustType,
                    transitive: row.Transitive
                });
                break;
        }
    });

    return datadict;
}

export function buildStructureProps(rows){
    let datadict = {};

    $.each(rows, function(index, row){
        let hash = (row.ContainerType + row.ObjectType).toUpperCase();
        let atype = row.ContainerType;
        let btype = row.ObjectType;
        let aguid = row.ContainerGUID;
        let bguid = row.ObjectId;

        if (atype === 'ou'){
            atype = 'OU';
        }else{
            atype = atype.toTitleCase();
        }

        if (btype === 'ou') {
            btype = 'OU';
        } else {
            btype = btype.toTitleCase();
        }

        let container = row.ContainerName.toUpperCase();
        let object = row.ObjectName.toUpperCase();

        if (atype === 'OU' && btype === 'OU') {
            if (datadict[hash]){
                datadict[hash].props.push({
                    container: container,
                    object: object,
                    containerDomain: getDomainFromLabel(container, atype),
                    objectDomain: getDomainFromLabel(object, btype),
                    blocksInheritance: row.ContainerBlocksInheritance,
                    containerGuid: aguid,
                    objectGuid: bguid
                });
            }else{
                datadict[hash] = {
                    statement: 'UNWIND {props} AS prop MERGE (a:OU {guid:prop.containerGuid}) WITH a,prop MERGE (b:OU {guid:prop.objectGuid}) WITH a,b,prop MERGE (a)-[r:Contains {isACL: false}]->(b) SET a.blocksInheritance=toBoolean(prop.blocksInheritance), a.domain=prop.containerDomain, b.domain=prop.objectDomain, a.name=prop.container, b.name=prop.object',
                    props: [{
                        container: container,
                        object: object,
                        containerDomain: getDomainFromLabel(container, atype),
                        objectDomain: getDomainFromLabel(object, btype),
                        blocksInheritance: row.ContainerBlocksInheritance,
                        containerGuid: aguid,
                        objectGuid: bguid
                    }]
                };
            }
        }else if (atype === 'OU'){
            if (datadict[hash]) {
                datadict[hash].props.push({
                    container: container,
                    object: object,
                    containerDomain: getDomainFromLabel(container, "OU"),
                    objectDomain: getDomainFromLabel(object, btype),
                    blocksInheritance: row.ContainerBlocksInheritance,
                    containerGuid: row.ContainerGUID
                });
            } else {
                datadict[hash] = {
                    statement: 'UNWIND {props} AS prop MERGE (a:OU {guid:prop.containerGuid}) WITH a,prop MERGE (b:{} {name:prop.object}) WITH a,b,prop MERGE (a)-[r:Contains {isACL: false}]->(b) SET a.blocksInheritance=toBoolean(prop.blocksInheritance), a.domain=prop.containerDomain, b.domain=prop.objectDomain, a.name=prop.container'.format(btype),
                    props: [{
                        container: container,
                        object: object,
                        containerDomain: getDomainFromLabel(container, "OU"),
                        objectDomain: getDomainFromLabel(object, btype),
                        blocksInheritance: row.ContainerBlocksInheritance,
                        containerGuid: row.ContainerGUID
                    }]
                };
            }
        }else if (btype === 'OU'){
            if (datadict[hash]) {
                datadict[hash].props.push({
                    container: container,
                    object: object,
                    containerDomain: getDomainFromLabel(container, atype),
                    objectDomain: getDomainFromLabel(object, "OU"),
                    blocksInheritance: row.ContainerBlocksInheritance,
                    objectGuid: row.ObjectId
                });
            } else {
                datadict[hash] = {
                    statement: 'UNWIND {props} AS prop MERGE (a:{} {name:prop.container}) WITH a,prop MERGE (b:OU {guid:prop.objectGuid}) WITH a,b,prop MERGE (a)-[r:Contains {isACL: false}]->(b) SET a.blocksInheritance=toBoolean(prop.blocksInheritance), a.domain=prop.containerDomain, b.domain=prop.objectDomain, b.name=prop.object'.format(atype),
                    props: [{
                        container: container,
                        object: object,
                        containerDomain: getDomainFromLabel(container, atype),
                        objectDomain: getDomainFromLabel(object, "OU"),
                        blocksInheritance: row.ContainerBlocksInheritance,
                        objectGuid: row.ObjectId
                    }]
                };
            }
        }else{
            if (datadict[hash]) {
                datadict[hash].props.push({
                    container: container,
                    object: object,
                    containerDomain: getDomainFromLabel(container, atype),
                    objectDomain: getDomainFromLabel(object, btype),
                    blocksInheritance: row.ContainerBlocksInheritance
                });
            } else {
                datadict[hash] = {
                    statement: 'UNWIND {props} AS prop MERGE (a:{} {name:prop.container}) WITH a,prop MERGE (b:{} {name: prop.object}) WITH a,b,prop MERGE (a)-[r:Contains {isACL: false}]->(b) SET a.blocksInheritance=toBoolean(prop.blocksInheritance), a.domain=prop.containerDomain, b.domain=prop.objectDomain'.format(atype, btype),
                    props: [{
                        container: container,
                        object: object,
                        containerDomain: getDomainFromLabel(container, atype),
                        objectDomain: getDomainFromLabel(object, btype),
                        blocksInheritance: row.ContainerBlocksInheritance
                    }]
                };
            }
        }
    });

    return datadict;
}

export function buildGplinkProps(rows){
    let datadict = {};

    $.each(rows, function (index, row) {
        let type = row.ObjectType;
        let gpoName = row.GPODisplayName.toUpperCase();
        let objectName = row.ObjectName.toUpperCase();

        if (type === 'ou') {
            type = 'OU';
        } else {
            type = type.toTitleCase();
        }

        if (type === 'OU'){
            if (datadict[type]) {
                datadict[type].props.push({
                    gponame: gpoName,
                    objectname: objectName,
                    enforced: row.IsEnforced,
                    gpoDomain: getDomainFromLabel(gpoName, "GPO"),
                    objectDomain: getDomainFromLabel(objectName, "OU"),
                    objectGuid: row.ObjectGUID,
                    gpoGuid: row.GPOGuid
                });
            } else {
                datadict[type] = {
                    statement: 'UNWIND {props} as prop MERGE (a:GPO {name: prop.gponame}) WITH a,prop MERGE (b:OU {guid: prop.objectGuid}) WITH a,b,prop MERGE (a)-[r:GpLink {enforced: toBoolean(prop.enforced), isACL: false}]->(b) SET a.guid=prop.gpoGuid,b.name=prop.objectName,a.domain=prop.gpoDomain,b.domain=prop.objectDomain',
                    props: [{
                        gponame: gpoName,
                        objectname: objectName,
                        enforced: row.IsEnforced,
                        gpoDomain: getDomainFromLabel(gpoName, "GPO"),
                        objectDomain: getDomainFromLabel(objectName, "OU"),
                        objectGuid: row.ObjectGUID,
                        gpoGuid: row.GPOGuid
                    }]
                };
            }
        }else{
            if (datadict[type]) {
                datadict[type].props.push({
                    gponame: gpoName,
                    objectname: objectName,
                    enforced: row.IsEnforced,
                    gpoDomain: getDomainFromLabel(gpoName, "GPO"),
                    objectDomain: getDomainFromLabel(objectName, type),
                    gpoGuid: row.GPOGuid
                });
            } else {
                datadict[type] = {
                    statement: 'UNWIND {props} as prop MERGE (a:GPO {name: prop.gponame}) WITH a,prop MERGE (b:{} {name: prop.objectname}) WITH a,b,prop MERGE (a)-[r:GpLink {enforced: toBoolean(prop.enforced), isACL: false}]->(b) SET a.guid=prop.gpoGuid,a.domain=prop.gpoDomain,b.domain=prop.objectDomain'.format(type),
                    props: [{
                        gponame: gpoName,
                        objectname: objectName,
                        enforced: row.IsEnforced,
                        gpoDomain: getDomainFromLabel(gpoName, "GPO"),
                        objectDomain: getDomainFromLabel(objectName, type),
                        gpoGuid: row.GPOGuid
                    }]
                };
            }
        }
        
    });
    return datadict;
}

function processAceArray(array, objname, objtype, output){
    let baseAceQuery = 'UNWIND {props} AS prop MERGE (a:{} {name:prop.principal}) MERGE (b:{} {name: prop.obj}) MERGE (a)-[r:{} {isacl:true}]->(b)'

    $.each(array, function(_, ace){
        let principal = ace.PrincipalName;
        let principaltype = ace.PrincipalType;
        let right = ace.RightName;
        let acetype = ace.AceType;

        if (objname === principal){
            return;
        }
        
        let rights = []

        //Process the right/type to figure out the ACEs we need to add
        if (acetype === 'All'){
            rights.push('AllExtendedRights');
        }else if (acetype === 'User-Force-Change-Password'){
            rights.push('ForceChangePassword');
        }else if (acetype === 'Member'){
            rights.push('AddMember');
        }else if (right === 'ExtendedRight'){
            rights.push(acetype);
        }

        if (right.includes('GenericAll')){
            rights.push('GenericAll');
        }

        if (right.includes('WriteDacl')){
            rights.push('WriteDacl');
        }

        if (right.includes('WriteOwner')){
            rights.push('WriteOwner');
        }

        if (right.includes('GenericWrite')){
            rights.push('GenericWrite');
        }

        if (right === 'Owner'){
            rights.push('Owns');
        }

        $.each(rights, function(_, right){
            let hash = right + principaltype;
            let formatted = baseAceQuery.format(principaltype.toTitleCase(), objtype, right);

            insert(output, hash, formatted, {principal:principal,obj:objname});
        })
    })
}

export function buildDomainJson(chunk){
    let queries = {}
    queries.properties = {
        statement: "UNWIND {props} AS prop MERGE (n:Domain {name:prop.name}) SET n += prop.map",
        props: []
    };

    queries.links = {
        statement: 'UNWIND {props} as prop MERGE (n:Domain {name:prop.domain}) MERGE (m:GPO {name:prop.gpo}) MERGE (m)-[r:GpLink {enforced:prop.enforced, isacl:false}]->(n)',
        props: []
    }

    queries.trusts = {
        statement: 'UNWIND {props} AS prop MERGE (n:Domain {name: prop.a}) MERGE (m:Domain {name: prop.b}) MERGE (n)-[:TrustedBy {trusttype : prop.trusttype, transitive: prop.transitive, isacl:false}]->(m)',
        props: []
    }

    queries.childous = {
        statement: "UNWIND {props} AS prop MERGE (n:Domain {name:prop.domain}) MERGE (m:OU {guid:prop.guid}) MERGE (n)-[r:Contains]->(m)",
        props : []
    }

    queries.computers = {
        statement: "UNWIND {props} AS prop MERGE (n:Domain {name:prop.domain}) MERGE (m:Computer {name:prop.comp}) MERGE (n)-[r:Contains]->(m)",
        props:[]
    }

    queries.users = {
        statement: "UNWIND {props} AS prop MERGE (n:Domain {name:prop.domain}) MERGE (m:User {name:prop.user}) MERGE (n)-[r:Contains]->(m)",
        props:[]
    }

    $.each(chunk, function(_, domain){
        let name = domain.Name;
        let properties = domain.Properties;

        queries.properties.props.push({map:properties, name:name});
        
        let links = domain.Links;
        $.each(links, function(_, link){
            let enforced = link.IsEnforced;
            let target = link.Name;

            queries.links.props.push({domain:name, gpo:target,enforced:enforced});
        });

        let trusts = domain.Trusts;
        $.each(trusts, function(_, trust){
            let target = trust.TargetName;
            let transitive = trust.IsTransitive;
            let direction = trust.TrustDirection;
            let type = trust.TrustType;

            switch (direction){
                case 0:
                    queries.trusts.props.push({a: target, b: name, transitive: transitive, trusttype: type});
                    break;
                case 1:
                    queries.trusts.props.push({a: name, b: target, transitive: transitive, trusttype: type});
                    break;
                case 2:
                    queries.trusts.props.push({a: name, b: target, transitive: transitive, trusttype: type});
                    queries.trusts.props.push({a: target, b: name, transitive: transitive, trusttype: type});
                    break;
            }
        });

        let aces = domain.Aces;
        processAceArray(aces, name, "Domain", queries);        

        let childous = domain.ChildOus;

        $.each(childous, function(_, ou){
            queries.childous.props.push({domain:name, guid:ou})
        })

        let comps = domain.Computers;
        $.each(comps, function(_, computer){
            queries.computers.props.push({domain:name, comp:computer})
        })

        let users = domain.Users
        $.each(users, function(_, user){
            queries.users.props.push({domain: name, user:user});
        });
    });
    
    return queries;
}

export function buildGpoJson(chunk){
    let queries = {}
    queries.properties = {
        statement: "UNWIND {props} AS prop MERGE (n:GPO {name:prop.name}) SET n.guid=prop.guid",
        props: []
    }

    $.each(chunk, function(_, gpo){
        let name = gpo.Name;
        let guid = gpo.Guid;
        queries.properties.props.push({name:name, guid:guid});

        let aces = gpo.Aces;
        processAceArray(aces, name, "GPO", queries);
    });

    return queries;
}

export function buildGroupJson(chunk){
    let queries = {}
    queries.properties = {
        statement: "UNWIND {props} AS prop MERGE (n:Group {name:prop.name}) SET n += prop.map",
        props: []
    }

    let baseStatement = "UNWIND {props} AS prop MERGE (n:Group {name: prop.name}) MERGE (m:{} {name:prop.member}) MERGE (m)-[r:MemberOf]->(n)";

    $.each(chunk, function(_, group){
        let name = group.Name;
        let properties = group.Properties;

        queries.properties.props.push({map:properties, name:name});

        let aces = group.Aces;
        processAceArray(aces, name, "Group", queries);

        let members = group.Members;
        $.each(members, function(_, member){
            let mname = member.MemberName;
            let mtype = member.MemberType;

            let statement = baseStatement.format(mtype.toTitleCase())
            insert(queries, mtype, statement, {name: name, member: mname})
        });
    });

    return queries
}

export function buildOuJson(chunk){
    let queries = {};

    queries.properties = {
        statement: "UNWIND {props} AS prop MERGE (n:OU {guid:prop.guid}) SET n += prop.map",
        props: []
    }

    queries.childous = {
        statement: "UNWIND {props} AS prop MERGE (n:OU {guid:prop.parent}) MERGE (m:OU {guid:prop.child}) MERGE (n)-[r:Contains]->(m)",
        props : []
    }

    queries.computers = {
        statement: "UNWIND {props} AS prop MERGE (n:OU {guid:prop.ou}) MERGE (m:Computer {name:prop.comp}) MERGE (n)-[r:Contains]->(m)",
        props:[]
    }

    queries.users = {
        statement: "UNWIND {props} AS prop MERGE (n:OU {guid:prop.ou}) MERGE (m:User {name:prop.user}) MERGE (n)-[r:Contains]->(m)",
        props:[]
    }

    $.each(chunk, function(_, ou){
        let guid = ou.Guid;
        let properties = ou.Properties;

        queries.properties.props.push({guid:guid, map: properties});

        let childous = ou.ChildOus;
        $.each(childous, function(_, cou){
            queries.childous.props.push({parent: guid, child: cou});
        })

        let computers = ou.Computers;
        $.each(computers, function(_, computer){
            queries.computers.props.push({ou:guid, comp:computer})
        })

        let users = ou.Users
        $.each(users, function(_, user){
            queries.users.props.push({ou: guid, user:user});
        });
    })

    return queries;
}

export function buildSessionJson(chunk){
    let queries = {}
    queries.sessions = {
        statement:"UNWIND {props} AS prop MERGE (n:User {name:prop.user}) MERGE (m:Computer {name:prop.comp}) MERGE (m)-[r:HasSession {weight: prop.weight, isacl:false}]->(n)",
        props: []
    }

    $.each(chunk, function(_, session){
        let name = session.UserName;
        let comp = session.ComputerName;
        let weight = session.Weight;

        queries.sessions.props.push({user: name, comp: comp, weight: weight})
    })
    return queries;
}

export function buildGpoAdminJson(chunk){
    let queries = {}
    
    let baseQuery = "UNWIND {props} AS prop MERGE (n:{} {name:prop.admin}) MERGE (m:Computer {name:prop.comp}) MERGE (n)-[r:AdminTo {isacl:false}]->(m)"
    $.each(chunk, function(_, gpoadmin){
        let comp = gpoadmin.Computer;
        let admin = gpoadmin.Name;
        let type = gpoadmin.Type;

        let query = baseQuery.format(type.toTitleCase());
        insert(queries, type, query, {admin: admin, comp:comp})
    });

    return queries;
}

export function buildUserJson(chunk){
    let queries = {}

    $.each(chunk, function(_, user){
        let name = user.Name;
        let properties = user.Properties;
        let primarygroup = user.PrimaryGroup;

        if (!queries.properties){
            if (primarygroup === null){
                queries.properties = {
                    statement:"UNWIND {props} AS prop MERGE (n:User {name:prop.name}) SET n += prop.map",
                    props:[]
                }
            }else{
                queries.properties = {
                    statement:"UNWIND {props} AS prop MERGE (n:User {name:prop.name}) MERGE (m:Group {name:prop.pg}) MERGE (n)-[r:MemberOf {isacl:false}]->(m) SET n += prop.map",
                    props:[]
                }
            }
        }

        queries.properties.props.push({map:properties, name:name, pg: primarygroup});

        let aces = user.Aces;
        processAceArray(aces, name, "User", queries);
    });
    return queries
}

export function buildComputerJson(chunk){
    let queries = {}
    let baseQuery = "UNWIND {props} AS prop MERGE (n:Computer {name:prop.name}) MERGE (m:{} {name:prop.target}) MERGE (m)-[r:{}]->(n)"

    $.each(chunk, function(_, comp){
        let name = comp.Name;
        let properties = comp.Properties;
        let localadmins = comp.LocalAdmins;
        let rdpers = comp.RemoteDesktopUsers;
        let primarygroup = comp.PrimaryGroup;

        if (!queries.properties){
            if (primarygroup === null){
                queries.properties = {
                    statement:"UNWIND {props} AS prop MERGE (n:Computer {name:prop.name}) SET n += prop.map",
                    props:[]
                }
            }else{
                queries.properties = {
                    statement:"UNWIND {props} AS prop MERGE (n:Computer {name:prop.name}) MERGE (m:Group {name:prop.pg}) MERGE (n)-[r:MemberOf]->(m) SET n += prop.map",
                    props:[]
                }
            }
        }

        queries.properties.props.push({map:properties, name:name, pg: primarygroup});
        $.each(localadmins, function(_, admin){
            let aType = admin.Type;
            let aName = admin.Name;
            let rel = "AdminTo";

            let hash = rel+aType;

            let statement = baseQuery.format(aType, rel);
            let p = {name: name, target: aName};
            insert(queries,hash,statement,p);
        })

        $.each(rdpers, function(_, rdp){
            let aType = rdp.Type;
            let aName = rdp.Name;
            let rel = "CanRDP";

            let hash = rel+aType;

            let statement = baseQuery.format(aType, rel);
            let p = {name: name, target: aName};
            insert(queries,hash,statement,p);
        })
    });
    return queries
}

function insert(obj, hash, statement, prop){
    if (obj[hash]){
        obj[hash].props.push(prop)
    }else{
        obj[hash] = {}
        obj[hash].statement = statement;
        obj[hash].props = []
        obj[hash].props.push(prop)
    }
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
        if (btype === 'Gpo'){
            btype = 'GPO';
        }
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

        if (rel === "Owner"){
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

export function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
