import React, { Component } from 'react';
import  { collapseEdgeNodes, setNodeData, collapseSiblingNodes } from 'utils';

export default class GraphContainer extends Component {
    constructor(props){
        super(props)

        this.state = {
            sigmaInstance : null,
            design: null,
            dragged: false
        }
    }

    render() {
        return (
            <div id="graph" className="graph"></div>
        );
    }

    doQueryNative(params){
        sigma.neo4j.cypher({
            url: appStore.databaseInfo.url,
            user: appStore.databaseInfo.user,
            password: appStore.databaseInfo.password
        },
        params.statement,
        this.state.sigmaInstance,
        function(sigmaInstance){
            var design = this.state.design;
            sigmaInstance = setNodeData(this.state.sigmaInstance);
            if (params.allowCollapse){
                sigmaInstance = collapseEdgeNodes(sigmaInstance);
                sigmaInstance = collapseSiblingNodes(sigmaInstance);
            }
            this.state.sigmaInstance = sigmaInstance
            design.deprecate();
            design.apply();
            sigmaInstance.refresh();
            this.state.design = design;
            sigma.misc.animation.camera(sigmaInstance.camera, { x: 0, y: 0, ratio: 1.075 });
            sigma.layouts.startForceLink()
        }.bind(this))
    }

    doQueryEvent(){
        this.doQueryNative({
            statement: 'MATCH (n:Group) WHERE n.name =~ "(?i).*DOMAIN ADMINS.*" WITH n MATCH (n)<-[r:MemberOf]-(m) RETURN n,r,m',
            allowCollapse: false
        })
    }

    _nodeDragged(){
        this.setState({dragged:true})
    }

    _nodeClicked(n){
        if (!this.state.dragged){
            if (n.data.node.type_user){
                emitter.emit('userNodeClicked', n.data.node.label)  
            }
        }else{
            this.setState({dragged: false})
        }
    }

    componentWillMount() {
        emitter.on('query', this.doQueryEvent.bind(this))
    }

    componentDidMount() {
        //Sigma Initialization
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

        var noverlapListener = sigmaInstance.configNoverlap({ nodeMargin: 20.0, easing: 'cubicInOut', gridSize: 20, permittedExpansion: 1.3 });
        noverlapListener.bind('stop', function(event) {

        });

        var dragListener = sigma.plugins.dragNodes(sigmaInstance, 
                                sigmaInstance.renderers[0])

        dragListener.bind('drag', this._nodeDragged.bind(this))

        sigmaInstance.bind('clickNode', this._nodeClicked.bind(this))

        var fa = sigma.layouts.configForceLink(sigmaInstance, {
            worker: true,
            background: true,
            easing: 'cubicInOut',
            autoStop: true,
            alignNodeSiblings: true,
            barnesHutOptimize: true
        });

        fa.bind('stop', function(event) {
            sigmaInstance.startNoverlap();
        })

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
        this.doQueryNative({
            statement: 'MATCH (n:Group) WHERE n.name =~ "(?i).*DOMAIN ADMINS.*" WITH n MATCH (n)<-[r:MemberOf]-(m) RETURN n,r,m',
            allowCollapse: false
        })
    }
}