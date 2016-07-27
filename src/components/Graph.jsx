import React, { Component } from 'react';
import  { collapseEdgeNodes, setNodeData, collapseSiblingNodes, findGraphPath } from 'utils';

export default class GraphContainer extends Component {
    constructor(props){
        super(props)

        this.state = {
            sigmaInstance : null,
            design: null,
            dragged: false,
            firstDraw: true
        }
    }

    render() {
        return (
            <div id="graph" className="graph"></div>
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
            this.state.sigmaInstance.refresh();
            appStore.spotlightData = query.spotlight;
        }
    }

    doQueryNative(params){
        if (!this.state.firstDraw){
            appStore.queryStack.push({
                nodes: this.state.sigmaInstance.graph.nodes(),
                edges: this.state.sigmaInstance.graph.edges(),
                spotlight: appStore.spotlightData
            })
        }

        emitter.emit('showLoadingIndicator', true);
        emitter.emit('updateLoadingText', "Querying Database")

        sigma.neo4j.cypher({
            url: appStore.databaseInfo.url,
            user: appStore.databaseInfo.user,
            password: appStore.databaseInfo.password
        },
        params.statement,
        this.state.sigmaInstance,
        function(sigmaInstance){
            if (sigmaInstance.graph.nodes().length === 0){
                console.log('no nodes');
                this.goBack()
                return;
            }
            appStore.spotlightData = {}
            var design = this.state.design;
            sigmaInstance = setNodeData(this.state.sigmaInstance, params.start, params.end);
            if (params.allowCollapse){
                sigmaInstance = collapseEdgeNodes(sigmaInstance);
                sigmaInstance = collapseSiblingNodes(sigmaInstance);
            }

            $.each(sigmaInstance.graph.nodes(), function(index, node) {
                if (!appStore.spotlightData.hasOwnProperty(node.id)) {
                    appStore.spotlightData[node.id] = [node.neo4j_data.name, 0, ""];
                }
            });
            this.state.sigmaInstance = sigmaInstance
            design.deprecate();
            sigmaInstance.refresh();
            design.apply();
            this.state.design = design;
            sigma.misc.animation.camera(sigmaInstance.camera, { x: 0, y: 0, ratio: 1.075 });
            sigma.layouts.startForceLink()
            emitter.emit('updateLoadingText', 'Initial Layout')
        }.bind(this))
        if (this.state.firstDraw){
            setTimeout(function(){
                this.state.sigmaInstance.refresh({skipIndexation: true})
            }.bind(this), 500)
            this.setState({firstDraw: false})
        }
    }

    doSearchQuery(payload){
        this.doQueryNative({
            statement: payload,
            allowCollapse: true
        })
    }

    doPathQuery(start, end){
        var statement = "MATCH (n {name:'{}'}), (m {name:'{}'}), p=allShortestPaths((n)-[*]->(m)) RETURN p".format(start,end)
        this.doQueryNative({
            statement: statement,
            allowCollapse: true,
            start: start,
            end: end
        })
    }

    doGenericQuery(statement, start, end, allowCollapse=true){
        this.doQueryNative({
            statement: statement,
            allowCollapse: allowCollapse,
            start: start,
            end: end
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
            }else if (n.data.node.type_computer){
                emitter.emit('computerNodeClicked', n.data.node.label)
            }
        }else{
            this.setState({dragged: false})
        }
    }

    initializeSigma(){
        var sigmaInstance, design;
        sigma.renderers.def = sigma.renderers.canvas;

        sigma.classes.graph.addMethod('outboundNodes', function(id) {
            return this.outNeighborsIndex.get(id).keyList();
        });

        sigma.classes.graph.addMethod('inboundNodes', function(id) {
            return this.inNeighborsIndex.get(id).keyList();
        });

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
                zoomingRatio: 1.4
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

            if (document.activeElement === document.body){

            }
        }.bind(this))

        //Plugin Configuration
        var dragListener = sigma.plugins.dragNodes(sigmaInstance,
                                sigmaInstance.renderers[0])

        dragListener.bind('drag', this._nodeDragged.bind(this))
        

        //Layout Plugins
        var forcelinkListener = sigma.layouts.configForceLink(sigmaInstance, {
            worker: true,
            background: true,
            easing: 'cubicInOut',
            autoStop: true,
            alignNodeSiblings: true,
            barnesHutOptimize: true
        });

        forcelinkListener.bind('stop', function(event) {
            emitter.emit('updateLoadingText', "Fixing Overlap");
            sigmaInstance.startNoverlap();
        })

        var dagreListener = sigma.layouts.dagre.configure(sigmaInstance, {
            easing: 'cubicInOut',
            boundingBox: true,
            background: true
        });

        dagreListener.bind('stop', function(event){
            emitter.emit('updateLoadingText', "Fixing Overlap");
            sigmaInstance.startNoverlap();
        })

        var noverlapListener = sigmaInstance.configNoverlap({
            nodeMargin: 20.0,
            easing: 'cubicInOut',
            gridSize: 20,
            permittedExpansion: 1.3 
        });
        noverlapListener.bind('stop', function(event) {
            emitter.emit('updateLoadingText', 'Done!');
            setTimeout(function(){
                emitter.emit('showLoadingIndicator', false);    
            }, 3000)
            
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

        this.state.sigmaInstance = sigmaInstance;
        this.state.design = design;
    }

    componentWillMount() {
        emitter.on('searchQuery', this.doSearchQuery.bind(this));
        emitter.on('pathQuery', this.doPathQuery.bind(this));
        emitter.on('graphBack', this.goBack.bind(this));
        emitter.on('query', this.doGenericQuery.bind(this));
    }

    componentDidMount() {
        this.initializeSigma();
            
        this.doQueryNative({
            statement: 'MATCH (n:Group) WHERE n.name =~ "(?i).*DOMAIN ADMINS.*" WITH n MATCH (n)<-[r:MemberOf]-(m) RETURN n,r,m',
            allowCollapse: false
        })
    }
}