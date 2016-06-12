$(document).ready(function(){
	$('#loginpanel').fadeToggle(0)
	$('#checkconnectionpanel').fadeToggle(0)
	$('#logoutpanel').fadeToggle(0)
	$('#spotlight').fadeToggle(0);
	$('#queryLoad').fadeToggle(0);

	$('#circle').circleProgress({
	    value: 0,
	    size: 80,
	    fill: {
	    	gradient: ["red","black"]
	    },
	    startAngle: -1.57
	}).on('circle-animation-progress', function(event, progress) {
	    $(this).find('strong').html(parseInt(100 * progress) + '<i>%</i>');
	});

	// Set our default renderer to Canvas, since a lot of plugins dont work on WebGL
	sigma.renderers.def = sigma.renderers.canvas

	localStorage.setItem('collapseThreshold', 5)

	sigma.classes.graph.addMethod('outboundNodes', function(id) {
		return this.outNeighborsIndex.get(id).keyList();
	})

	sigma.classes.graph.addMethod('inboundNodes', function(id) {
		return this.inNeighborsIndex.get(id).keyList();
	})
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
		labelAlignment: 'bottom',
		labelColor: 'node',
		font: 'Roboto',
		glyphFillColor: 'black',
		glyphTextColor: 'white',
		glyphTextThreshold: 1,
		defaultLabelActiveColor:'red'
	})

	sigmaInstance.bind('hovers', function(e){
		if (e.data.enter.nodes.length > 0){
			if (currentEndNode != null && currentStartNode == null){
				path(e.data.enter.nodes[0].id);
			}

			if (currentStartNode != null && currentEndNode == null){
				reversepath(e.data.enter.nodes[0].id);
			}
		}

		if (e.data.leave.nodes.length > 0){
			if (currentPath.length > 0){
				$.each(currentPath, function(index, edge){
					edge.color = '#356';	
				});
				currentPath = [];
				sigmaInstance.refresh({'skipIndexation': true})
			}

			if (reversePath.length > 0){
				$.each(reversePath, function(index, edge){
					edge.color = '#356';	
				});
				reversePath = [];
				sigmaInstance.refresh({'skipIndexation': true})
			}
		}
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
	      	bins: 10,
	      	min: 10,
	      	max: 20
	    },
	    icon: {
	    	by: 'neo4j_labels.0',
	    	scheme: 'iconScheme'
	    }
	  }
	};

	var activeState = sigma.plugins.activeState(sigmaInstance);

	var kbd = sigma.plugins.keyboard(sigmaInstance, sigmaInstance.renderers[0]);
	
	kbd.bind('17', function(){
		if (labelsVisible){
			sigmaInstance.settings("labelThreshold", 15);
			sigmaInstance.refresh( {'skipIndexation': true})
			labelsVisible = false;	
		}else{
			sigmaInstance.settings("labelThreshold", 1);
			sigmaInstance.refresh( {'skipIndexation': true})
			labelsVisible = true;
		}
	});

	kbd.bind('32', function(){
		$('#spotlight').fadeToggle()
	})

	design = sigma.plugins.design(sigmaInstance);
	design.setPalette(myPalette);
	design.setStyles(myStyles);

	// Make glyphs draw whenever sigma renders
	sigmaInstance.renderers[0].bind('render', function(e) {
      sigmaInstance.renderers[0].glyphs();
    });

	// Initialize the noverlap plugin
	noverlapListener = sigmaInstance.configNoverlap({nodeMargin: 2.0, easing: 'cubicInOut', gridSize: 50})
	noverlapListener.bind('stop', function(event){
		$('#loadingText').text('Complete')
		$('#circle').circleProgress({
			animationStartValue: .75,
			value: 1
		})
		if ($('#queryLoad').is(":visible")){
			setTimeout(function(){
				$('#queryLoad').fadeToggle()
			}, 2000)
			if (noanimate){
				sigmaInstance.settings('animationsTime', 200);
				noanimate = false;
			}
		}
		
	})

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
				'			<li onclick="doQuery(\'MATCH (n {name:&quot;{{label}}&quot;})<-[r:MemberOf]-(m) RETURN n,r,m\')"><i class="glyphicon glyphicon-screenshot"></i> Get Members</li>' + 
				'			<li onclick="doQuery(\'MATCH (n {name:&quot;{{label}}&quot;})-[r:AdminTo]->(m) RETURN n,r,m\', &quot;{{label}}&quot;)"><i class="glyphicon glyphicon-screenshot"></i> Admin To</li>' + 
				'		{{/type_group}}' +
				'		{{#expand}}' +
				'			<li onclick="unfold({{id}})"><i class="glyphicon glyphicon-screenshot"></i> Expand</li>' +
				'		{{/expand}}' +
				'		{{#collapse}}' +
				'			<li onclick="collapse({{id}})"><i class="glyphicon glyphicon-screenshot"></i> Collapse</li>' +
				'		{{/collapse}}' +
				'		{{#grouped}}' +
				'			<li onclick="ungroup({{id}})"><i class="glyphicon glyphicon-screenshot"></i> Expand</li>' +
				'		{{/grouped}}' +
				'	</ul>',
			    autoadjust:true,
				renderer: function(node, template){
					node.expand = false;
					node.collapse = false;
					if (typeof node.folded != 'undefined' && !node.grouped){
						if (typeof sigmaInstance.graph.nodes(node.folded.nodes[0].id) == 'undefined'){
							node.expand = true;
						}else{
							node.collapse = true;
						}
					}
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
		alignNodeSiblings:true,
		barnesHutOptimize: true
	});

	// Set Noverlap to run when forcelink is run
	fa.bind('stop', function(event){
		if (event.type == 'stop'){
			$('#loadingText').text('Fixing Overlap')
			$('#circle').circleProgress({
				animationStartValue: .50,
				value: .75
			})
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
	  	$('#loadingText').text('Fixing Overlap')
		$('#circle').circleProgress({
			animationStartValue: .50,
			value: .75
		})
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
						$('#overlay').fadeToggle(400, 'swing', function(){
							$('#connectionstatus').html('Checking Stored Credentials <i class="fa fa-spinner fa-spin"></i>')
						})
					}, 1000)
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
				doQuery("MATCH (n) WHERE n.name =~ '(?i)" + escapeRegExp(e.currentTarget.value) + ".*' RETURN n");	
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
		if ((e.which == 13) && ($('#loginbutton').prop('disabled') != true)){
			$('#loginbutton').click()
		}
	});

	$('#dbpassword').bind('keypress', function(e){
		if ((e.which == 13) && ($('#loginbutton').prop('disabled') != true)){
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
		ingestData()
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

	$('#zoomIn').on('click', function(event){
		var cam = sigmaInstance.camera;

		sigma.misc.animation.camera(cam, {
		  ratio: cam.ratio / cam.settings('zoomingRatio')
		}, {
		  duration: sigmaInstance.settings('animationsTime')
		});
	})

	$('#zoomOut').on('click', function(event){
		var cam = sigmaInstance.camera;

		sigma.misc.animation.camera(cam, {
		  ratio: cam.ratio * cam.settings('zoomingRatio')
		}, {
		  duration: sigmaInstance.settings('animationsTime')
		});
	})

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

			url = url.replace(/\/$/, "");

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
						$('#overlay').fadeToggle(400, 'swing', function(){
							$('#loginpanel').fadeToggle(0)
							$('#loginbutton').removeClass('activate');
							$('#loginbutton').html('Login<span class="spinner"><i class="fa fa-spinner fa-spin"></i></span>')
							$('#loginbutton').addClass('btn-default')
							$('#loginbutton').removeClass('btn-success');
							$('#dbpassword').val("");
						})
					}, 1500)
				},
				error: function(e){
					$('#loginbadpw').removeClass('hide')
					$('#loginbutton').toggleClass('activate');
				}
			})
		}
	});

	$('#spotlightTable').click( function(event) {
	    var target = $(event.target);
	    $tr = target.closest('tr');
      
      	var tid = $tr.attr('data-id')
      	var pid = $tr.attr('data-parent-id')

      	var node = sigmaInstance.graph.nodes(tid);
      	if (typeof node == 'undefined'){
      		var c = sigmaInstance.graph.nodes(pid).folded.nodes.filter(function(val){
      			return val.id == tid
      		})[0]

      		c.data = {}
      		c.data.node = {}
      		c.data.node.label = c.neo4j_data.name
      		if (c.neo4j_labels[0]=='Group'){
				c.data.node.type_group = true
			}else if (c.neo4j_labels[0] == 'User'){
				c.data.node.type_user = true
			}else{
				c.data.node.type_computer = true
			}
      		updateNodeData(c)
      		node = sigmaInstance.graph.nodes(pid)
      	}else{
      		node.data = {}
      		node.data.node = {}
      		node.data.node.label = node.neo4j_data.name
      		if (node.neo4j_labels[0]=='Group'){
				node.data.node.type_group = true
			}else if (node.neo4j_labels[0] == 'User'){
				node.data.node.type_user = true
			}else{
				node.data.node.type_computer = true
			}
      		updateNodeData(node)
      	}

      	sigma.misc.animation.camera(
      		sigmaInstance.camera,
      		{
      			x: node[sigmaInstance.camera.readPrefix + 'x'],
      			y: node[sigmaInstance.camera.readPrefix + 'y'],
      			ratio: .5
      		},
      		{duration: sigmaInstance.settings('animationsTime')}
      	)

      	node.color = "#2DC486"
      	setTimeout(function(){
      		node.color = "black"
      		sigmaInstance.refresh({skipIndexation: true})
      	}, 2000)

      	$('#spotlight').fadeToggle()
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

	if (ohsettings == 0){
		ohsettings = $('#settingsbuttonhidden').outerHeight() + "px"
		$('#settingsbutton').css({'height':ohsettings})
	}

	$('#settingsbutton').hover(function(){
		var w = $('#settingsbuttonhidden').outerWidth() + 1 + "px"
		if (owsettings == 0){
			owsettings = $('#settingsbutton').outerWidth() + 1 + "px"
		}

		$(this).stop().animate({
			width: w
		}, 100, function(){
			$(this).html('Settings<span style="width:19px" class="fa fa-cogs rightspan rightglyph"></span>')
		})
	}, function(){
		$(this).html('<span style="width: 14px" class="fa fa-cogs rightspan"></span>')
		$(this).stop().animate({
			width: owsettings
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
		$('#uploadFileSelected').val(e.target.files[0].name);
	})

	$('#dburl').on('focus', function(e){
		$('#dbHelpBlock').addClass('hide')
		dburlchecked = false;
	})

	$('#dburl').bind('keydown', function(e){
		if (e.which == 13){
			event.preventDefault();
			$('#dburl').blur();
		}else{
			$('#loginbutton').prop('disabled', true)
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
					$('#loginbutton').prop('disabled', false)
				},
				error: function(e){
					icon.removeClass();
					icon.addClass("fa fa-times-circle red-icon-color form-control-feedback")
					$('#dbHelpBlock').removeClass('hide')
					$('#loginbutton').prop('disabled', true)
				}
			})
		}
		
	})

	// Make our export/ingest boxes draggable
	$('#uploadSelectDiv').draggable({scroll:false, containment: "window"});
	$('#exportSelectDiv').draggable({scroll:false, containment: "window"});
	uploadwidth = $('#uploadSelectDiv').outerWidth()
	$('#uploadSelectDiv').css('width', uploadwidth + 'px')
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
var owsettings = 0
var ohsettings = 0
var design = null;
var usedagre = false;
var ingesthtml = null;
var ingestWorker = null
var uploadwidth = null;
var labelsVisible = false;
var noanimate = true;
var currentStartNode = null;
var currentEndNode = null;
var currentPath = [];
var reversePath = [];
var spotlightData = {};

var cancelQuery = null;

function escapeRegExp(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\\\$&');
}

var path = function(nid){
	n = sigmaInstance.graph.nodes(nid)
	if (n.id != currentEndNode.id){
		var ed = sigmaInstance.graph.adjacentEdges(n.id)
		$.each(sigmaInstance.graph.outboundNodes(n.id), function(index, nextnode){
			var tedge = null;
			$.each(ed, function(index, pos){
				if (pos.target == nextnode){
					tedge = pos;
				}
			})
			tedge.color = 'red';
			currentPath.push(tedge);
			path(nextnode)
		})
	}else{
		sigmaInstance.refresh({'skipIndexation': true})
	}
}

var reversepath = function(nid){
	n = sigmaInstance.graph.nodes(nid)
	if (n.id != currentStartNode.id){
		var ed = sigmaInstance.graph.adjacentEdges(n.id)
		$.each(sigmaInstance.graph.inboundNodes(n.id), function(index, nextnode){
			var tedge = null;
			$.each(ed, function(index, pos){
				if (pos.source == nextnode){
					tedge = pos;
				}
			})
			tedge.color = 'blue';
			reversePath.push(tedge);
			reversepath(nextnode)
		})
	}else{
		sigmaInstance.refresh({'skipIndexation': true})
	}
}


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

function doQuery(query, start, end, preventCollapse){
	currentEndNode = null;
	currentStartNode = null;
	if (typeof start === 'undefined'){
		start = ""
	}
	if (typeof end === 'undefined'){
		end = ""
	}

	if (typeof preventCollapse === 'undefined'){
		preventCollapse = false;
	}
	if (!firstquery){
		queryStack.push([sigmaInstance.graph.nodes(), sigmaInstance.graph.edges(), spotlightData]);
	}
	spotlightData = {}
	firstquery = false;
	if (currentTooltip != null){
		currentTooltip.close();	
	}

	$('#loadingText').text('Querying Database')
	$('#circle').circleProgress({
		value: 0
	})
	if ($('#queryLoad').is(":hidden")){
		$('#queryLoad').fadeToggle()	
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
				$('#loadingText').text('Processing Nodes')
				$('#circle').circleProgress({
					value: .25
				})
				$.each(sigmaInstance.graph.nodes(), function(index, node){
					node.degree = sigmaInstance.graph.degree(node.id)
				})
				$.each(sigmaInstance.graph.nodes(), function(index, node){
					if (node.neo4j_labels[0]=='Group'){
						node.type_group = true
					}else if (node.neo4j_labels[0] == 'User'){
						node.type_user = true
					}else{
						node.type_computer = true
					}

					if (node.neo4j_data.name == start){
						startNode = node;
						currentStartNode = node;
					}

					if (node.neo4j_data.name == end){
						endNode = node;
						currentEndNode = node;
					}					
				})

				if (!preventCollapse){
					$.each(sigmaInstance.graph.nodes(), function(index, node){
						evaluateCollapse(node, start, end)
					})

					$.each(sigmaInstance.graph.nodes(), function(index, node){
						evaluateSiblings(node)
					})
				}
				
				$.each(sigmaInstance.graph.nodes(), function(index, node){
					if (!spotlightData.hasOwnProperty(node.id)){
						spotlightData[node.id] = [node.neo4j_data.name, 0, ""]
					}
				})

				updateSpotlight()
				sigmaInstance.refresh();
				design.apply()
				sigma.misc.animation.camera(sigmaInstance.camera, { x:0, y:0, ratio: 1.075 });
				if (!(startNode === null)){
					startNode.glyphs = [{
						'position':'bottom-right',
						'font': 'FontAwesome',
						'content': '\uF21D',
						'fillColor': '#3399FF',
						'fontScale':1.5
					}]

					if (typeof startNode.folded != 'undefined'){
						startNode.glyphs.push({
							'position':'bottom-left',
							'content': startNode.folded.nodes.length
						})
					}
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

					if (typeof endNode.folded != 'undefined'){
						endNode.glyphs.push({
							'position':'bottom-left',
							'content': endNode.folded.nodes.length
						})
					}
					endNode.size = endNode.size + 5
				}
				$('#loadingText').text('Initial Layout')
				$('#circle').circleProgress({
					animationStartValue: .25,
					value: .50
				})
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
		spotlightData = query[2]
		updateSpotlight()
	}
}

$(function () {
 	$('[data-toggle="tooltip"]').tooltip()
})

function updateSpotlight(){
	$('#nodeBody').empty();
	var toDisplay = []

	$.each(Object.keys(spotlightData), function(index, key){
		var d = spotlightData[key]
		toDisplay.push([key, d[0], d[1], d[2]])
	})

	toDisplay.sort(function(a,b){
		if (a[1] < b[1]){
			return -1;
		}else if (a[1] > b[1]){
			return 1;
		}else{
			return 0;
		}
	})
	var template = "<tr data-id=\"{{NodeId}}\" data-parent-id=\"{{ParentId}}\"><td>{{NodeName}}</td><td>{{ParentName}}</td></tr>"
	$.each(toDisplay, function(index, data){
		var h = Mustache.render(template, {NodeId: data[0], NodeName: data[1], ParentId: data[2], ParentName:data[3]})
		$("#nodeBody").append(h);
	})
}

function updateNodeData(node){
	var template = $('#datatemplate').html();
	var loading = Mustache.render(loadingString, {label: node.data.node.label})
	var rendered = Mustache.render(template, {dbinfo: dbinforendered, nodeinfo: loading});
	var elem = $('#nodedatabox')
	if (cancelQuery != null){
		cancelQuery.abort()
	}
	elem.html(rendered);
	$('.nav-tabs a[href="#nodeinfo"]').tab('show')
	if (elem.is(":hidden")){
		$('#nodedatabox').slideToggle()	
	}
	
	if (node.data.node.type_user == true){
		cancelQuery = $.ajax({
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
				  	"statement" : "MATCH (n:User {name:'" + node.data.node.label + "'}), (m:Computer), (o:Group), (n)-[r:MemberOf]->(o)-[s:AdminTo]->(m) RETURN count(distinct(m))"
				  }, {
				  	"statement" : "MATCH (n:User {name:'" + node.data.node.label + "'}), (target:Computer), p=allShortestPaths((n)-[*]->(target)) RETURN count(distinct(target))"
				  }, {
				  	"statement" : "MATCH (n:Computer)-[r:HasSession]->(m:User {name:'" + node.data.node.label + "'}) RETURN count(n)"
				  } ]
			}),
			success: function(json) {
				cancelQuery = null
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
		cancelQuery = $.ajax({
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
				cancelQuery = null
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
		cancelQuery = $.ajax({
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
				  }, {
				  	"statement" : "MATCH (n:Group {name:'" + node.data.node.label + "'}), (target:Group), p=allShortestPaths((n)-[r:MemberOf*1..]->(target)) RETURN count(target)"
				  } ]
			}),
			success: function(json) {
				cancelQuery = null
				var c1 = json.results[0].data[0].row[0];
				var c2 = json.results[1].data[0].row[0];
				var c3 = json.results[2].data[0].row[0];
				var c4 = json.results[3].data[0].row[0];
				var c5 = json.results[4].data[0].row[0];
				
				var template = $('#datatemplate').html();
				var groupnodetemplate = $('#grouptemplate').html();
				var nodeinfo = Mustache.render(groupnodetemplate, {label: node.data.node.label, explicit_members: c1, unrolled_members: c2, adminto:c3, derivative_admin: c4, unrolled_member_of:c5});
				var rendered = Mustache.render(template, {dbinfo: dbinforendered, nodeinfo: nodeinfo});
				$('#nodedatabox').html(rendered);
				$('.nav-tabs a[href="#nodeinfo"]').tab('show')
			}
		});
	}
}

