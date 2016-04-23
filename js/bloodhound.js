$(document).ready(function(){
	$('#loginpanel').fadeToggle(0)
	$('#checkconnectionpanel').fadeToggle(0)

	// Set our default renderer to Canvas, since a lot of plugins dont work on WebGL
	sigma.renderers.def = sigma.renderers.canvas
	sigmaInstance = new sigma({
		container: 'graph'
	});
	sigmaInstance.settings({
		edgeColor: 'default',
		defaultEdgeColor: '#356',
		nodeColor: 'default',
		edgeHoverColor: 'default',
		defaultEdgeHoverColor: '#090',
		enableEdgeHovering: false,
		defaultEdgeType: 'tapered',
		minEdgeSize: 1,
		maxEdgeSize: 2.5,
		minArrowSize: 3,
		iconThreshold: 4,
		labelThreshold: 15,
		labelAlignment: 'center',
		labelColor: 'node',
		font: 'Roboto',
		glyphFillColor: 'black',
		glyphTextColor: 'white'
	})

	// Initialize the design plugin
	var myPalette = {
		iconScheme: {
			'User': {
				font:'FontAwesome',
				content:'\uF007',
				scale: 1.5,
				color: '#ffffff'
			},
			'Computer': {
				font:'FontAwesome',
				content:'\uF108',
				scale: 1.2,
				color: '#ffffff'
			},
			'Group': {
				font:'FontAwesome',
				content:'\uF0C0',
				scale: 1.5,
				color: '#ffffff'
			}
		}
	}

	var myStyles = {
	  nodes: {
	  	label: {
	  		by: 'neo4j_data.name'
	  	},
	    size: {
	      	by: 'degree',
	      	bins: 7,
	      	min: 10,
	      	max: 20
	    },
	    icon: {
	    	by: 'neo4j_labels.0',
	    	scheme: 'iconScheme'
	    }
	  }
	};

	design = sigma.plugins.design(sigmaInstance);
	design.setPalette(myPalette);
	design.setStyles(myStyles);

	// Make glyphs draw whenever sigma renders
	sigmaInstance.renderers[0].bind('render', function(e) {
      sigmaInstance.renderers[0].glyphs();
    });

	// Initialize the noverlap plugin
	sigmaInstance.configNoverlap({nodeMargin: 2.0, easing: 'cubicInOut', gridSize: 50})

	// Initialize the tooltips plugin
	var tooltips = sigma.plugins.tooltips(
		sigmaInstance,
		sigmaInstance.renderers[0],
		{
			node: [{
				show: 'rightClickNode',
				cssClass: 'new-tooltip',
				template:
				'<div class="header">' +
				'	{{label}}' + 
				'</div>' + 
				'	<ul>' + 
				'		{{#type_user}}' + 
				'			<li onclick="setLabelAsStart(\'{{label}}\')"><i class="glyphicon glyphicon-screenshot"></i> Set as Starting Node</li>' + 
				'			<li onclick="setLabelAsEnd(\'{{label}}\')"><i class="glyphicon glyphicon-screenshot"></i> Set as Ending Node</li>' + 
				'			<li onclick="doQuery(\'MATCH (n {name:&quot;{{label}}&quot;})-[r:MemberOf]->m RETURN n,r,m\')"><i class="glyphicon glyphicon-screenshot"></i> Group Membership</li>' + 
				'			<li onclick="doQuery(\'MATCH (n:User {name:&quot;{{label}}&quot;}), (target:Computer),p=allShortestPaths((n)-[*]->(target)) RETURN p\', &quot;{{label}}&quot;)"><i class="glyphicon glyphicon-screenshot"></i> Admin To</li>' + 
				'		{{/type_user}}' + 
				'		{{#type_computer}}' + 
				'			<li onclick="setLabelAsStart(\'{{label}}\')"><i class="glyphicon glyphicon-screenshot"></i> Set as Starting Node</li>' + 
				'			<li onclick="setLabelAsEnd(\'{{label}}\')"><i class="glyphicon glyphicon-screenshot"></i> Set as Ending Node</li>' + 
				'			<li onclick=""><i class="glyphicon glyphicon-screenshot"></i> Shortest Paths to Here</li>' + 
				'			<li onclick="doQuery(\'MATCH (n:User {name:&quot;{{label}}&quot;}), (target:Computer),p=allShortestPaths((n)-[*]->(target)) RETURN p\')"><i class="glyphicon glyphicon-screenshot"></i> Get Explicit Admins</li>' + 
				'			<li onclick="doQuery(\'MATCH (m:Computer {name:&quot;{{label}}&quot;})-[r:HasSession]->(n:User) WITH n,r,m WHERE NOT n.name ENDS WITH &quot;$&quot; RETURN n,r,m\')"><i class="glyphicon glyphicon-screenshot"></i> Get User Sessions</li>' + 
				'		{{/type_computer}}' +
				'		{{#type_group}}' + 
				'			<li onclick="setLabelAsStart(\'{{label}}\')"><i class="glyphicon glyphicon-screenshot"></i> Set as Starting Node</li>' + 
				'			<li onclick="setLabelAsEnd(\'{{label}}\')"><i class="glyphicon glyphicon-screenshot"></i> Set as Ending Node</li>' + 
				'			<li onclick="doQuery(\'MATCH (n {name:&quot;{{label}}&quot;})<-[r:MemberOf]-m RETURN n,r,m\')"><i class="glyphicon glyphicon-screenshot"></i> Get Members</li>' + 
				'			<li onclick="doQuery(\'MATCH (n {name:&quot;{{label}}&quot;})-[r:AdminTo]->m RETURN n,r,m\', &quot;{{label}}&quot;)"><i class="glyphicon glyphicon-screenshot"></i> Admin To</li>' + 
				'		{{/type_group}}' +
				'	</ul>',
			    autoadjust:true,
				renderer: function(node, template){
					return Mustache.render(template, node)
				}
			}]
		}
	)

	tooltips.bind('shown', function(event){
		currentTooltip = event.target;
	})

	tooltips.bind('hidden', function(event){
		currentTooltip = null;
	})

	// Initialize ForceLink layout
	var fa = sigma.layouts.configForceLink(sigmaInstance, {
		worker: true,
		background: true,
		easing: 'cubicInOut',
		autoStop: true,
		alignNodeSiblings:true
	});

	// Set Noverlap to run when forcelink is run
	fa.bind('stop', function(event){
		if (event.type == 'stop'){
			sigmaInstance.startNoverlap()
		}
	})

	// Initialize the Dagre Layout
	var listener = sigma.layouts.dagre.configure(sigmaInstance, {
	  easing: 'cubicInOut',
	  boundingBox: true,
	  background: true
	});

	// Set Noverlap to run when dagre layout is finished
	listener.bind('stop', function(event) {
	  if (event.type == 'stop'){
	  	sigmaInstance.startNoverlap()
	  }
	});

	// Initialize the dragNodes plugin
	var dragListener = sigma.plugins.dragNodes(sigmaInstance, sigmaInstance.renderers[0])

	dragListener.bind('drag', function(event){
		dragged = true;
	})

	if (localStorage.getItem("dbpath")){
		$('#checkconnectionpanel').fadeToggle(0)
		//Checking Stored Credentials <i class="fa fa-spinner fa-spin"></i>
		setTimeout(function(){
			$.ajax({
				url: localStorage.getItem('dbpath') + '/db/data/',
				type: 'GET',
				headers: {
					"Authorization": localStorage.getItem('auth')
				},
				success: function(e){
					$('#connectionstatus').html("Success!")
					doInit()
					setTimeout(function(){
						$('#checkconnectionpanel').fadeToggle()
						$('#loginwindow').fadeToggle(400, 'swing', function(){
							$('#connectionstatus').html('Checking Stored Credentials <i class="fa fa-spinner fa-spin"></i>')
						})
					}, 1500)
				},
				error: function(e){
					$('#connectionstatus').html("Invalid Credentials!")
					setTimeout(function(){
						$('#checkconnectionpanel').fadeToggle(400, 'swing', function(){
							$('#loginpanel').fadeToggle()
							$('#connectionstatus').html('Checking Stored Credentials <i class="fa fa-spinner fa-spin"></i>')
						})
					}, 1500)
				}
			})
		}, 1500)
	}else{
		$('#loginpanel').fadeToggle()
	}

	// Add enter keybinds for pathfinding/search bars
	$('#searchBar').bind('keypress', function(e){
		if (e.which == 13){
			if (!pathfindingMode){
				doQuery("MATCH (n) WHERE n.name =~ '(?i)" + e.currentTarget.value + ".*' AND NOT n.name ENDS WITH '$' RETURN n");	
			}else{
				var start = $('#searchBar').val();
				var end = $('#endNode').val();
				if (start != "" &&  end != ""){
					doQuery("MATCH (source {name:'" + start + "'}), (target {name:'" + end + "'}), p=allShortestPaths((source)-[*]->(target)) RETURN p", start, end);	
				}
			}
		}
	});

	$('#endNode').bind('keypress', function(e){
		if (e.which == 13){
			var start = $('#searchBar').val();
			var end = $('#endNode').val();
			if (start != "" &&  end != ""){
				doQuery("MATCH (source {name:'" + start + "'}), (target {name:'" + end + "'}), p=allShortestPaths((source)-[*]->(target)) RETURN p", start, end);	
			}
		}
	});

	$('#dbusername').bind('keypress', function(e){
		if (e.which == 13){
			$('#loginbutton').click()
		}
	});

	$('#dbpassword').bind('keypress', function(e){
		if (e.which == 13){
			$('#loginbutton').click()
		}
	});

	// Hide a bunch of stuff that needs to be hidden on load
	$('#nodedatabox').slideToggle(0)
	$('#pathfindingbox').slideToggle(0)
	$('#nodataalert').toggle(false)
	$('#rawQueryBox').slideToggle(0)
	$('#uploadSelectDiv').fadeToggle(0)
	$('#exportSelectDiv').fadeToggle(0)
	$("#layoutchange").toggle(false)
	$('#dburlspinner').toggle(false)

	// Click handlers for various buttons/elements
	$('#menu').on('click', function(event){
		$('#nodedatabox').slideToggle()
	});

	$('#startingestbutton').on('click', function(event){
		ingestDomainGroupMembership()
	})

	$('#selectUploadFile').on('click', function(event){
		$('#uploader').click();
	});

	$('#back').on('click', function(event){
		redoLast()
	});

	$('#openpath').on('click', function(event){
		togglePathFinding()
	});

	$('#refreshbutton').on('click', function(event){
		forceRelayout()
	});

	$('#exportbutton').on('click', function(event){
		$('#exportSelectDiv').fadeToggle();
	});

	$('#importbutton').on('click', function(event){
		$('#fileloader').click();
	});

	$('#uploadbutton').on('click', function(event){
		$('#uploadSelectDiv').fadeToggle()
	});

	$('#loginbutton').on('click', function(event){
		if (!($('#loginbadpw').hasClass('hide'))){
			$('#loginbadpw').addClass('hide')	
		}
		
		if (!($(this).hasClass('activate')) && !($(this).hasClass('btn-success'))){
			$(this).toggleClass('activate');
			var url = $('#dburl').val()
			var uname = $('#dbusername').val()
			var upwd = $('#dbpassword').val()
			var header = "Basic " + window.btoa(uname + ":" + upwd)

			if (!(url.startsWith('http'))){
				url = 'http://' + url
			}

			$.ajax({
				url: url + '/db/data/',
				type: 'GET',
				headers: {
					"Authorization":header
				},
				success: function(e){
					$('#loginbutton').toggleClass('activate');
					$('#loginbutton').removeClass('btn-default')
					$('#loginbutton').addClass('btn-success');
					$('#loginbutton').html('Success!')
					localStorage.setItem("auth", header)
					localStorage.setItem("dbpath", url)
					localStorage.setItem("uname", uname)
					localStorage.setItem("pwd", upwd)
					doInit()
					setTimeout(function(){
						$('#loginwindow').fadeToggle()	
					}, 1500)					
				},
				error: function(e){
					$('#loginbadpw').removeClass('hide')
					$('#loginbutton').toggleClass('activate');
				}
			})
		}
	});

	$('#bottomSlide').on('click', function(event){
		$('#rawQueryBox').slideToggle(400, function(e){
			if ($('#rawQueryBox').is(':hidden')){
				$('#bottomSlide').html('<span class="glyphicon glyphicon-chevron-up"></span>  Raw Query  <span class="glyphicon glyphicon-chevron-up"></span>')
			}else{
				$('#bottomSlide').html('<span class="glyphicon glyphicon-chevron-down"></span>  Raw Query  <span class="glyphicon glyphicon-chevron-down"></span>')
			}
		})
	});

	$('#exportFinishButton').on('click', function(event){
		if ($('#exportimage').hasClass('active')){
			var size = $('#graph').outerWidth()
			sigma.plugins.image(sigmaInstance, sigmaInstance.renderers[0], {download:true, size:size, background: 'lightgray', clip: true});
		}else{
			var jsonString = sigmaInstance.toJSON({
				download: true,
				pretty: true,
				filename: 'graph.json'
			});
		}
	});

	$('#layoutbutton').on('click', function(event){
		usedagre = !usedagre;
		forceRelayout();
		if (usedagre){
			$('#layoutchange').html('<button type="button" class="close" onclick="$(\'#layoutchange\').fadeToggle(false)" aria-label="Close"><span aria-hidden="true">&times;</span></button>Changed Layout To Hierarchical')
		}else{
			$('#layoutchange').html('<button type="button" class="close" onclick="$(\'#layoutchange\').fadeToggle(false)" aria-label="Close"><span aria-hidden="true">&times;</span></button>Changed Layout To Force Directed')
		}
		$("#layoutchange").fadeToggle(true)
		$("#layoutchange").delay(1500).fadeToggle(false)
	});

	$('#play').on('click', function(event){
		doQuery("MATCH (source {name:'" + $('#searchBar').val() + "'}), (target {name:'" + $('#endNode').val() + "'}), p=allShortestPaths((source)-[*]->(target)) RETURN p",$('#searchBar').val() ,$('#endNode').val());
	});

	//Functions for the Export Box
	$('#exportjson').on('click', function(event){
		$('#exportjson').addClass('active');
		$('#exportimage').removeClass('active');
	});

	$('#exportimage').on('click', function(event){
		$('#exportimage').addClass('active');
		$('#exportjson').removeClass('active');
	});

	// Functions for the ingest box
	$('#ingestlocaladmin').on('click', function(event){
		$('#ingestdomaingroup').removeClass('active');
		$('#ingestlocaladmin').addClass('active');
		$('#ingestusersessions').removeClass('active');
	});

	$('#ingestdomaingroup').on('click', function(event){
		$('#ingestdomaingroup').addClass('active');
		$('#ingestlocaladmin').removeClass('active');
		$('#ingestusersessions').removeClass('active');
	});

	$('#ingestusersessions').on('click', function(event){
		$('#ingestdomaingroup').removeClass('active');
		$('#ingestlocaladmin').removeClass('active');
		$('#ingestusersessions').addClass('active');
	});


	// Initialization and events for the right toolbar
	if (ohrefresh == 0){
		ohrefresh = $('#refreshbuttonhidden').outerHeight() + "px"
		$('#refreshbutton').css({'height':ohrefresh})
	}

	$('#refreshbutton').hover(function(){
		var w = $('#refreshbuttonhidden').outerWidth() + 1 + "px"
		if (owrefresh == 0){
			owrefresh = $('#refreshbutton').outerWidth() + 1 + "px"
		}

		$(this).stop().animate({
			width: w
		}, 100, function(){
			$(this).html('Refresh<span class="glyphicon glyphicon-refresh rightspan rightglyph"></span>')
		})
	}, function(){
		$(this).html('<span class="glyphicon glyphicon-refresh rightspan"></span>')
		$(this).stop().animate({
			width: owrefresh
		}, 100)	
	})

	if (ohexport == 0){
		ohexport = $('#exportbuttonhidden').outerHeight() + "px"
		$('#exportbutton').css({'height':ohexport})
	}

	$('#exportbutton').hover(function(){
		var w = $('#exportbuttonhidden').outerWidth() + 1 + "px"
		if (owexport == 0){
			owexport = $('#exportbutton').outerWidth() + 1 + "px"
		}

		$(this).stop().animate({
			width: w
		}, 100, function(){
			$(this).html('Export Graph<span class="glyphicon glyphicon-export rightspan rightglyph"></span>')
		})
	}, function(){
		$(this).html('<span class="glyphicon glyphicon-export rightspan"></span>')
		$(this).stop().animate({
			width: owexport
		}, 100)	
	})

	if (ohimport == 0){
		ohimport = $('#importbuttonhidden').outerHeight() + "px"
		$('#importbutton').css({'height':ohimport})
	}

	$('#importbutton').hover(function(){
		var w = $('#importbuttonhidden').outerWidth() + 1 + "px"
		if (owimport == 0){
			owimport = $('#importbutton').outerWidth() + 1 + "px"
		}

		$(this).stop().animate({
			width: w
		}, 100, function(){
			$(this).html('Import Graph<span class="glyphicon glyphicon-import rightspan rightglyph"></span>')
		})
	}, function(){
		$(this).html('<span class="glyphicon glyphicon-import rightspan"></span>')
		$(this).stop().animate({
			width: owimport
		}, 100)	
	})

	if (ohupload == 0){
		ohupload = $('#uploadbuttonhidden').outerHeight() + "px"
		$('#uploadbutton').css({'height':ohupload})
	}

	$('#uploadbutton').hover(function(){
		var w = $('#uploadbuttonhidden').outerWidth() + 1 + "px"
		if (owupload == 0){
			owupload = $('#uploadbutton').outerWidth() + 1 + "px"
		}

		$(this).stop().animate({
			width: w
		}, 100, function(){
			$(this).html('Upload Data<span class="glyphicon glyphicon-upload rightspan rightglyph"></span>')
		})
	}, function(){
		$(this).html('<span class="glyphicon glyphicon-upload rightspan"></span>')
		$(this).stop().animate({
			width: owupload
		}, 100)	
	})

	if (ohlayout == 0){
		ohlayout = $('#layoutbuttonhidden').outerHeight() + "px"
		$('#layoutbutton').css({'height':ohlayout})
	}

	$('#layoutbutton').hover(function(){
		var w = $('#layoutbuttonhidden').outerWidth() + 1 + "px"
		if (owlayout == 0){
			owlayout = $('#layoutbutton').outerWidth() + 1 + "px"
		}

		$(this).stop().animate({
			width: w
		}, 100, function(){
			$(this).html('Change Layout Type<span style="width:19px" class="fa fa-line-chart rightspan rightglyph"></span>')
		})
	}, function(){
		$(this).html('<span style="width: 14px" class="fa fa-line-chart rightspan"></span>')
		$(this).stop().animate({
			width: owlayout
		}, 100)	
	})


	// Some random binds for important stuff
	sigmaInstance.bind('clickNode', function(e){
		// Check if the node has been dragged, if not, display the node info
		if (!dragged){
			updateNodeData(e);
		}else{
			dragged = false;
		}
	});

	$('#rawQueryBox').bind('keypress', function(e){
		if (e.which == 13){
			doQuery(e.currentTarget.value);
		}
	});

	// Opens the file selector for importing graphs
	$('#fileloader').on('change',function(e){
		handleImport(e);
	})

	$('#uploader').on('change', function(e){
		uploadFileEvent = e;
		$('#uploadFileSelected').val(e.target.files[0].name);
	})

	$('#dburl').on('focus', function(e){
		$('#dbHelpBlock').addClass('hide')
		dburlchecked = false;
	})

	$('#dburl').bind('keypress', function(e){
		if (e.which == 13){
			event.preventDefault();
			$('#dburl').blur();
		}
	});

	$('#dburl').on('blur', function(e){
		$('#dburlspinner').toggle(false)
		var url = e.currentTarget.value
		if (!(url === "")){
			var icon = $('#dburlspinner')
			icon.removeClass();
			icon.addClass("fa fa-spinner fa-spin form-control-feedback")
			$('#dburlspinner').toggle(true)
			if (!(url.startsWith('http'))){
				url = 'http://' + url
			}
			$.ajax({
				url: url,
				type: 'GET',
				success: function(e){
					if (e.data.endsWith('/db/data/')){
						icon.removeClass();
						icon.addClass("fa fa-check-circle green-icon-color form-control-feedback")
					}else{
						icon.removeClass();
						icon.addClass("fa fa-times-circle red-icon-color form-control-feedback")
						$('#dbHelpBlock').removeClass('hide')
					}
				},
				error: function(e){
					icon.removeClass();
					icon.addClass("fa fa-times-circle red-icon-color form-control-feedback")
					$('#dbHelpBlock').removeClass('hide')
				}
			})
		}
		
	})

	// Make our export/ingest boxes draggable
	$('#uploadSelectDiv').draggable({scroll:false, containment: "window"});
	$('#exportSelectDiv').draggable({scroll:false, containment: "window"});
})

