import {groupBy} from 'lodash/collection'

var labels = [
    "OU",
    "GPO",
    "User",
    "Computer",
    "Group",
    "Domain"
];

export function generateUniqueId(sigmaInstance, isNode) {
    var i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
    if (isNode) {
        while (typeof sigmaInstance.graph.nodes(i) !== "undefined") {
            i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
        }
    } else {
        while (typeof sigmaInstance.graph.edges(i) !== "undefined") {
            i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
        }
    }

    return i;
}

function getRealLabel(label) {
    let ret = null;
    $.each(labels, (_, l) => {
        if (l.toLowerCase() === label.toLowerCase()) {
            ret = l;
        }
    });

    return ret;
}

export function buildSearchQuery(searchterm) {
    if (searchterm.includes(":")) {
        let [type, term] = searchterm.split(":");
        term = escapeRegExp(term);
        let t = "(?i).*" + term + ".*";
        type = getRealLabel(type);

        let statement = `MATCH (n:${type}) WHERE n.name =~ {name} OR n.guid =~ {name} RETURN n LIMIT 10`;

        return [statement, t];
    } else {
        let q = escapeRegExp(searchterm);
        let t = "(?i).*" + q + ".*";

        return ["MATCH (n) WHERE n.name =~ {name} OR n.guid =~ {name} RETURN n LIMIT 10", t];
    }
}

export function buildSelectQuery(start, end) {
    let startTerm, endTerm, apart, bpart;

    if (start.includes(':')) {
        let [type, search] = start.split(':')
        startTerm = search;
        type = getRealLabel(type);

        if (type === "OU" || type === "GPO") {
            apart = `MATCH (n:${type}) WHERE n.name =~ {aprop} OR n.guid =~ {aprop}`;
        } else {
            apart = `MATCH (n:${type}) WHERE n.name =~ {aprop}`;
        }
    } else {
        startTerm = start;
        apart = "MATCH (n) WHERE n.name =~ {aprop}"
    }

    if (end.includes(':')) {
        let [type, search] = end.split(':')
        endTerm = search;
        type = getRealLabel(type);

        if (type === "OU" || type === "GPO") {
            bpart = `MATCH (m:${type}) WHERE m.name =~ {bprop} OR m.guid =~ {bprop}`;
        } else {
            bpart = `MATCH (m:${type}) WHERE m.name =~ {bprop}`;
        }
    } else {
        endTerm = end;
        bpart = "MATCH (m) WHERE m.name =~ {bprop}"
    }

    let query = `${apart} ${bpart} MATCH p=allShortestPaths((n)-[r:{}*1..]->(m)) RETURN p`
    return [query, startTerm, endTerm];
}

//Recursive function to highlight paths to start/end nodes
export function findGraphPath(sigmaInstance, reverse, nodeid, traversed) {
    let target = reverse ? appStore.startNode : appStore.endNode;
    traversed.push(nodeid);
    //This is our stop condition for recursing
    if (nodeid !== target.id) {
        var edges = sigmaInstance.graph.adjacentEdges(nodeid);
        var nodes = reverse
            ? sigmaInstance.graph.inboundNodes(nodeid)
            : sigmaInstance.graph.outboundNodes(nodeid);
        //Loop over the nodes near us and the edges connecting to those nodes
        $.each(nodes, function (index, node) {
            $.each(edges, function (index, edge) {
                var check = reverse ? edge.source : edge.target;
                //If an edge is pointing in the right direction, set its color
                //Push the edge into our store and then
                node = parseInt(node);
                if (check === node && !traversed.includes(node)) {
                    edge.color = reverse ? "blue" : "red";
                    appStore.highlightedEdges.push(edge);
                    findGraphPath(sigmaInstance, reverse, node, traversed);
                }
            });
        });
    } else {
        return;
    }
}

export function clearSessions() {
    emitter.emit("openClearingModal");
    deleteSessions();
}

function deleteSessions() {
    var session = driver.session();
    session
        .run(
            "MATCH ()-[r:HasSession]-() WITH r LIMIT 100000 DELETE r RETURN count(r)"
        )
        .then(function (results) {
            session.close();
            emitter.emit("refreshDBData");
            var count = results.records[0]._fields[0];
            if (count === 0) {
                emitter.emit("hideDBClearModal");
            } else {
                deleteSessions();
            }
        });
}

export function clearDatabase() {
    emitter.emit("openClearingModal");
    deleteEdges();
}

function deleteEdges() {
    var session = driver.session();
    session
        .run("MATCH ()-[r]-() WITH r LIMIT 100000 DELETE r RETURN count(r)")
        .then(function (results) {
            emitter.emit("refreshDBData");
            session.close();
            var count = results.records[0]._fields[0];
            if (count === 0) {
                deleteNodes();
            } else {
                deleteEdges();
            }
        });
}

function deleteNodes() {
    var session = driver.session();
    session
        .run("MATCH (n) WITH n LIMIT 100000 DELETE n RETURN count(n)")
        .then(function (results) {
            emitter.emit("refreshDBData");
            session.close();
            var count = results.records[0]._fields[0];
            if (count === 0) {
                grabConstraints();
            } else {
                deleteNodes();
            }
        });
}

function grabConstraints() {
    var session = driver.session();
    let constraints = [];
    session.run("CALL db.constraints").then(function (results) {
        $.each(results.records, function (index, container) {
            let constraint = container._fields[0];
            let query = "DROP " + constraint;
            constraints.push(query);
        });

        session.close();

        dropConstraints(constraints);
    });
}

function dropConstraints(constraints) {
    if (constraints.length > 0) {
        let constraint = constraints.shift();
        let session = driver.session();
        session.run(constraint).then(function () {
            dropConstraints(constraints);
            session.close();
        });
    } else {
        grabIndexes();
    }
}

function grabIndexes() {
    var session = driver.session();
    let constraints = [];

    session.run("CALL db.indexes").then(function (results) {
        $.each(results.records, function (index, container) {
            let constraint = container._fields[0];
            let query = "DROP " + constraint;
            constraints.push(query);
        });

        session.close();

        dropIndexes(constraints);
    });
}

function dropIndexes(indexes) {
    if (indexes.length > 0) {
        let constraint = indexes.shift();
        let session = driver.session();
        session.run(constraint).then(function () {
            dropConstraints(indexes);
            session.close();
        });
    } else {
        addConstraints();
    }
}

export async function addConstraints() {
    let session = driver.session();
    await session.run('CREATE CONSTRAINT ON (c:User) ASSERT c.objectid IS UNIQUE');
    await session.run('CREATE CONSTRAINT ON (c:Group) ASSERT c.objectid IS UNIQUE');
    await session.run(
        'CREATE CONSTRAINT ON (c:Computer) ASSERT c.objectid IS UNIQUE'
    );
    await session.run('CREATE CONSTRAINT ON (c:GPO) ASSERT c.objectid IS UNIQUE');
    await session.run('CREATE CONSTRAINT ON (c:Domain) ASSERT c.objectid IS UNIQUE');
    await session.run('CREATE CONSTRAINT ON (c:OU) ASSERT c.objectid IS UNIQUE');
    await session.run('CREATE INDEX :User(name)');
    await session.run('CREATE INDEX :Group(name)');
    await session.run(
        'CREATE INDEX :Computer(name)'
    );
    await session.run('CREATE INDEX :GPO(name)');
    await session.run('CREATE INDEX :Domain(name)');
    await session.run('CREATE INDEX :OU(name)');
    session.close()

    emitter.emit("hideDBClearModal");
}

export function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