function forceRelayout(){
	if ($('#queryLoad').is(":hidden")){
		$('#queryLoad').fadeToggle()
	}
	$('#loadingText').text('Initial Layout')
	$('#circle').circleProgress({
		animationStartValue: .50,
		value: .75
	})
	sigma.layouts.stopForceLink();
	if (usedagre){
		sigma.layouts.dagre.start(sigmaInstance);
	}else{
		sigma.layouts.startForceLink();	
	}	
}

function ingestData(){
	var reader = new FileReader();
	$('#startingestbutton').prop('disabled', true)
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
		d['auth'] = localStorage.getItem('auth')
		d['dburl'] = localStorage.getItem('dbpath')
		ingestWorker = makeWorker(document.getElementById('ingestworker').textContent);

		ingestWorker.addEventListener('message', function(e){
			if (e.data.message == 'baddata'){
				$('#badDataModal').modal('show')
			}else if (e.data.message == 'start'){
				var template = $('#ingestProgressBar').html();
				var w = 0
				var h = Mustache.render(template, {"progress": 0, "total": e.data.len, "width": w})
				$('#uploadSelectDiv').fadeToggle(250, 'swing', function(){
					$('#uploadSelectDiv').html(h)
					$('#uploadSelectDiv').fadeToggle(250)
				})
			}else if (e.data.message == 'progress'){
				var template = $('#ingestProgressBar').html();
				var w = Math.floor((e.data.progress / e.data.len) * 100)
				var h = Mustache.render(template, {"progress": e.data.progress, "total": e.data.len, "width": w})
				$('#uploadSelectDiv').html(h)
			}else if (e.data.message == 'commit'){
				getDBInfo()
			}else if (e.data.message == 'end'){
				getDBInfo()
				var template = $('#ingestComplete').html();
				var h = Mustache.render(template, {"total": e.data.len, "time": e.data.time})
				$('#uploadSelectDiv').fadeToggle(250, 'swing', function(){
					$('#uploadSelectDiv').html(h)
					$('#uploadSelectDiv').fadeToggle(250, 'swing', function(){
						setTimeout(function(){
							$('#uploadSelectDiv').fadeToggle(250, 'swing', function(){
								$('#uploadSelectDiv').html(ingesthtml)
								$('#uploadFileSelected').val("")
								$('#uploadSelectDiv').fadeToggle(250)	
								$('#startingestbutton').prop('disabled', false)
								
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

								$('#startingestbutton').on('click', function(event){
									ingestData()
								})

								$('#selectUploadFile').on('click', function(event){
									$('#uploader').click();
								});
							})
						}, 2000)
					})
				})
			}
		});
		ingesthtml = $('#uploadSelectDiv').html()


		ingestWorker.postMessage(d);
	}

	reader.readAsText(document.getElementById('uploader').files[0]);
}