var dragged = false;
var dbinforendered = null;
var loadingString = "<h3 align='center'>{{label}} Properties</h3><div class='loader'>Loading...</div>"
var noDataString = "<h3 align='center'>Node Properties</h3><div style='padding-bottom:1em'>Select a node for more information</div>"
var sigmaInstance = null;
var queryStack = new Array();
var firstquery = true;
var pathfindingMode = false;
var currentTooltip = null;
var owrefresh = 0
var ohrefresh = 0
var owexport = 0
var ohexport = 0
var owimport = 0
var ohimport = 0
var owupload = 0
var ohupload = 0
var owlayout = 0
var ohlayout = 0
var design = null;
var usedagre = false;
var uploadFileEvent = null;

function makeWorker(script) {
    var URL = window.URL || window.webkitURL;
    var Blob = window.Blob;
    var Worker = window.Worker;
    
    if (!URL || !Blob || !Worker || !script) {
        return null;
    }
    
    var blob = new Blob([script]);
    var worker = new Worker(URL.createObjectURL(blob));
    return worker;
}

function handleImport(event){
	var reader = new FileReader();
	reader.onload = function(event){
		var x = event.target.result;
		graph = JSON.parse(x)
		if (graph.nodes.length == 0 && graph.edges.length == 0){
			$("#nodataalert").fadeToggle(true)
			$("#nodataalert").delay(3000).fadeToggle(false)
		}else{
			sigmaInstance.graph.clear();
			sigmaInstance.graph.read(graph);
			sigmaInstance.refresh();
		}
	}
	reader.readAsText(event.target.files[0]);
}

