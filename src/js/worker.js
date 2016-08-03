var indexes, 
	edge, 
	sibling,
	spotlightData,
	adjacentNodes,
	adjacentEdges,
	idMap;

process.on('message', function(m){
	adjacentNodes = {}
	adjacentEdges = {}
	idMap =  {}
	spotlightData = {}

	var data = JSON.parse(m)

	buildIndexes(data)
	edge = data.edge;
	sibling = data.sibling

	data = processEdgeNodes(data)
	data.spotlightData = spotlightData

	data.nodes.forEach(function(node){
		if (!spotlightData.hasOwnProperty(node.id)){
			spotlightData[node.id] = [node.neo4j_data.name, 0, ""]
		}
	})
	process.send(data)
})

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
	})
}

function processEdgeNodes(graph){
	if (edge === 0){
		return graph;
	}

	Object.keys(idMap).forEach(function(id){
		var node = idMap[id]

		adjacentNodes[node.id].forEach(function(anode){
			if (anode.neo4j_data.name === graph.endNode || anode.neo4j_data.name === graph.startNode){
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

				graph.nodes = graph.nodes.filter(function(index) {
					return index.id !== anode.id
				});

				graph.edges = graph.edges.filter(function(index) {
					return index.id !== edge.id
				});
			}
		})
		if (node.folded.nodes.length > 0){
			node.glyphs.push({
				'position': 'bottom-left',
				'content': node.folded.nodes.length
			})
		}
	})

	return graph
}