function getDBInfo(){
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
}

function doInit(){
	getDBInfo()
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
			  }, {
			  	"statement" : "CREATE INDEX ON :User(name)"
			  }, {
			  	"statement" : "CREATE INDEX ON :Computer(name)"
			  }, {
			  	"statement" : "CREATE INDEX ON :Group(name)"
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
				data: JSON.stringify( { "query" : "MATCH (n) WHERE n.name =~ '(?i)" + escapeRegExp(query) + ".*' RETURN n.name LIMIT 10"}),
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
				doQuery("MATCH (n) WHERE n.name =~ '(?i)" + escapeRegExp(selected) + ".*' RETURN n");	
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
				data: JSON.stringify( { "query" : "MATCH (n) WHERE n.name =~ '(?i)" + escapeRegExp(query) + ".*' RETURN n.name LIMIT 10"}),
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

	$('#spotlightBar').keyup(function(){
		var rex = new RegExp($(this).val(), 'i');
		$('.searchable tr').hide();
		$('.searchable tr').filter(function(){
			return rex.test($(this).find(">:first-child").text());
		}).show();
	})

	// Do this query to set the initial graph
	doQuery("MATCH (n:Group) WHERE n.name =~ '(?i).*DOMAIN ADMINS.*' WITH n MATCH (n)<-[r:MemberOf]-(m) RETURN n,r,m", "", "", true);
}

