const labels = [
    'Base',
    'Container',
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
    let i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
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
    let comp = label.toLowerCase()
    for (let l of labels){
        if (comp === l.toLowerCase()){

            ret = l;
            break;
        }
    }

    return ret;
}

export function buildSearchQuery(searchterm) {
    if (searchterm.includes(':')) {
        let [type, term] = searchterm.split(':');
        type = getRealLabel(type);

        let statement = `MATCH (n:${type}) WHERE n.name = $name OR n.azname=$name RETURN n LIMIT 10 UNION MATCH (n:${type}) WHERE n.name CONTAINS $name OR n.azname CONTAINS $name OR n.objectid CONTAINS $name RETURN n LIMIT 10`;

        return [statement, term.toUpperCase()];
    } else {
        return [
            'MATCH (n:Base) WHERE n.name = $name OR n.azname=$name RETURN n LIMIT 10 UNION MATCH (n) WHERE n.name CONTAINS $name OR n.azname CONTAINS $name OR n.objectid CONTAINS $name RETURN n LIMIT 10',
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
        let edges = sigmaInstance.graph.adjacentEdges(nodeid);
        let nodes = reverse
            ? sigmaInstance.graph.inboundNodes(nodeid)
            : sigmaInstance.graph.outboundNodes(nodeid);
        //Loop over the nodes near us and the edges connecting to those nodes
        $.each(nodes, function (index, node) {
            $.each(edges, function (index, edge) {
                let check = reverse ? edge.source : edge.target;
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

export async function clearSessions() {
    emitter.emit('openClearingModal');
    await deleteSessions();
}

async function deleteSessions() {
    let session = driver.session();
    let results = await session.run('MATCH ()-[r:HasSession]-() WITH r LIMIT 100000 DELETE r RETURN count(r)')
    let count = results.records[0].get(0)
    if (count === 0){
        emitter.emit('hideDBClearModal')
    }else{
        await deleteSessions()
    }
}

export async function clearDatabase() {
    emitter.emit('openClearingModal');
    await deleteEdges();
}

async function deleteEdges() {
    let session = driver.session();
    let results = await session.run('MATCH ()-[r]-() WITH r LIMIT 100000 DELETE r RETURN count(r)')
    emitter.emit('refreshDBData')
    let count = results.records[0].get(0)
    await session.close()

    if (count === 0){
        await deleteNodes()
    }else{
        await deleteEdges()
    }

}

async function deleteNodes() {
    let session = driver.session();
    let results = await session.run('MATCH (n) WITH n LIMIT 100000 DELETE n RETURN count(n)')
    emitter.emit('refreshDBData')
    let count = results.records[0].get(0)
    await session.close()

    if (count === 0){
        await dropConstraints()
    }else{
        await deleteNodes()
    }
}

async function dropConstraints() {
    let session = driver.session();
    let constraints = [];
    let result = await session.run('CALL db.constraints')

    for (let record of result.records){
        let constraint = record.get(0)
        let query;
        if (neoVersion.startsWith('3.')){
            query = 'DROP ' + constraint
        }else{
            query = 'DROP CONSTRAINT ' + constraint
        }

        constraints.push(query)
    }

    for (let constraintQuery of constraints){
        await session.run(constraintQuery)
    }

    await session.close()

    await dropIndexes()
}

async function dropIndexes() {
    let session = driver.session();
    let indexes = [];

    let result = await session.run('CALL db.constraints')

    for (let record of result.records){
        let constraint = record.get(0)
        let query;
        if (neoVersion.startsWith('3.')){
            query = 'DROP ' + constraint
        }else{
            query = 'DROP INDEX ' + constraint
        }

        indexes.push(query)
    }

    for (let indexQuery of indexes){
        await session.run(indexQuery)
    }

    await session.close()

    await setSchema()
}


export async function setSchema() {
    const luceneIndexProvider = "lucene+native-3.0"
    let labels = ["User", "Group", "Computer", "GPO", "OU", "Domain", "Container", "Base", "AZApp", "AZDevice", "AZGroup", "AZKeyVault", "AZResourceGroup", "AZServicePrincipal", "AZTenant", "AZUser", "AZVM"]
    let azLabels = ["AZApp", "AZDevice", "AZGroup", "AZKeyVault", "AZResourceGroup", "AZServicePrincipal", "AZTenant", "AZUser", "AZVM"]
    let schema = {}
    for (let label of labels){
        schema[label] = {
            name: label,
            indexes: [{
                name: "{}_{}_index".format(label.toLowerCase(), "name"),
                provider: luceneIndexProvider,
                property: "name"
            }],
            constraints: [{
                name: "{}_{}_constraint".format(label.toLowerCase(), "objectid"),
                provider: luceneIndexProvider,
                property: "objectid"
            }],
        }
    }

    for (let label of azLabels) {
        schema[label]["indexes"].push({
            name: "{}_{}_index".format(label.toLowerCase(), "azname"),
            provider: luceneIndexProvider,
            property: "azname"
        })
    }

    let session = driver.session();

    for (let label of labels){
        for (let constraint of schema[label].constraints){
            let props = {
                name: constraint.name,
                label: [label],
                properties: [constraint.property],
                provider: constraint.provider
            }
            try{

                await session.run("CALL db.createUniquePropertyConstraint($name, $label, $properties, $provider)", props)
            }catch (e) {
                //console.error(e)
            }
        }

        for (let index of schema[label].indexes) {
            let props = {
                name: index.name,
                label: [label],
                properties: [index.property],
                provider: index.provider
            }
            try{

                await session.run("CALL db.createIndex($name, $label, $properties, $provider)", props)
            }catch (e) {
                //console.error(e)
            }

        }
    }
    
    await session.close();

    emitter.emit('hideDBClearModal');
}

export function escapeRegExp(str) {
    return str.replace(/[\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
