var indexes, 
	edge, 
	sibling,
	spotlightData,
	adjacentNodes,
	adjacentEdges,
	idMap,
	edgeMap;

Array.prototype.allEdgesSameType = function() {
    for (var i = 1; i < this.length; i++) {
        if (this[i].neo4j_type !== this[0].neo4j_type)
            return false;
    }

    return true;
};

process.on('message', function(m){
	adjacentNodes = {}
	adjacentEdges = {}
	idMap =  {}
	spotlightData = {}
	edgeMap = {}

	var data = JSON.parse(m)

	buildIndexes(data)
	edge = data.edge;
	sibling = data.sibling

	processEdgeNodes(data)
	processSiblings(data)

	data.nodes = []
	data.edges = []

	Object.keys(idMap).forEach(function(i){
		data.nodes.push(idMap[i])
	})

	Object.keys(edgeMap).forEach(function(i){
		data.edges.push(edgeMap[i])
	})

	data.spotlightData = spotlightData

	data.nodes.forEach(function(node){
		if (!spotlightData.hasOwnProperty(node.id)){
			spotlightData[node.id] = [node.neo4j_data.name, 0, ""]
		}
	})
	process.send(data)
})

function generateUniqueId(isNode){
	var i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
	if (isNode){
		while (idMap.hasOwnProperty(i)){
			i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
		}
	}else{
		while (edgeMap.hasOwnProperty(i)){
			i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
		}
	}

	return i
}

function buildIndexes(graph){
	graph.nodes.forEach(function(node){
		idMap[node.id] = node
		adjacentNodes[node.id] = []
		adjacentEdges[node.id] = []
	})

	graph.edges.forEach(function(edge){
		adjacentNodes[edge.target].push(idMap[edge.source])
		adjacentNodes[edge.source].push(idMap[edge.target])
		adjacentEdges[edge.source].push(edge)
		adjacentEdges[edge.target].push(edge)
		edgeMap[edge.id] = edge
	})
}

function processEdgeNodes(graph){
	if (edge === 0){
		return graph;
	}

	Object.keys(idMap).forEach(function(id){
		var node = idMap[id]

		if (typeof node === 'undefined'){
			return
		}

		adjacentNodes[node.id].forEach(function(anode){
			if (typeof graph.endNode !== 'undefined' && anode.neo4j_data.name === graph.endNode.neo4j_data.name){
				return
			}

			if (typeof graph.startNode !== 'undefined' && anode.neo4j_data.name === graph.startNode.neo4j_data.name){
				return
			}

			var edges = adjacentEdges[anode.id]

			if ((edges.length > 1 || edges.length === 0) || (anode.folded.nodes.length > 0)){
				return;
			}

			var edge = edges[0]

			if ((anode.type_user && (edge.label === 'MemberOf' || edge.label === 'AdminTo')) 
				|| (anode.type_computer && (edge.label === 'AdminTo' || edge.label === 'MemberOf')) 
				|| (anode.type_group && edge.label === 'AdminTo')){
				node.isGrouped = true
				node.folded.nodes.push(anode)
				node.folded.edges.push(edge)
				spotlightData[anode.id] = [anode.neo4j_data.name, node.id, node.neo4j_data.name];

				delete idMap[anode.id]
				delete edgeMap[edge.id]
			}
		})
		if (node.folded.nodes.length > 0){
			node.glyphs.push({
				'position': 'bottom-left',
				'content': node.folded.nodes.length
			})
		}
	})
}

/*function processSiblings(graph){
	if (sibling === 0){
		return
	}

	Object.keys(idMap).forEach(function(id){
		var node = idMap[id]

		if (typeof node === 'undefined'){
			return
		}

		if (!node.type_computer || node.folded.nodes.length > 0){
			return;
		}

		var adjacent = adjacentNodes[id]
		var siblings = []

		if (adjacent.length > 1 && adjacent.allEdgesSameType()){
			var parents = adjacent.map(
				function(e){
					return e.source
				}
			)
		}

		var checkString = parents.sort().join(',')
		var testString;

		Object.keys(idMap).forEach(function(id2){
			var node2 = idMap[id2]
			var tAdjacent = adjacentNodes[id2]
			if (typeof tAdjacent === 'undefined'){
				return
			}
			testString = tAdjacent.map(
				function(e){
					return e.source
				}
			).sort().join(',')

			if (testString === checkString){
				siblings.push(node2)
			}
		})

		if (siblings.length >= sibling){
			var nodeId = generateUniqueId(true)

			idMap[nodeId] = {
				id: nodeId,
				x: node.x,
				y: node.y,
				degree: siblings.length,
				label: "Grouped Computers",
				neo4j_labels:['Computer'],
				neo4j_data: {name: "Grouped Computers"},
				groupedNode: true,
				glyphs: [{
					position: 'bottom-left',
					content: siblings.length
				}],
				folded: {
					nodes: [],
					edges: []
				}
			}

			parents.forEach(function(parentId){
				var id = generateUniqueId(false)

				edgeMap[id] = {
					id: id,
					source: parentId,
					target: nodeId,
					label: 'AdminTo',
					neo4j_type: 'AdminTo',
					size: 1
				}
			})

			var newNode = idMap[nodeId]

			siblings.forEach(function(s){
				adjacentEdges[s.id].forEach(function(aedge){
					newNode.folded.edges.push(aedge)
					delete edgeMap[aedge.id]
				})

				newNode.folded.nodes.push(s)
				spotlightData[s.id] = [s.neo4j_data.name, newNode.id, newNode.label]
				delete idMap[s.id]
			})
		}
	})
} */

function processSiblings(graph){
	if (sibling === 0){
		return
	}

	graph.nodes.forEach(function(node){
		if (!node.type_computer || node.folded.nodes.length > 0){
			return;
		}

		var adjacent = adjacentEdges[node.id]
		var siblings = []

		console.log(adjacent.length)
		console.log(adjacent.allEdgesSameType())
		console.log(adjacent.map(function(e){return e.neo4j_type}))

		if (adjacent.length > 1 && adjacent.allEdgesSameType()){
			console.log(adjacent)
			var parents = adjacent.map(
				function(e){
					return e.source
				}
			)

			var checkString = parents.sort().join(',')
			var testString;

			graph.nodes.forEach(function(node2){
				testString = adjacentEdges[node2.id].map(
					function(e){
						return e.source
					}
				).sort().join(',')

				if (testString === checkString){
					console.log(node.neo4j_data.name + ' ' + node2.neo4j_data.name)
				}
			})
		}
	})
}