function startLogout(){
	$('#logoutpanel').fadeToggle(0);
	$('#overlay').fadeToggle();
}

function stopLogout(){
	$('#overlay').fadeToggle(400, 'swing', function(){
		$('#logoutpanel').fadeToggle(0);
	});
}

function resetUI(){
	sigmaInstance.graph.clear();
	sigmaInstance.refresh();
	$('#searchBar').val("");
	$('#endNode').val("");
	if ($('#nodedatabox').is(':visible')){
		$('#nodedatabox').slideToggle()
	}

	if ($('#pathfindingbox').is(':visible')){
		$('#pathfindingbox').slideToggle()
	}

	localStorage.clear()

	$('#logoutModal').modal('hide')
	$('#loginpanel').fadeToggle(0);
	$('#overlay').fadeToggle();
}

function clearDB(){
	sigmaInstance.graph.clear();
	sigmaInstance.refresh();

	deleteEdges();
}

function deleteEdges(){
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
			    "statement" : "MATCH ()-[r]-() WITH r LIMIT 50000 DELETE r RETURN count(r)"
			  } ]
		}),
		success: function(json) {
			deleted = json.results[0].data[0].row[0];
			if (deleted != 0){
				deleteEdges()
				getDBInfo()
			}else{
				deleteNodes()
			}
		}
	});
}