function handleUpload(event){
	var reader = new FileReader();
	reader.onload = function(event){
		var x = event.target.result;
		console.log($.csv.toObjects(x));
	}
	reader.readAsText(event.target.files);
}

function togglePathFinding(){
	$('#pathfindingbox').slideToggle(400, function(){
		if ($('#pathfindingbox').is(":hidden")){
			$('#searchBar').attr("placeholder", "Start typing to search for a node...")
			pathfindingMode = false;
		}else{
			$('#searchBar').attr("placeholder", "Start Node")
			pathfindingMode = true;
		}
	})
}

function setLabelAsStart(label){
	$('#searchBar').val(label);
};

function setLabelAsEnd(label){
	$('#endNode').val(label);
	if ($('#pathfindingbox').is(":hidden")){
		togglePathFinding()
	}
};

function doQuery(query, start, end){
	if (typeof start === 'undefined'){
		start = ""
	}
	if (typeof end === 'undefined'){
		end = ""
	}
	if (!firstquery){
		queryStack.push([sigmaInstance.graph.nodes(), sigmaInstance.graph.edges()]);
	}
	firstquery = false;
	if (currentTooltip != null){
		currentTooltip.close();	
	}
	
	design.deprecate()

	sigma.layouts.stopForceLink();
	
	sigma.neo4j.cypher(
		{url: localStorage.getItem("dbpath"), user:localStorage.getItem("uname"), password:localStorage.getItem("pwd")},
		query,
		sigmaInstance,
		function() {
			var startNode = null;
			var endNode = null;
			if (sigmaInstance.graph.nodes().length == 0 && sigmaInstance.graph.edges().length == 0){
				$("#nodataalert").fadeToggle(true)
				redoLast()
				$("#nodataalert").delay(3000).fadeToggle(false)
			}else{
				$.each(sigmaInstance.graph.nodes(), function(index, node){
					node.degree = sigmaInstance.graph.degree(node.id)
					if (node.neo4j_labels[0]=='Group'){
						node.type_group = true
					}else if (node.neo4j_labels[0] == 'User'){
						node.type_user = true
					}else{
						node.type_computer = true
					}

					if (node.neo4j_data.name == start){
						startNode = node;
					}

					if (node.neo4j_data.name == end){
						endNode = node;
					}
				})
				sigmaInstance.refresh();
				design.apply()
				if (!(startNode === null)){
					startNode.glyphs = [{
						'position':'bottom-right',
						'font': 'FontAwesome',
						'content': '\uF21D',
						'fillColor': '#3399FF',
						'fontScale':1.5
					}]
					startNode.size = startNode.size + 5
				}

				if (!(endNode === null)){
					endNode.glyphs = [{
						'position':'bottom-right',
						'font': 'FontAwesome',
						'fillColor': '#990000',
						'content': '\uF05B',
						'fontScale': 1.5
					}]
					endNode.size = endNode.size + 5
				}
				if (usedagre){
					sigma.layouts.dagre.start(sigmaInstance);	
					
				}else{
					sigma.layouts.startForceLink();	
				}				
			}
		}
	);
}

