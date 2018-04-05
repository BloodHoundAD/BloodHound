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

        if (rel.includes("Owner")){
            rights.push("Owns");
        }

        $.each(rights, function(index, record){
            var hash = (atype + record + btype).toUpperCase();
            if (btype === 'Computer') {
                return;
            }

            if (btype === 'GPO'){
                if (datadict[hash]) {
                    datadict[hash].props.push({
                        account: a,
                        principal: b,
                        guid: row.ObjectGuid
                    });
                } else {
                    datadict[hash] = {
                        statement: 'UNWIND {props} AS prop MERGE (a:{} {name:prop.account}) WITH a,prop MERGE (b:GPO {guid: prop.guid}) WITH a,b,prop MERGE (a)-[r:{} {isACL:true}]->(b) SET b.name=prop.principal'.format(atype, record),
                        props: [{ account: a, principal: b, guid:row.ObjectGuid }]
                    };
                }
            }else{
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
            }            
        });
    });

    return datadict;
}