function deleteNodes(){
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
			    "statement" : "MATCH (n) WITH n LIMIT 50000 DELETE n RETURN count(n)"
			  } ]
		}),
		success: function(json) {
			deleted = json.results[0].data[0].row[0];
			if (deleted != 0){
				deleteNodes()
				getDBInfo()
			}else{
				$('#deleteProgressModal').modal('hide');
				getDBInfo()
			}
		}
	});	
}

function cancelIngest(){
	ingestWorker.terminate()
	var template = $('#ingestCancelled').html();
	var h = Mustache.render(template, {})
	$('#uploadSelectDiv').fadeToggle(250, 'swing', function(){
		$('#uploadSelectDiv').html(h)
		$('#uploadSelectDiv').fadeToggle(250, 'swing', function(){
			setTimeout(function(){
				$('#uploadSelectDiv').fadeToggle(250, 'swing', function(){
					$('#uploadSelectDiv').html(ingesthtml)
					$('#uploadFileSelected').val("")
					$('#uploadSelectDiv').fadeToggle(250)	
					
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

					$('#startingestbutton').on('click', function(event){
						ingestData()
					})

					$('#startingestbutton').prop('disabled', false);

					$('#selectUploadFile').on('click', function(event){
						$('#uploader').click();
					});

					$('#uploader').on('change', function(e){
						$('#uploadFileSelected').val(e.target.files[0].name);
					})
				})
			}, 2000)
		})
	})
}

