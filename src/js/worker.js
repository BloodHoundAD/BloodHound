global.sigma = require('linkurious');
require('./sigma.helpers.graph.min.js');
Array.prototype.allEdgesSameType = function() {
    for (var i = 1; i < this.length; i++) {
        if (this[i].type !== this[0].type) return false;
    }

    return true;
};

var sigmaInstance = new sigma();

process.on('message', function(m) {
    var data = JSON.parse(m);
    var params = {
        edge: data.edge,
        sibling: data.sibling,
        start: data.start,
        end: data.end,
    };
    var spotlightData = {};
    sigmaInstance.graph.clear();
    sigmaInstance.graph.read(data.graph);
    sigmaInstance.graph.nodes().forEach(function(node) {
        node.degree = sigmaInstance.graph.degree(node.id);
    });
    var result = collapseEdgeNodes(sigmaInstance, params, spotlightData);
    sigmaInstance = result[0];
    spotlightData = result[1];
    //result = collapseSiblingNodes(sigmaInstance, params, spotlightData);
    //sigmaInstance = result[0];
    //spotlightData = result[1];
    sigmaInstance.graph.nodes().forEach(function(node) {
        if (!spotlightData.hasOwnProperty(node.id)) {
            spotlightData[node.id] = [node.label, 0, '', node.type, ''];
        }
    });
    var toSend = {
        nodes: sigmaInstance.graph.nodes(),
        edges: sigmaInstance.graph.edges(),
        spotlight: spotlightData,
    };
    process.send(toSend);
});

function collapseEdgeNodes(sigmaInstance, params, spotlightData) {
    var threshold = params.edge;

    if (threshold === 0) {
        return [sigmaInstance, spotlightData];
    }
    sigmaInstance.graph.nodes().forEach(function(node) {
        if (node.degree < threshold) {
            return;
        }

        if (params.end !== null && node.label === params.end) {
            return;
        }

        if (params.start !== null && node.label === params.start) {
            return;
        }

        sigmaInstance.graph.adjacentNodes(node.id).forEach(function(anode) {
            if (params.end !== null && anode.label === params.end) {
                return;
            }

            if (params.start !== null && anode.label === params.start) {
                return;
            }

            var edges = sigmaInstance.graph.adjacentEdges(anode.id);
            if (
                edges.length > 1 ||
                edges.length === 0 ||
                anode.folded.nodes.length > 0
            ) {
                return;
            }

            var edge = edges[0];

            if (
                anode.type_user ||
                anode.type_computer ||
                (anode.type_group && edge.label === 'AdminTo')
            ) {
                node.isGrouped = true;
                node.folded.nodes.push(anode);
                node.folded.edges.push(edge);
                spotlightData[anode.id] = [
                    anode.label,
                    node.id,
                    node.label,
                    anode.type,
                    node.type,
                ];
                sigmaInstance.graph.dropNode(anode.id);
            }
        });
        if (node.folded.nodes.length > 0) {
            node.glyphs.push({
                position: 'bottom-left',
                content: node.folded.nodes.length,
            });
        }
    });

    return [sigmaInstance, spotlightData];
}

function collapseSiblingNodes(sigmaInstance, params, spotlightData) {
    var threshold = params.sibling;

    if (threshold === 0) {
        return [sigmaInstance, spotlightData];
    }

    sigmaInstance.graph.nodes().forEach(function(node) {
        //Dont apply this logic to anything thats folded or isn't a computer
        if (!node.type_computer || node.folded.nodes.length > 0) {
            return;
        }

        if (params.end !== null && node.label === params.end) {
            return;
        }

        if (params.start !== null && node.label === params.start) {
            return;
        }

        //Start by getting all the edges attached to this node
        var adjacent = sigmaInstance.graph.adjacentEdges(node.id);
        var siblings = [];

        //Check to see if all the edges are the same type (i.e. AdminTo)
        if (adjacent.length > 1 && adjacent.allEdgesSameType()) {
            //Get the "parents" by mapping the source from every edge
            var parents = adjacent.map(function(e) {
                return e.source;
            });

            //Generate our string to compare other nodes to
            //by sorting the parents and turning it into a string
            var checkString = parents.sort().join(',');
            var testString;

            //Loop back over nodes in the graph and look for any nodes
            //with identical parents
            sigmaInstance.graph.nodes().forEach(function(node2) {
                testString = sigmaInstance.graph
                    .adjacentEdges(node2.id)
                    .map(function(e) {
                        return e.source;
                    })
                    .sort()
                    .join(',');
                if (testString === checkString) {
                    siblings.push(node2);
                }
            });

            if (siblings.length >= threshold) {
                //Generate a new ID for our grouped node
                var nodeId = generateUniqueId(sigmaInstance, true);

                sigmaInstance.graph.addNode({
                    id: nodeId,
                    x: node.x,
                    y: node.y,
                    degree: siblings.length,
                    label: 'Grouped Computers',
                    type: 'Computer',
                    type_computer: true,
                    groupedNode: true,
                    glyphs: [
                        {
                            position: 'bottom-left',
                            content: siblings.length,
                        },
                    ],
                    folded: {
                        nodes: [],
                        edges: [],
                    },
                });

                //Generate new edges for each parent going to our new node
                parents.forEach(function(parent) {
                    var id = generateUniqueId(sigmaInstance, false);

                    sigmaInstance.graph.addEdge({
                        id: id,
                        source: parent,
                        target: nodeId,
                        label: 'AdminTo',
                        neo4j_type: 'AdminTo',
                        size: 1,
                    });
                });

                var n = sigmaInstance.graph.nodes(nodeId);
                //Loop over all the siblings, and push the edges into our new parent node
                //Push the nodes in as well so we can unfold them
                siblings.forEach(function(sibling) {
                    sigmaInstance.graph
                        .adjacentEdges(sibling.id)
                        .forEach(function(edge) {
                            n.folded.edges.push(edge);
                        });

                    n.folded.nodes.push(sibling);
                    spotlightData[sibling.id] = [
                        sibling.label,
                        nodeId,
                        n.label,
                        sibling.type,
                        n.type,
                    ];
                    sigmaInstance.graph.dropNode(sibling.id);
                });
            }
        }
    });
    return [sigmaInstance, spotlightData];
}

function generateUniqueId(sigmaInstance, isNode) {
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
