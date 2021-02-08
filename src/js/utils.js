import { groupBy } from 'lodash/collection';

var labels = [
    'OU',
    'GPO',
    'User',
    'Computer',
    'Group',
    'Domain',
    'AZApp',
    'AZDevice',
    'AZGroup',
    'AZKeyVault',
    'AZResourceGroup',
    'AZServicePrincipal',
    'AZSubscription',
    'AZTenant',
    'AZUser',
    'AZVM',
];

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
    if (searchterm.includes(':')) {
        let [type, term] = searchterm.split(':');
        type = getRealLabel(type);

        let statement = `MATCH (n:${type}) WHERE n.name CONTAINS $name OR n.objectid CONTAINS $name RETURN n LIMIT 10`;

        return [statement, term.toUpperCase()];
    } else {
        return [
            'MATCH (n:Base) WHERE n.name CONTAINS $name OR n.objectid CONTAINS $name RETURN n LIMIT 10',
            searchterm.toUpperCase(),
        ];
    }
}

export function buildSelectQuery(startNode, endNode) {
    let apart = `MATCH (n:${startNode.type} {objectid: $sourceid})`;
    let bpart = `MATCH (m:${endNode.type} {objectid: $targetid})`;

    let query = `${apart} ${bpart} MATCH p=allShortestPaths((n)-[r:{}*1..]->(m)) RETURN p`;
    return [
        query,
        { sourceid: startNode.objectid, targetid: endNode.objectid },
        startNode.name || startNode.objectid,
        endNode.name || endNode.objectid,
    ];
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

export function clearSessions() {
    emitter.emit('openClearingModal');
    deleteSessions();
}

function deleteSessions() {
    var session = driver.session();
    session
        .run(
            'MATCH ()-[r:HasSession]-() WITH r LIMIT 100000 DELETE r RETURN count(r)'
        )
        .then(function (results) {
            session.close();
            emitter.emit('refreshDBData');
            var count = results.records[0]._fields[0];
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
    session
        .run('MATCH ()-[r]-() WITH r LIMIT 100000 DELETE r RETURN count(r)')
        .then(function (results) {
            emitter.emit('refreshDBData');
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
        .run('MATCH (n) WITH n LIMIT 100000 DELETE n RETURN count(n)')
        .then(function (results) {
            emitter.emit('refreshDBData');
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
    session.run('CALL db.constraints').then(function (results) {
        $.each(results.records, function (index, container) {
            let constraint = container._fields[0];
            let query;
            if (neoVersion.startsWith('3.')) {
                query = 'DROP ' + constraint;
            } else {
                query = 'DROP CONSTRAINT ' + constraint;
            }

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

    session.run('CALL db.indexes').then(function (results) {
        $.each(results.records, function (index, container) {
            let query;
            if (neoVersion.startsWith('3.')) {
                let constraint = container._fields[0];
                query = 'DROP ' + constraint;
            } else {
                let constraint = container._fields[1];
                query = 'DROP INDEX ' + constraint;
            }

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
    await session
        .run('CREATE CONSTRAINT ON (c:Base) ASSERT c.objectid IS UNIQUE')
        .catch((_) => {});
    await session.run('CREATE INDEX ON :User(name)').catch((_) => {});
    await session.run('CREATE INDEX ON :User(objectid)').catch((_) => {});
    await session.run('CREATE INDEX ON :Group(name)').catch((_) => {});
    await session.run('CREATE INDEX ON :Group(objectid)').catch((_) => {});
    await session.run('CREATE INDEX ON :Computer(name)').catch((_) => {});
    await session.run('CREATE INDEX ON :Computer(objectid)').catch((_) => {});
    await session.run('CREATE INDEX ON :GPO(name)').catch((_) => {});
    await session.run('CREATE INDEX ON :GPO(objectid)').catch((_) => {});
    await session.run('CREATE INDEX ON :Domain(name)').catch((_) => {});
    await session.run('CREATE INDEX ON :Domain(objectid)').catch((_) => {});
    await session.run('CREATE INDEX ON :OU(name)').catch((_) => {});
    await session.run('CREATE INDEX ON :OU(objectid)').catch((_) => {});
    await session.run('CREATE INDEX ON :Base(name)').catch((_) => {});
    session.close();

    emitter.emit('hideDBClearModal');
}

export function escapeRegExp(str) {
    return str.replace(/[\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