function unfold(id){
	sigmaInstance.graph.read(sigmaInstance.graph.nodes(id).folded);
	design.deprecate();

	noanimate = true;
	sigmaInstance.settings('animationsTime', 0);

	if (usedagre){
		sigma.layouts.dagre.start(sigmaInstance);
	}else{
		sigma.layouts.startForceLink();	
	}
	
	design.apply();
}

function collapse(id){
	design.deprecate();
	$.each(sigmaInstance.graph.nodes(id).folded.nodes, function(index, node){
		sigmaInstance.graph.dropNode(node.id);
	})

	noanimate = true;
	sigmaInstance.settings('animationsTime', 0);

	if (usedagre){
		sigma.layouts.dagre.start(sigmaInstance);
	}else{
		sigma.layouts.startForceLink();	
	}

	design.apply();
}

function ungroup(id){
	var n = sigmaInstance.graph.nodes(id)
	sigmaInstance.graph.dropNode(id)
	sigmaInstance.refresh()
	sigmaInstance.graph.read(n.folded);
	design.deprecate();

	noanimate = true;
	sigmaInstance.settings('animationsTime', 0);

	if (usedagre){
		sigma.layouts.dagre.start(sigmaInstance);
	}else{
		sigma.layouts.startForceLink();	
	}

	design.apply();
}