function redoLast(){
	if (queryStack.length > 0){
		if (currentTooltip != null){
			currentTooltip.close();	
		}
		sigma.layouts.stopForceLink();
		
		query = queryStack.pop();
		sigmaInstance.graph.clear();
		sigmaInstance.graph.read({nodes:query[0], edges: query[1]});
		sigmaInstance.refresh()
	}
}

$(function () {
 	$('[data-toggle="tooltip"]').tooltip()
})

function updateNodeData(node){
	var template = $('#datatemplate').html();
	var loading = Mustache.render(loadingString, {label: node.data.node.label})
	var rendered = Mustache.render(template, {dbinfo: dbinforendered, nodeinfo: loading});
	var elem = $('#nodedatabox')
	elem.html(rendered);
	$('.nav-tabs a[href="#nodeinfo"]').tab('show')
	if (elem.is(":hidden")){
		$('#nodedatabox').slideToggle()	
	}
	
	if (node.data.node.type_user == true){
		$.ajax({
			url: localStorage.getItem("dbpath") + "/db/data/transaction/commit",
			type: 'POST',
			accepts: {json: "application/json"},
			dataType: "json",
			contentType: "application/json",
			headers: {
				"Authorization": localStorage.getItem("auth")
			},
			data: JSON.stringify({
				  "statements" : [ {
				    "statement" : "MATCH (n:User {name:'" + node.data.node.label + "'}), (target:Group), p=allShortestPaths((n)-[:MemberOf*1]->(target)) RETURN count(target)"
				  }, {
				    "statement" : "MATCH (n:User {name:'" + node.data.node.label + "'}), (target:Group), p=allShortestPaths((n)-[:MemberOf*1..]->(target)) RETURN count(target)"
				  }, {
				    "statement" : "MATCH (n:User {name:'" + node.data.node.label + "'}), (target:Computer), p=allShortestPaths((n)-[:AdminTo*1]->(target)) RETURN count(target)"
				  }, {
				  	"statement" : "MATCH (n:User {name:'" + node.data.node.label + "'})-[:MemberOf]->(m:Group)-[:AdminTo]->(l:Computer) RETURN count(l)"
				  }, {
				  	"statement" : "MATCH (n:User {name:'" + node.data.node.label + "'}), (target:Computer), p=allShortestPaths((n)-[*]->(target)) RETURN count(target)"
				  }, {
				  	"statement" : "MATCH (n:Computer)-[r:HasSession]->(m:User {name:'" + node.data.node.label + "'}) RETURN count(n)"
				  } ]
			}),
			success: function(json) {
				var fdg = json.results[0].data[0].row[0];
				var unr = json.results[1].data[0].row[0];
				var diradmin = json.results[2].data[0].row[0];
				var dla = json.results[3].data[0].row[0];
				var dir = json.results[4].data[0].row[0];
				var sessions = json.results[5].data[0].row[0];
				
				var template = $('#datatemplate').html();
				var usernodetemplate = $('#usernodetemplate').html();
				var usernodeinfo = Mustache.render(usernodetemplate, {label: node.data.node.label, first_degree_group:fdg, unrolled: unr, first_degree_admin: diradmin, type_user: true, dlar: dla, derivative:dir, sessions:sessions});
				var rendered = Mustache.render(template, {dbinfo: dbinforendered, nodeinfo: usernodeinfo});
				$('#nodedatabox').html(rendered);
				$('.nav-tabs a[href="#nodeinfo"]').tab('show')
			}
		});
	}else if (node.data.node.type_computer == true){
		$.ajax({
			url: localStorage.getItem("dbpath") + "/db/data/transaction/commit",
			type: 'POST',
			accepts: {json: "application/json"},
			dataType: "json",
			contentType: "application/json",
			headers: {
				"Authorization": localStorage.getItem("auth")
			},
			data: JSON.stringify({
				  "statements" : [ {
				    "statement" : "MATCH (a)-[b:AdminTo]->(c:Computer {name:'" + node.data.node.label + "'}) RETURN count(a)"
				  }, {
				    "statement" : "MATCH (n:User),(target:Computer {name:'" + node.data.node.label +"'}), p=allShortestPaths((n)-[:AdminTo|MemberOf*1..]->(target)) WITH nodes(p) AS y RETURN count(distinct(filter(x in y WHERE labels(x)[0] = 'User')))"
				  }, {
				  	"statement" : "MATCH (m:Computer {name:'" + node.data.node.label + "'})-[r:HasSession]->(n:User) WITH n WHERE NOT n.name ENDS WITH '$' RETURN count(n)"
				  } ]
			}),
			success: function(json) {
				var c1 = json.results[0].data[0].row[0];
				var c2 = json.results[1].data[0].row[0];
				var c3 = json.results[2].data[0].row[0];
				
				var template = $('#datatemplate').html();
				var compnodetemplate = $('#computertemplate').html();
				var nodeinfo = Mustache.render(compnodetemplate, {label: node.data.node.label, explicit_admins: c1, sessions: c3, unrolled_admin: c2});
				var rendered = Mustache.render(template, {dbinfo: dbinforendered, nodeinfo: nodeinfo});
				$('#nodedatabox').html(rendered);
				$('.nav-tabs a[href="#nodeinfo"]').tab('show')
			}
		});
	}else if (node.data.node.type_group == true){
		$.ajax({
			url: localStorage.getItem("dbpath") + "/db/data/transaction/commit",
			type: 'POST',
			accepts: {json: "application/json"},
			dataType: "json",
			contentType: "application/json",
			headers: {
				"Authorization": localStorage.getItem("auth")
			},
			data: JSON.stringify({
				  "statements" : [ {
				    "statement" : "MATCH (a)-[b:MemberOf]->(c:Group {name:'" + node.data.node.label + "'}) RETURN count(a)"
				  }, {
				    "statement" : "MATCH (n:User), (m:Group {name:'" + node.data.node.label + "'}), p=allShortestPaths((n)-[:MemberOf*1..]->(m)) WITH nodes(p) AS y RETURN count(distinct(filter(x in y WHERE labels(x)[0] = 'User')))"
				  }, {
				    "statement" : "MATCH (n:Group {name:'" + node.data.node.label + "'})-[r:AdminTo]->(m:Computer) RETURN count(m)"
				  }, {
				  	"statement" : "MATCH (n:Group {name:'" + node.data.node.label + "'}), (target:Computer), p=allShortestPaths((n)-[*]->(target)) RETURN count(target)"
				  } ]
			}),
			success: function(json) {
				var c1 = json.results[0].data[0].row[0];
				var c2 = json.results[1].data[0].row[0];
				var c3 = json.results[2].data[0].row[0];
				var c4 = json.results[3].data[0].row[0];
				
				var template = $('#datatemplate').html();
				var groupnodetemplate = $('#grouptemplate').html();
				var nodeinfo = Mustache.render(groupnodetemplate, {label: node.data.node.label, explicit_members: c1, unrolled_members: c2, adminto:c3, derivative_admin: c4});
				var rendered = Mustache.render(template, {dbinfo: dbinforendered, nodeinfo: nodeinfo});
				$('#nodedatabox').html(rendered);
				$('.nav-tabs a[href="#nodeinfo"]').tab('show')
			}
		});
	}
}

