export function generateUniqueId(sigmaInstance, isNode){
	var i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
	if (isNode){
		while (typeof sigmaInstance.graph.nodes(i) !== 'undefined'){
			i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
		}
	}else{
		while (typeof sigmaInstance.graph.edges(i) !== 'undefined'){
			i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
		}
	}

	return i
}

//Recursive function to highlight paths to start/end nodes
export function findGraphPath(sigmaInstance, reverse, nodeid){
	var target = reverse ? appStore.startNode : appStore.endNode
	//This is our stop condition for recursing
	if (nodeid !== target.id){
		var edges = sigmaInstance.graph.adjacentEdges(nodeid)
		var nodes = reverse ? sigmaInstance.graph.inboundNodes(nodeid) : sigmaInstance.graph.outboundNodes(nodeid)
		//Loop over the nodes near us and the edges connecting to those nodes
		$.each(nodes, function(index, node){
			$.each(edges, function(index, edge){
				var check = reverse ? edge.source : edge.target
				//If an edge is pointing in the right direction, set its color
				//Push the edge into our store and then 
				node = parseInt(node)
				if (check === node){
					edge.color = reverse ? 'blue' : 'red';
					appStore.highlightedEdges.push(edge);
					findGraphPath(sigmaInstance, reverse, node);
				}
			})
		})
	}else{
		return
	}
}

export function clearDatabase(){
	emitter.emit('openClearingModal');
	deleteEdges()
}

function deleteEdges(){
	var session = driver.session()
	session.run("MATCH ()-[r]-() WITH r LIMIT 100000 DELETE r RETURN count(r)")
		.then(function(results){
			session.close()
			var count = results.records[0]._fields[0].low
			if (count === 0){
				deleteNodes()
			}else{
				deleteEdges()
			}
		})
}

function deleteNodes(){
	var session = driver.session()
	session.run("MATCH (n) WITH n LIMIT 100000 DELETE n RETURN count(n)")
		.then(function(results){
			session.close()
			var count = results.records[0]._fields[0].low
			if (count === 0){
				emitter.emit('hideDBClearModal')
			}else{
				deleteNodes()
			}
		})
}

export function buildGroupMembershipProps(rows){
	var users = []
	var groups = []
	var computers = []
	$.each(rows, function(index, row){
		switch (row.AccountType){
			case 'user':
				users.push({account:row.AccountName.toUpperCase(), group: row.GroupName.toUpperCase()})
				break
			case 'computer':
				computers.push({account:row.AccountName.toUpperCase(), group: row.GroupName.toUpperCase()})
				break
			case 'group':
				groups.push({account:row.AccountName.toUpperCase(), group: row.GroupName.toUpperCase()})
				break
		}
	})

	return {users: users, groups: groups, computers: computers}
}

export function buildLocalAdminProps(rows){
	var users = []
	var groups = []
	var computers = []
	$.each(rows, function(index, row){
		if (row.AccountName.startsWith('@')){
			return
		}
		switch(row.AccountType){
			case 'user':
				users.push({account:row.AccountName.toUpperCase(), computer: row.ComputerName.toUpperCase()})
				break;
			case 'group':
				groups.push({account:row.AccountName.toUpperCase(), computer: row.ComputerName.toUpperCase()})
				break;
			case 'computer':
				computers.push({account:row.AccountName.toUpperCase(), computer: row.ComputerName.toUpperCase()})
				break
		}
	})
	return {users: users, groups: groups, computers: computers}
}

export function buildSessionProps(rows){
	var sessions = []
	$.each(rows, function(index, row){
		if (row.UserName === 'ANONYMOUS LOGON@UNKNOWN' || row.UserName === ''){
			return
		}
		sessions.push({account: row.UserName.toUpperCase(), computer: row.ComputerName.toUpperCase(), weight: row.Weight})
	})

	return sessions
}

export function buildDomainProps(rows){
	var domains = []
	$.each(rows, function(index, row){
		switch(row.TrustDirection){
			case 'Inbound':
				domains.push({domain1: row.TargetDomain.toUpperCase(), domain2: row.SourceDomain.toUpperCase(), trusttype: row.TrustType, transitive: row.Transitive})
				break;
			case 'Outbound':
				domains.push({domain1: row.SourceDomain.toUpperCase(), domain2: row.TargetDomain.toUpperCase(), trusttype: row.TrustType, transitive: row.Transitive})
				break;
			case 'Bidirectional':
				domains.push({domain1: row.TargetDomain.toUpperCase(), domain2: row.SourceDomain.toUpperCase(), trusttype: row.TrustType, transitive: row.Transitive})
				domains.push({domain1: row.SourceDomain.toUpperCase(), domain2: row.TargetDomain.toUpperCase(), trusttype: row.TrustType, transitive: row.Transitive})
				break
		}
	})

	return domains
}

export function buildACLProps(rows){
	var datadict = {}

	$.each(rows, function(index, row){
		var a = row.ObjectName.toUpperCase()
		var b = row.PrincipalName.toUpperCase()
		var atype = row.ObjectType.toTitleCase()
		var btype = row.PrincipalType.toTitleCase()
		var rel = row.ActiveDirectoryRights

		var hash = (atype + rel + btype).toUpperCase()
		if (btype === 'Computer'){
			return
		}

		if (rel.includes(' ')){
			rel = 'WriteDACL'
		}

		if (datadict[hash]){
			datadict[hash].props.push({
				account: a,
				principal: b
			})
		}else{
			datadict[hash] = {
				statement: 'UNWIND {props} AS prop MERGE (a:{} {name:prop.account}) WITH a,prop MERGE (b:{} {name: prop.principal}) WITH a,b,prop MERGE (a)-[r:{}]->(b)'.format(atype,btype,rel),
				props: [{account: a, principal: b}]
			}
		}
	})

	return datadict
}