function evaluateSiblings(n){
	var adj = sigmaInstance.graph.adjacentEdges(n.id)
	var siblings = []
	if (adj.length > 1 && adj.allEdgesSameType() && n.type_computer){
		var parents = adj.map(
			function(element){
				return element.source
			}
		)
		var tocheck = parents.sort().join(',')
		$.each(sigmaInstance.graph.nodes(), function(index, node){
			np = sigmaInstance.graph.adjacentEdges(node.id).map(
				function(element){
					return element.source
				}
			).sort().join(',')
			if (np == tocheck){
				siblings.push(node)
			}
		})

		if (siblings.length > 10){
			var i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
			while (sigmaInstance.graph.nodes(i) != undefined){
				i = Math.floor(Math.random() * (100000 - 10 + 1)) + 10;
			}

			var folded = {}
			folded.nodes = []
			folded.edges = []

			sigmaInstance.graph.addNode({
				id: i,
				x: n.x,
				y: n.y,
				degree: siblings.length,
				label: "Grouped Computers",
				size: 20,
				neo4j_data: {name: "Grouped Computers"},
				neo4j_labels:["Computer"],
				grouped: true,
				hasFold: true
			})

			$.each(parents, function(index, p){
				sigmaInstance.graph.addEdge({
					id: Math.floor(Math.random() * (100000 - 10 + 1)) + 10,
					source: p,
					target: i,
					label: "AdminTo",
					neo4j_type: "AdminTo",
					size: 1
				})
			})

			var x = sigmaInstance.graph.nodes(i)
			x.glyphs = [{
				'position':'bottom-left',
				'content':siblings.length
			}]

			$.each(siblings, function(index, sib){
				$.each(sigmaInstance.graph.adjacentEdges(sib.id), function(index, e){
					folded.edges.push(e)
				})

				folded.nodes.push(sib)
				spotlightData[sib.id] = [sib.neo4j_data.name, i, x.label]
				sigmaInstance.graph.dropNode(sib.id)
			})
			x.folded = folded
		}
	}	
}