function forceRelayout(){
	sigma.layouts.stopForceLink();
	if (usedagre){
		sigma.layouts.dagre.start(sigmaInstance);
		
	}else{
		sigma.layouts.startForceLink();	
	}	
}

function ingestDomainGroupMembership(){
	var reader = new FileReader();
	reader.onload = function(event){
		var x = event.target.result;
		var d = [];
		var hr = window.location.href
		hr = hr.split('/');
		hr.pop()
		hr = hr.join('/');
		d['url'] = hr
		d['data'] = x
		if ($('#ingestlocaladmin').hasClass('active')){
			d['type'] = 'localadmin';
		}else if ($('#ingestdomaingroup').hasClass('active')){
			d['type'] = 'domainmembership';
		}else{
			d['type'] = 'sessions';
		}
		var ingestWorker = makeWorker(document.getElementById('ingestworker').textContent);
		ingestWorker.postMessage(d);
	}

	reader.readAsText(document.getElementById('uploader').files[0]);
}

function uploadDialogButton(){

}

function doInit(){
	// Initialize DB Info
	$.ajax({
		url: localStorage.getItem("dbpath") + "/db/data/transaction/commit",
		type: 'POST',
		accepts: {json: "application/json"},
		dataType: "json",
		contentType: "application/json",
		headers: {
			"Authorization": localStorage.getItem("auth")
		},
		data: JSON.stringify({
			  "statements" : [ {
			    "statement" : "MATCH (n:User) WHERE NOT n.name ENDS WITH '$' RETURN count(n)"
			  }, {
			    "statement" : "MATCH (n:Group) RETURN count(n)"
			  }, {
			    "statement" : "MATCH ()-[r]->() RETURN count(r)"
			  }, {
			    "statement" : "MATCH (n:Computer) RETURN count(n)"
			  } ]
		}),
		success: function(json) {
			var usercount = json.results[0].data[0].row[0];
			var groupcount = json.results[1].data[0].row[0];
			var relcount = json.results[2].data[0].row[0];
			var compcount = json.results[3].data[0].row[0];

			var template = $('#dbdata').html();
			Mustache.parse(template);
			dbinforendered = Mustache.render(template, {url:localStorage.getItem("dbpath"), user: localStorage.getItem("uname"), num_users: usercount, num_groups: groupcount, num_relationships: relcount, num_computers: compcount});
			var template = $('#datatemplate').html();
			var nodeinfo = Mustache.render(noDataString);
			var rendered = Mustache.render(template, {dbinfo: dbinforendered, nodeinfo: nodeinfo})
			$('#nodedatabox').html(rendered);
		}
	});

	$.ajax({
		url: localStorage.getItem("dbpath") + "/db/data/transaction/commit",
		type: 'POST',
		accepts: {json: "application/json"},
		dataType: "json",
		contentType: "application/json",
		headers: {
			"Authorization": localStorage.getItem("auth")
		},
		data: JSON.stringify({
			  "statements" : [ {
			    "statement" : "CREATE CONSTRAINT ON (c:User) ASSERT c.UserName IS UNIQUE"
			  }, {
			    "statement" : "CREATE CONSTRAINT ON (c:Computer) ASSERT c.ComputerName IS UNIQUE"
			  }, {
			    "statement" : "CREATE CONSTRAINT ON (c:Group) ASSERT c.GroupName IS UNIQUE"
			  } ]
		}),
		success: function(json) {
			console.log('Set Constraints');
		}
	});

	// Add typeaheads for pathfinding/search boxes
	$('#searchBar').typeahead({
		source: function (query, process) {
			return $.ajax({
				url: "http://localhost:7474/db/data/cypher",
				type: 'POST',
				accepts: {json: "application/json"},
				dataType: "json",
				contentType: "application/json",
				headers: {
					"Authorization": "Basic bmVvNGo6bmVvNGpq"
				},
				data: JSON.stringify( { "query" : "MATCH (n) WHERE n.name =~ '(?i)" + query + ".*' AND NOT n.name ENDS WITH '$' RETURN n.name LIMIT 10"}),
				success: function(json) {
					var d = json.data
					var l = d.length;
					for (var i = 0; i < l; i++) {
						d[i] = d[i].toString();
					}
					return process(json.data);
				}
			});
		}, afterSelect: function(selected){
			if (!pathfindingMode){
				doQuery("MATCH (n) WHERE n.name =~ '(?i)" + selected + ".*' AND NOT n.name ENDS WITH '$' RETURN n");	
			}else{
				var start = $('#searchBar').val();
				var end = $('#endNode').val();
				if (start != "" &&  end != ""){
					doQuery("MATCH (source {name:'" + start + "'}), (target {name:'" + end + "'}), p=allShortestPaths((source)-[*]->(target)) RETURN p", start, end);	
				}
			}
		}, autoSelect: false
	});

	$('#endNode').typeahead({
		source: function (query, process) {
			return $.ajax({
				url: "http://localhost:7474/db/data/cypher",
				type: 'POST',
				accepts: {json: "application/json"},
				dataType: "json",
				contentType: "application/json",
				headers: {
					"Authorization": "Basic bmVvNGo6bmVvNGpq"
				},
				data: JSON.stringify( { "query" : "MATCH (n) WHERE n.name =~ '(?i)" + query + ".*' AND NOT n.name ENDS WITH '$' RETURN n.name LIMIT 10"}),
				success: function(json) {
					var d = json.data
					var l = d.length;
					for (var i = 0; i < l; i++) {
						d[i] = d[i].toString();
					}
					return process(json.data);
				}
			});
		}, afterSelect: function(selected){
			var start = $('#searchBar').val();
			var end = $('#endNode').val();
			if (start != "" &&  end != ""){
				doQuery("MATCH (source {name:'" + start + "'}), (target {name:'" + end + "'}), p=allShortestPaths((source)-[*]->(target)) RETURN p", start, end);	
			}
		}, autoSelect: false
	});

	// Do this query to set the initial graph
	doQuery("MATCH (n:Group {name:\'DOMAIN ADMINS\'})-[r]->(m) RETURN n,r,m");
}