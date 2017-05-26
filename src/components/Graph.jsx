import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import  { findGraphPath } from 'utils';
var fs = require('fs');
var child_process = require('child_process')
var child;
var path = require('path')
const { dialog } = require('electron').remote

export default class GraphContainer extends Component {
    constructor(props){
        super(props)

        child = child_process.fork(path.join(__dirname,'src','js','worker.js'), {silent:true});

        this.state = {
            sigmaInstance : null,
            design: null,
            dragged: false,
            firstDraw: true,
            template: null,
            session: driver.session()
        }
        $.ajax({
            url: 'src/components/tooltip.html',
            type: 'GET',
            success: function(response){
                this.setState({template: response}) 
            }.bind(this)
        })

        child.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.log(`error: ${data}`);
        });

        child.on('message', function(m) {
          this.loadFromChildProcess(m)
        }.bind(this));

        var s1 = driver.session()
        var s2 = driver.session()
        var s3 = driver.session()
        var s4 = driver.session()

        s1.run("CREATE CONSTRAINT ON (c:User) ASSERT c.name IS UNIQUE")
            .then(function(){
                s1.close()
                 s2.run("CREATE CONSTRAINT ON (c:Computer) ASSERT c.name IS UNIQUE")
                    .then(function(){
                        s2.close()
                        s3.run("CREATE CONSTRAINT ON (c:Group) ASSERT c.name IS UNIQUE")
                            .then(function(){
                                s3.close()
                                s4.run("CREATE CONSTRAINT ON (c:Domain) ASSERT c.name IS UNIQUE")
                                    .then(function(){
                                        s4.close()
                                    })
                                    .catch(function(){
                                        s4.close()
                                    })
                            })
                            .catch(function(){
                                s3.close()
                            })
                    })
                    .catch(function(){
                        s2.close()
                    })
            })
            .catch(function(){
                s1.close()
            })
       
        emitter.on('doLogout', function(){
            this.state.sigmaInstance.graph.clear();
            this.state.sigmaInstance.refresh();
            sigma.layouts.killForceLink();
            this.setState({sigmaInstance: null})
            child.kill();
        }.bind(this))
    }

    relayout(){
        sigma.layouts.stopForceLink()
        if (appStore.dagre){
            sigma.layouts.dagre.start(this.state.sigmaInstance);
        }else{
            sigma.layouts.startForceLink()
        }
    }

    export(payload){
        if (payload === 'image'){
            var size = $('#graph').outerWidth()
            sigma.plugins.image(this.state.sigmaInstance,
                this.state.sigmaInstance.renderers[0],
                {
                    download: true,
                    size: size,
                    background: 'lightgray',
                    clip: true
              });
        }else{
            var json = this.state.sigmaInstance.toJSON({
                pretty: true,
            })

            json = JSON.parse(json)
            json.spotlight = appStore.spotlightData

            dialog.showSaveDialog({
                defaultPath: 'graph.json'
            }, function(loc){
                fs.writeFile(loc, JSON.stringify(json, null, 2))
            })
        }
    }

    loadFromChildProcess(graph){
        if (graph.nodes.length === 0){
                emitter.emit('showAlert', "No data returned from query")
                emitter.emit('updateLoadingText', "Done!")
                setTimeout(function(){
                    emitter.emit('showLoadingIndicator', false);    
                }, 1500)
        }else{
            if (!this.state.firstDraw){
                appStore.queryStack.push({
                    nodes: this.state.sigmaInstance.graph.nodes(),
                    edges: this.state.sigmaInstance.graph.edges(),
                    spotlight: appStore.spotlightData,
                    startNode: appStore.startNode,
                    endNode: appStore.endNode
                })
            }
            $.each(graph.nodes, function(i, node){
                if (node.start){
                    appStore.startNode = node
                }

                if (node.end){
                    appStore.endNode = node
                }

                node.glyphs = $.map(node.glyphs, function(value, index) {
                    return [value];
                });
            })

            this.setState({firstDraw: false})
            sigma.misc.animation.camera(this.state.sigmaInstance.camera, { x: 0, y: 0, ratio: 1.075 });

            appStore.spotlightData = graph.spotlight;
            this.state.sigmaInstance.graph.clear();
            this.state.sigmaInstance.graph.read(graph);
            this.state.design.deprecate();
            this.state.sigmaInstance.refresh();
            this.state.design.apply();

            if (appStore.dagre){
                sigma.layouts.dagre.start(this.state.sigmaInstance);
            }else{
                sigma.layouts.startForceLink()
            }
            emitter.emit('spotlightUpdate');
        } 
    }

    import(payload){
        fs.readFile(payload, 'utf8', function(err, data){
            var graph;
            try{
                graph = JSON.parse(data);
            }catch (err){
                emitter.emit('showAlert', 'Bad JSON File');
                return
            }

            if (graph.nodes.length === 0){
                emitter.emit('showAlert', "No data returned from query")
            }else{
                $.each(graph.nodes, function(i, node){
                    node.glyphs = $.map(node.glyphs, function(value, index) {
                        return [value];
                    });
                })
                appStore.queryStack.push({
                    nodes: this.state.sigmaInstance.graph.nodes(),
                    edges: this.state.sigmaInstance.graph.edges(),
                    spotlight: appStore.spotlightData,
                    startNode: appStore.startNode,
                    endNode: appStore.endNode
                })

                appStore.spotlightData = graph.spotlight;
                this.state.sigmaInstance.graph.clear();
                this.state.sigmaInstance.graph.read(graph);
                this.state.sigmaInstance.refresh()
                emitter.emit('spotlightUpdate');
            }
            
        }.bind(this))
    }

    clearGraph(){
        this.state.sigmaInstance.graph.clear()
        this.state.sigmaInstance.refresh()
    }

    setGraphicsMode(){
        var lowgfx = appStore.performance.lowGraphics
        var sigmaInstance = this.state.sigmaInstance
        this.state.design.clear()
        if (lowgfx){
            sigmaInstance.settings('defaultEdgeType', 'line');
            sigmaInstance.settings('defaultEdgeColor', 'black');
            this.state.design.setPalette(appStore.lowResPalette);
            this.state.design.setStyles(appStore.lowResStyle);
        }else{
            sigmaInstance.settings('defaultEdgeType', 'tapered');
            sigmaInstance.settings('defaultEdgeColor', '#356');
            this.state.design.setPalette(appStore.highResPalette);
            this.state.design.setStyles(appStore.highResStyle);
        }
        this.state.design.deprecate()
        sigmaInstance.refresh()
        this.state.design.apply()
    }

    componentWillMount() {
        emitter.on('searchQuery', this.doSearchQuery.bind(this));
        emitter.on('pathQuery', this.doPathQuery.bind(this));
        emitter.on('graphBack', this.goBack.bind(this));
        emitter.on('query', this.doGenericQuery.bind(this));
        emitter.on('spotlightClick', this.spotlightClickHandler.bind(this))
        emitter.on('graphRefresh', this.relayout.bind(this))
        emitter.on('export', this.export.bind(this))
        emitter.on('import', this.import.bind(this))
        emitter.on('clearDB', this.clearGraph.bind(this))
        emitter.on('changeGraphicsMode', this.setGraphicsMode.bind(this))
        emitter.on('ungroupNode', this.ungroupNode.bind(this))
        emitter.on('unfoldNode', this.unfoldEdgeNode.bind(this))
        emitter.on('collapseNode', this.foldEdgeNode.bind(this))
        emitter.on('resetZoom', this.resetZoom.bind(this))
        emitter.on('zoomIn', this.zoomIn.bind(this))
        emitter.on('zoomOut', this.zoomOut.bind(this))
    }

    resetZoom(){
        sigma.misc.animation.camera(
            this.state.sigmaInstance.camera,
             { x: 0, y: 0, ratio: 1.075 })
        ;
    }

    zoomOut(){
        var sigmaInstance = this.state.sigmaInstance
        var cam = sigmaInstance.camera;

        sigma.misc.animation.camera(cam, {
            ratio: cam.ratio * cam.settings('zoomingRatio')
        }, {
            duration: sigmaInstance.settings('animationsTime')
        });
    }

    zoomIn(){
        var sigmaInstance = this.state.sigmaInstance
        var cam = sigmaInstance.camera;

        sigma.misc.animation.camera(cam, 
        {
            ratio: cam.ratio / cam.settings('zoomingRatio')
        }, 
        {
            duration: sigmaInstance.settings('animationsTime')
        });
    }

    componentDidMount() {
        this.initializeSigma();
        
        this.doQueryNative({
            statement: 'MATCH (n:Group) WHERE n.name =~ "(?i).*DOMAIN ADMINS.*" WITH n MATCH (n)<-[r:MemberOf*1..]-(m) RETURN n,r,m',
            allowCollapse: false,
            props: {}
        })
    }

    render() {
        return (
            <div className="graph">
                <div id="graph" className="graph"></div>
            </div>
        );
    }

    goBack(){
        if (appStore.queryStack.length > 0) {
            if (appStore.currentTooltip !== null) {
                appStore.currentTooltip.close();
            }
            sigma.layouts.stopForceLink();

            var query = appStore.queryStack.pop();
            this.state.sigmaInstance.graph.clear();
            this.state.sigmaInstance.graph.read({ nodes: query.nodes, edges: query.edges });
            this.state.design.deprecate();
            this.state.sigmaInstance.refresh();
            this.state.design.apply();
            appStore.spotlightData = query.spotlight;
            appStore.startNode = query.startNode,
            appStore.endNode = query.endNode;
            emitter.emit('spotlightUpdate');
        }
    }

    spotlightClickHandler(nodeId, parentId){
        var sigmaInstance = this.state.sigmaInstance;
        var parent = sigmaInstance.graph.nodes(nodeId)
        var label, child;
        if (typeof parent === 'undefined'){
            child = sigmaInstance.graph.nodes(parentId).folded.nodes.filter(function(val){
                return val.id == nodeId;
            })[0]
            parent = sigmaInstance.graph.nodes(parentId);
        }else{
            child = parent;
        }
        label = child.label;
        if (child.type_user){
            emitter.emit('userNodeClicked', label)
        }else if (child.type_group){
            emitter.emit('groupNodeClicked', label)
        }else if (child.type_computer){
            emitter.emit('computerNodeClicked', label)
        }
        parent.color = "#2DC486"
        sigma.misc.animation.camera(
            sigmaInstance.camera, {
                x: parent[sigmaInstance.camera.readPrefix + 'x'],
                y: parent[sigmaInstance.camera.readPrefix + 'y'],
                ratio: 0.5
            }, { duration: sigmaInstance.settings('animationsTime') }
        );

        setTimeout(function(){
            parent.color = "black";
            sigmaInstance.refresh({skipIndexation: true});
        }, 2000)
    }

    doQueryNative(params){
        if (appStore.performance.debug){
            emitter.emit('setRawQuery',params.statement);
        }
        var sigmaInstance = this.state.sigmaInstance
        var nodes = {}
        var edges = {}
        var session = driver.session()
        if (typeof params.props === 'undefined'){
            params.props = {}
        }
        emitter.emit('showLoadingIndicator', true);
        emitter.emit('updateLoadingText', "Querying Database")
        emitter.emit('resetSpotlight')
        session.run(params.statement, params.props)
            .subscribe({
                onNext: function(result){
                    $.each(result._fields, function(index, field){
                        if (field != null){
                            if (field.hasOwnProperty('segments')){
                                $.each(field.segments,function(index, segment){
                                    var end = this.createNodeFromRow(segment.end, params)
                                    var start = this.createNodeFromRow(segment.start, params)
                                    var edge = this.createEdgeFromRow(segment.relationship)

                                    if (!edges[edge.id]){
                                        edges[edge.id] = edge
                                    }

                                    if (!nodes[end.id]){
                                        nodes[end.id] = end
                                    }

                                    if (!nodes[start.id]){
                                        nodes[start.id] = start
                                    }
                                }.bind(this))
                            }else{
                                if ($.isArray(field)){
                                    $.each(field, function(index, value){
                                        if (value != null){
                                            var id = value.identity.low
                                            if (value.end && !edges.id){
                                                edges[id] = this.createEdgeFromRow(value)
                                            }else if (!nodes.id){
                                                nodes[id] = this.createNodeFromRow(value, params)
                                            }
                                        }
                                    }.bind(this))
                                }else{
                                    var id = field.identity.low
                                    if (field.end && !edges.id){
                                        edges[id] = this.createEdgeFromRow(field)
                                    }else if (!nodes.id){
                                        nodes[id] = this.createNodeFromRow(field, params)
                                    }
                                }
                            }
                        }
                    }.bind(this))
                }.bind(this),
                onError: function(error){
                    console.log(error)
                },
                onCompleted: function(){
                    var graph = {nodes:[],edges:[]}
                    $.each(nodes, function(node){
                        graph.nodes.push(nodes[node])
                    })

                    $.each(edges, function(edge){
                        graph.edges.push(edges[edge])
                    })
                    emitter.emit('updateLoadingText', "Processing Data")

                    child.send(JSON.stringify({graph: graph,
                         edge: params.allowCollapse ? appStore.performance.edge : 0 ,
                         sibling: params.allowCollapse ? appStore.performance.sibling : 0,
                         start: params.start,
                         end: params.end
                     }))
                    session.close()
                }.bind(this)
            })
    }

    createEdgeFromRow(data){
        var id = data.identity.low
        var type = data.type
        var source = data.start.low
        var target = data.end.low
        var edge = {
            id: id,
            type: type,
            source: source,
            target:target,
            label: type
        }

        return edge
    }

    createNodeFromRow(data, params){
        var id = data.identity.low
        var type = data.labels[0]
        var label = data.properties.name
        var node = {
            id: id,
            type: type,
            label: label,
            glyphs: [],
            folded: {
                nodes: [],
                edges: []
            },
            x: Math.random(),
            y: Math.random()
        }

        if (label === params.start){
            node.start = true
            node.glyphs.push({
                'position': 'bottom-right',
                'font': 'FontAwesome',
                'content': '\uF21D',
                'fillColor': '#3399FF',
                'fontScale': 1.5
            })
        }

        if (label === params.end){
            node.end = true
            node.glyphs.push({
                'position': 'bottom-right',
                'font': 'FontAwesome',
                'fillColor': '#990000',
                'content': '\uF05B',
                'fontScale': 1.5
            })
        }

        switch (type) {
            case "Group":
                node.type_group = true;
                break;
            case "User":
                node.type_user = true;
                break;
            case "Computer":
                node.type_computer = true;
                break;
            case "Domain":
                node.type_domain = true;
                break;
        }

        return node
    }

    unfoldEdgeNode(id){
        var sigmaInstance = this.state.sigmaInstance
        sigmaInstance.graph.read(sigmaInstance.graph.nodes(id).folded)
        this.state.design.deprecate()
        this.state.design.apply();
        this.relayout()
    }

    foldEdgeNode(id){
        var sigmaInstance = this.state.sigmaInstance
        $.each(sigmaInstance.graph.nodes(id).folded.nodes, function(index, node){
            sigmaInstance.graph.dropNode(node.id)
        })
        sigmaInstance.refresh()
        this.state.design.deprecate();
        this.state.design.apply();
        this.relayout();
    }

    ungroupNode(id){
        var sigmaInstance = this.state.sigmaInstance
        var node = sigmaInstance.graph.nodes(id)
        sigmaInstance.graph.dropNode(id);
        sigmaInstance.graph.read(node.folded)
        this.state.design.deprecate()
        sigmaInstance.refresh()
        this.state.design.apply()
        this.relayout();
    }

    doSearchQuery(payload, props){
        if (typeof props === 'undefined'){
            props = {}
        }
        this.doQueryNative({
            statement: payload,
            allowCollapse: true,
            props: props
        })
    }

    doPathQuery(start, end){
        var statement = "MATCH (n {name:{start}}), (m {name:{end}}), p=allShortestPaths((n)-[*]->(m)) RETURN p"
        var props = {start: start, end: end}
        this.doQueryNative({
            statement: statement,
            allowCollapse: true,
            props: props,
            start: start,
            end: end
        })
    }

    doGenericQuery(statement, props, start, end, allowCollapse=true){
        if (appStore.currentTooltip !== null) {
            appStore.currentTooltip.close();
        }

        if (typeof props === 'undefined'){
            props = {}
        }
        this.doQueryNative({
            statement: statement,
            allowCollapse: allowCollapse,
            start: start,
            end: end,
            props: props
        })
    }

    _nodeDragged(){
        this.setState({dragged:true})
    }

    _nodeClicked(n){
        if (!this.state.dragged){
            if (n.data.node.type_user){
                emitter.emit('userNodeClicked', n.data.node.label)
            }else if (n.data.node.type_group){
                emitter.emit('groupNodeClicked', n.data.node.label)
            }else if (n.data.node.type_computer && (n.data.node.label !== 'Grouped Computers')){
                emitter.emit('computerNodeClicked', n.data.node.label)
            }else if (n.data.node.type_domain){
                emitter.emit('domainNodeClicked', n.data.node.label)
            }
        }else{
            this.setState({dragged: false})
        }
    }

    initializeSigma(){
        var sigmaInstance, design;

        sigmaInstance = new sigma(
            {
                container: 'graph'
            }
        )

        sigmaInstance.settings(
            {
                edgeColor: 'default',
                nodeColor: 'default',
                minEdgeSize: 1,
                maxEdgeSize: 2.5,
                iconThreshold: 4,
                labelThreshold: 15,
                labelAlignment: 'bottom',
                labelColor: 'default',
                font: 'Roboto',
                glyphFillColor: 'black',
                glyphTextColor: 'white',
                glyphTextThreshold: 1,
                zoomingRatio: 1.4,
                scalingMode: 'inside'
            }
        )

        //Bind sigma events
        sigmaInstance.renderers[0].bind('render', function(e) {
            sigmaInstance.renderers[0].glyphs();
        });

        sigmaInstance.camera.bind('coordinatesUpdated', function(e){
            if (e.target.ratio > 1.25){
                sigmaInstance.settings('drawEdgeLabels', false);
            }else{
                sigmaInstance.settings('drawEdgeLabels', true);
            }
        })

        sigmaInstance.bind('clickNode', this._nodeClicked.bind(this))

        sigmaInstance.bind('hovers', function(e){
            if (e.data.enter.nodes.length > 0) {
                if (appStore.endNode !== null) {
                    findGraphPath(this.state.sigmaInstance, false, e.data.enter.nodes[0].id)
                }

                if (appStore.startNode !== null) {
                    findGraphPath(this.state.sigmaInstance, true, e.data.enter.nodes[0].id)
                }

                sigmaInstance.refresh({'skipIndexation': true})
            }

            if (e.data.leave.nodes.length > 0) {
                if (appStore.highlightedEdges.length > 0) {
                    $.each(appStore.highlightedEdges, function(index, edge) {
                        edge.color = sigmaInstance.settings.defaultEdgeColor;
                    });
                    appStore.highlightedEdges = [];
                    sigmaInstance.refresh({ 'skipIndexation': true });
                }
            }
        }.bind(this))

        //Some key binds
        $(window).on('keyup', function(e){
            var key = e.keyCode ? e.keyCode : e.which
            var mode = appStore.performance.nodeLabels
            var sigmaInstance = this.state.sigmaInstance

            if (document.activeElement === document.body && key === 17){
                mode = mode + 1;
                if (mode > 2){
                    mode = 0;
                }
                appStore.performance.nodeLabels = mode;
                conf.set('performance', appStore.performance)

                if (mode === 0){
                    sigmaInstance.settings('labelThreshold', 500);
                    emitter.emit('showAlert', 'Hiding Node Labels')
                }else if (mode === 1){
                    sigmaInstance.settings('labelThreshold', 15);
                    emitter.emit('showAlert', 'Default Node Label Threshold')
                }else{
                    sigmaInstance.settings('labelThreshold', 1);
                    emitter.emit('showAlert', 'Always Showing Node Labels')
                }

                sigmaInstance.refresh({'skipIndexation' : true})
            }
        }.bind(this))

        //Plugin Configuration
        var dragListener = sigma.plugins.dragNodes(sigmaInstance,
                                sigmaInstance.renderers[0])

        dragListener.bind('drag', this._nodeDragged.bind(this))

        var tooltips = sigma.plugins.tooltips(
        sigmaInstance,
        sigmaInstance.renderers[0], 
            {
                node: [{
                    show: 'rightClickNode',
                    cssClass: 'new-tooltip',
                    autoadjust: true,
                    renderer: function(node) {
                        var template = this.state.template;
                        node.expand = false;
                        node.collapse = false;
                        if (node.folded.nodes.length > 0 && !node.groupedNode) {
                            if (typeof this.state.sigmaInstance.graph.nodes(node.folded.nodes[0].id) == 'undefined') {
                                node.expand = true;
                            } else {
                                node.collapse = true;
                            }
                        }
                        return Mustache.render(template, node);
                    }.bind(this)
                }]
            }
        );

        tooltips.bind('shown', function(event) {
            appStore.currentTooltip = event.target;
        });

        tooltips.bind('hidden', function(event) {
            appStore.currentTooltip = null;
        });
        

        //Layout Plugins
        var forcelinkListener = sigma.layouts.configForceLink(sigmaInstance, {
            worker: true,
            background: true,
            easing: 'cubicInOut',
            autoStop: true,
            alignNodeSiblings: true,
            barnesHutOptimize: true,
            randomize: 'globally'
        });

        forcelinkListener.bind('stop', function(event) {
            emitter.emit('updateLoadingText', "Fixing Overlap");
            sigmaInstance.startNoverlap();
        })

        forcelinkListener.bind('start', function(event){
            emitter.emit('updateLoadingText', 'Initial Layout')
            emitter.emit('showLoadingIndicator', true)
        })

        var dagreListener = sigma.layouts.dagre.configure(sigmaInstance, {
            easing: 'cubicInOut',
            boundingBox: {minX: 0, minY: 0, maxX:$('#graph').outerWidth(), maxY:$('#graph').outerHeight() },
            background: true,
            rankDir: 'LR'
        });

        dagreListener.bind('stop', function(event){
            var needsfix = false;
            sigmaInstance.graph.nodes().forEach(function(node) {
                if (isNaN(node.x) || isNaN(node.y)){
                    emitter.emit('updateLoadingText', "Fixing Overlap");
                    sigmaInstance.startNoverlap();
                    needsfix = true;
                    return
                }
            }, this);
            if (!needsfix){
                emitter.emit('updateLoadingText', 'Done!');
                sigma.canvas.edges.autoCurve(sigmaInstance)
                setTimeout(function(){
                    emitter.emit('showLoadingIndicator', false);    
                }, 1500)
            }
        })

        dagreListener.bind('start', function(event){
            emitter.emit('updateLoadingText', 'Initial Layout')
            emitter.emit('showLoadingIndicator', true)
        })

        // var noverlapListener = sigmaInstance.configNoverlap({
        //     nodeMargin: 5.0,
        //     easing: 'cubicInOut',
        //     gridSize: 20,
        //     permittedExpansion: 1.3 
        // });
        // 
        
        var noverlapListener = sigmaInstance.configNoverlap({})

        noverlapListener.bind('stop', function(event) {
            emitter.emit('updateLoadingText', 'Done!');
            sigma.canvas.edges.autoCurve(sigmaInstance)
            setTimeout(function(){
                emitter.emit('showLoadingIndicator', false);
            }, 1500)
            
        });

        
        var lowgfx = appStore.performance.lowGraphics

        design = sigma.plugins.design(sigmaInstance);
        if (lowgfx){
            sigmaInstance.settings('defaultEdgeType', 'line');
            sigmaInstance.settings('defaultEdgeColor', 'black');
            design.setPalette(appStore.lowResPalette);
            design.setStyles(appStore.lowResStyle);
        }else{
            sigmaInstance.settings('defaultEdgeType', 'tapered');
            sigmaInstance.settings('defaultEdgeColor', '#356');
            design.setPalette(appStore.highResPalette);
            design.setStyles(appStore.highResStyle);
        }

        var mode = appStore.performance.nodeLabels

        if (mode === 0){
            sigmaInstance.settings('labelThreshold', 500);
        }else if (mode === 1){
            sigmaInstance.settings('labelThreshold', 15);
        }else{
            sigmaInstance.settings('labelThreshold', 1);
        }

        this.state.sigmaInstance = sigmaInstance;
        this.state.design = design;
    }
}