function evaluateCollapse(node, start, end){
	if (node.degree > parseInt(localStorage.getItem('collapseThreshold'))){
		var adjacentNodes = sigmaInstance.graph.adjacentNodes(node.id);
		$.each(adjacentNodes, function(index, adjacentNode){
			if (adjacentNode.neo4j_data.name == start){
				return true;
			}

			if (adjacentNode.neo4j_data.name == end){
				return true;
			}
			var edges = sigmaInstance.graph.adjacentEdges(adjacentNode.id)

			if (edges.length == 1 && (typeof adjacentNode.folded == 'undefined')){
				var edge = edges[0]
				if (adjacentNode.neo4j_labels[0]=='User' && (edge.label == 'MemberOf' || edge.label == 'AdminTo')){
					if (typeof node.folded == 'undefined'){
						node.folded = {};
						node.folded.nodes = [];
						node.folded.edges = [];
						node.hasfold = true;
					}

					node.folded.nodes.push(adjacentNode)
					node.folded.edges.push(edge)
					spotlightData[adjacentNode.id] = [adjacentNode.neo4j_data.name, node.id, node.neo4j_data.name]
					sigmaInstance.graph.dropNode(adjacentNode.id)
					node.glyphs = [{
						'position':'bottom-left',
						'content': node.folded.nodes.length
					}]
				}
			}

			if (edges.length == 1 && (typeof adjacentNode.folded == 'undefined')){
				var edge = edges[0]
				if (adjacentNode.neo4j_labels[0]=='Computer' && edge.label == 'AdminTo'){
					if (typeof node.folded == 'undefined'){
						node.folded = {};
						node.folded.nodes = [];
						node.folded.edges = [];
						node.hasfold = true;
					}

					node.folded.nodes.push(adjacentNode)
					node.folded.edges.push(edge)
					spotlightData[adjacentNode.id] = [adjacentNode.neo4j_data.name, node.id, node.neo4j_data.name]
					sigmaInstance.graph.dropNode(adjacentNode.id)
					node.glyphs = [{
						'position':'bottom-left',
						'content': node.folded.nodes.length
					}]
				}
			}

			if (edges.length == 1 && (typeof adjacentNode.folded == 'undefined')){
				var edge = edges[0]
				if (adjacentNode.neo4j_labels[0]=='Group' && edge.label == 'AdminTo'){
					if (typeof node.folded == 'undefined'){
						node.folded = {};
						node.folded.nodes = [];
						node.folded.edges = [];
						node.hasfold = true;
					}

					node.folded.nodes.push(adjacentNode)
					node.folded.edges.push(edge)
					spotlightData[adjacentNode.id] = [adjacentNode.neo4j_data.name, node.id, node.neo4j_data.name]
					sigmaInstance.graph.dropNode(adjacentNode.id)
					node.glyphs = [{
						'position':'bottom-left',
						'content': node.folded.nodes.length
					}]
				}
			}
		})
	}
}

Array.prototype.allEdgesSameType = function() {

    for(var i = 1; i < this.length; i++)
    {
        if(this[i].neo4j_type !== this[0].neo4j_type)
            return false;
    }

    return true;
}