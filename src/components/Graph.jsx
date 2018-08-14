import React, { Component } from "react";
import { findGraphPath, generateUniqueId } from "utils";
import { writeFile, readFile } from "fs";
import { fork } from "child_process";
var child;
import { join } from "path";
import { remote } from "electron";
const { dialog } = remote;
const uuidv4 = require('uuid/v4');
var observer = require('fontfaceobserver');

export default class GraphContainer extends Component {
    constructor(props) {
        super(props);

        child = fork(
            join(__dirname, "src", "js", "worker.js"),
            { silent: true }
        );

        this.state = {
            sigmaInstance: null,
            design: null,
            dragged: false,
            firstDraw: true,
            nodeTemplate: null,
            edgeTemplate: null,
            session: driver.session(),
            darkMode: false
        };

        $.ajax({
            url: "src/components/nodeTooltip.html",
            type: "GET",
            success: function(response) {
                this.setState({ nodeTemplate: response });
            }.bind(this)
        });

        $.ajax({
            url: "src/components/edgeTooltip.html",
            type: "GET",
            success: function(response) {
                this.setState({ edgeTemplate: response });
            }.bind(this)
        });

        $.ajax({
            url: "src/components/stageTooltip.html",
            type: "GET",
            success: function(response) {
                this.setState({ stageTemplate: response });
            }.bind(this)
        });

        child.stdout.on("data", data => {
            console.log(`stdout: ${data}`);
        });

        child.stderr.on("data", data => {
            console.log(`error: ${data}`);
        });

        child.on(
            "message",
            function(m) {
                this.loadFromChildProcess(m);
            }.bind(this)
        );

        this.setConstraints();

        emitter.on(
            "doLogout",
            function() {
                this.state.sigmaInstance.graph.clear();
                this.state.sigmaInstance.refresh();
                sigma.layouts.killForceLink();
                this.setState({ sigmaInstance: null });
                child.kill();
            }.bind(this)
        );
    }

    componentWillMount() {
        emitter.on("searchQuery", this.doSearchQuery.bind(this));
        emitter.on("graphBack", this.goBack.bind(this));
        emitter.on("query", this.doGenericQuery.bind(this));
        emitter.on("spotlightClick", this.spotlightClickHandler.bind(this));
        emitter.on("graphRefresh", this.relayout.bind(this));
        emitter.on("graphReload", this.reload.bind(this));
        emitter.on("export", this.export.bind(this));
        emitter.on("import", this.import.bind(this));
        emitter.on("clearDB", this.clearGraph.bind(this));
        emitter.on("changeGraphicsMode", this.setGraphicsMode.bind(this));
        emitter.on("ungroupNode", this.ungroupNode.bind(this));
        emitter.on("unfoldNode", this.unfoldEdgeNode.bind(this));
        emitter.on("collapseNode", this.foldEdgeNode.bind(this));
        emitter.on("resetZoom", this.resetZoom.bind(this));
        emitter.on("zoomIn", this.zoomIn.bind(this));
        emitter.on("zoomOut", this.zoomOut.bind(this));
        emitter.on("changeNodeLabels", this.changeNodeLabelMode.bind(this));
        emitter.on("changeEdgeLabels", this.changeEdgeLabelMode.bind(this));
        emitter.on("deleteEdgeConfirm", this.deleteEdge.bind(this));
        emitter.on("deleteNodeConfirm", this.deleteNode.bind(this));
        emitter.on("changeLayout", this.changeLayout.bind(this));
        emitter.on("addNodeFinal", this.addNode.bind(this));
        emitter.on("setOwned", this.setOwned.bind(this));
        emitter.on("setHighVal", this.setHighVal.bind(this))
        emitter.on("getHelp", this.getHelpEdge.bind(this))
        emitter.on("toggleDarkMode", this.toggleDarkMode.bind(this));
    }

    componentDidMount() {
        var font = new observer("Font Awesome 5 Free");
        font.load().then(x => {
            this.inita();
        });
    }

    toggleDarkMode(enabled){
        this.setState({darkMode: enabled});

        if (enabled){
            this.state.sigmaInstance.settings("defaultEdgeColor", "white");
            this.state.sigmaInstance.settings("defaultLabelColor", "white");
            this.state.sigmaInstance.settings("defaultEdgeLabelColor", "white");
            this.state.sigmaInstance.settings("defaultEdgeHoverLabelBGColor", "black");
            //this.state.sigmaInstance.settings("defaultNodeColor", "white");
        }else{
            this.state.sigmaInstance.settings("defaultEdgeColor", "#356");
            this.state.sigmaInstance.settings("defaultLabelColor", "black");
            this.state.sigmaInstance.settings("defaultEdgeLabelColor", "black");
            this.state.sigmaInstance.settings("defaultEdgeHoverLabelBGColor", "white");
            //this.state.sigmaInstance.settings("defaultNodeColor", "black");
        }

        this.state.sigmaInstance.refresh({skipIndexation: true});
    }

    async setConstraints() {
        let s = driver.session();
        await s.run("CREATE CONSTRAINT ON (c:User) ASSERT c.name IS UNIQUE");
        await s.run("CREATE CONSTRAINT ON (c:Group) ASSERT c.name IS UNIQUE");
        await s.run("CREATE CONSTRAINT ON (c:Computer) ASSERT c.name IS UNIQUE");
        await s.run("CREATE CONSTRAINT ON (c:GPO) ASSERT c.name IS UNIQUE");
        await s.run("CREATE CONSTRAINT ON (c:Domain) ASSERT c.name IS UNIQUE");
        await s.run("CREATE CONSTRAINT ON (c:OU) ASSERT c.guid IS UNIQUE");

        s.close();
    }

    inita(){
        this.initializeSigma();
        this.toggleDarkMode(appStore.performance.darkMode);
        this.doQueryNative({
            statement:'MATCH (n:Group) WHERE n.objectsid =~ "(?i)S-1-5.*-512" WITH n MATCH (n)<-[r:MemberOf*1..]-(m) RETURN n,r,m',
            //statement: 'MATCH (n)-[r:AdminTo]->(m) RETURN n,r,m LIMIT 5',
            //statement: 'MATCH p=(n:Domain)-[r]-(m:Domain) RETURN p',
            allowCollapse: false,
            props: {}
        });
    }

    getHelpEdge(id){
        closeTooltip();
        let instance = this.state.sigmaInstance.graph;
        let edge = instance.edges(id);
        let source = instance.nodes(edge.source);
        let target = instance.nodes(edge.target);
        emitter.emit("displayHelp", edge, source, target);
    }

    setOwned(id, status){
        closeTooltip();
        let instance = this.state.sigmaInstance;
        let node = instance.graph.nodes(id);
        if (status){
            node.owned = true;
            node.notowned = false;
            node.glyphs.push({
                position: "top-left",
                font: '"Font Awesome 5 Free"',
                content: "\uf54c",
                fillColor: "black",
                fontScale: 2.0,
                fontStyle: "900"
            })
        }else{
            let newglyphs = [];
            $.each(node.glyphs, (_, glyph) => {
                if (glyph.position !== "top-left"){
                    newglyphs.push(glyph)
                }
            })
            node.glyphs = newglyphs;
            node.notowned = true;
            node.owned = false;
        }

        instance.renderers[0].glyphs();
        instance.refresh();

        let q = driver.session();
        q.run(`MATCH (n:${node.type} {name:{node}}) SET n.owned={status}`, {node: node.label, status: status}).then(x => {
            q.close();
        })
    }

    setHighVal(id, status){
        closeTooltip();
        let instance = this.state.sigmaInstance;
        let node = instance.graph.nodes(id);
        node.highvalue = status;
        if (status){
            node.glyphs.push({
                position: "top-right",
                font: '"Font Awesome 5 Free"',
                content: "\uf3a5",
                fillColor: "black",
                fontScale: 1.5,
                fontStyle: "900"
            })
        }else{
            let newglyphs = [];
            $.each(node.glyphs, (_, glyph) => {
                if (glyph.position !== "top-right"){
                    newglyphs.push(glyph)
                }
            })
            node.glyphs = newglyphs;
        }

        let key = node.type === "OU" ? "guid" : "name";
        let keyVal = node.type === "OU" ? node.guid : node.label;
        instance.renderers[0].glyphs();
        instance.refresh();

        let q = driver.session();
        
        q.run(`MATCH (n:${node.type} {${key}:{node}}) SET n.highvalue={status}`, {node: keyVal, status: status}).then(x => {
            q.close();
        })
    }

    addNode(name, type){
        let q = driver.session();
        let guid = uuidv4();

        let key = type === "OU" ? "guid" : "name";
        let varn = type === "OU" ? guid : name;
        let typevar = `type_${type.toLowerCase()}`;

        let statement = `MERGE (n:${type} {${key}:{name}})`
        q.run(statement, {name:varn}).then(x => {
            let instance = this.state.sigmaInstance;
            let id = generateUniqueId(instance, true);
            let node = {
                id: id,
                label: varn,
                type: type,
                x: this.state.tooltipPos.x,
                y: this.state.tooltipPos.y,
                folded:{
                    nodes: [],
                    edges: []
                },
                groupedNode: false,
                degree: 1
            }
            node[typevar] = true;
            instance.graph.addNode(node);
            this.applyDesign()
            q.close();
        })
    }

    relayout() {
        closeTooltip();
        sigma.layouts.stopForceLink();
        if (appStore.dagre) {
            sigma.layouts.dagre.start(this.state.sigmaInstance);
        } else {
            sigma.layouts.startForceLink();
        }
    }

    changeLayout(){
        appStore.dagre = !appStore.dagre;
        var type = appStore.dagre ? "Hierarchical" : "Directed";
        emitter.emit("showAlert", "Changed Layout to " + type);
        this.relayout();
    }

    deleteNode(id){
        let instance = this.state.sigmaInstance;
        let node = instance.graph.nodes(id);
        let type = node.type;
        let key = type === "OU" ? 'guid' : 'name';
        let val = type === "OU" ? node.guid : node.label;

        let statement = "MATCH (n:{} {{}:{key}}) DETACH DELETE n".format(type, key);

        instance.graph.dropNode(node.id);
        instance.refresh()

        let q = driver.session();
        q.run(statement, {key:val}).then(x => {q.close()});
        
    }

    deleteEdge(id){
        let instance = this.state.sigmaInstance;
        let edge = instance.graph.edges(id);
        let sourcenode = instance.graph.nodes(edge.source);
        let targetnode = instance.graph.nodes(edge.target);

        let sourcekey = sourcenode.type === "OU" ? 'guid' : 'name';
        let targetkey = targetnode.type === "OU" ? 'guid' : 'name';
        
        let statement = "MATCH (n:{} {{}:{sname}}) MATCH (m:{} {{}:{tname}}) MATCH (n)-[r:{}]->(m) DELETE r".format(sourcenode.type, sourcekey, targetnode.type, targetkey, edge.label);

        instance.graph.dropEdge(edge.id);
        instance.refresh();

        let q = driver.session();
        q.run(statement, {sname: sourcenode.label, tname: targetnode.label}).then(x => {q.close()})
        
    }

    reload(){
        closeTooltip();
        this.doQueryNative(this.state.currentQuery);
    }

    export(payload) {
        if (payload === "image") {
            let size = $("#graph").outerWidth();
            sigma.plugins.image(
                this.state.sigmaInstance,
                this.state.sigmaInstance.renderers[0],
                {
                    download: true,
                    size: size,
                    background: "lightgray",
                    clip: true
                }
            );
        } else {
            let json = this.state.sigmaInstance.toJSON({
                pretty: true
            });

            json = JSON.parse(json);
            json.spotlight = appStore.spotlightData;

            dialog.showSaveDialog(
                {
                    defaultPath: "graph.json"
                },
                function(loc) {
                    writeFile(loc, JSON.stringify(json, null, 2));
                }
            );
        }
    }

    changeNodeLabelMode() {
        let mode = appStore.performance.nodeLabels;
        let instance = this.state.sigmaInstance;
        if (mode === 0) {
            instance.settings("labelThreshold", 15);
        } else if (mode === 1) {
            instance.settings("labelThreshold", 1);
        } else {
            instance.settings("labelThreshold", 500);
        }
        instance.refresh({ skipIndexation: true });
        this.setState({
            sigmaInstance: instance
        });
    }

    changeEdgeLabelMode() {
        let instance = this.state.sigmaInstance;
        let x = instance.camera.x;
        let y = instance.camera.y;
        let ratio = instance.camera.ratio;
        let angle = instance.camera.angle;
        instance.camera.goTo({ x: x, y: y, ratio: ratio, angle: angle });
        instance.refresh({ skipIndexation: true });
        this.setState({
            sigmaInstance: instance
        });
    }

    loadFromChildProcess(graph) {
        if (graph.nodes.length === 0) {
            emitter.emit("showAlert", "No data returned from query");
            emitter.emit("updateLoadingText", "Done!");
            setTimeout(function() {
                emitter.emit("showLoadingIndicator", false);
            }, 1500);
        } else {
            if (!this.state.firstDraw) {
                appStore.queryStack.push({
                    nodes: this.state.sigmaInstance.graph.nodes(),
                    edges: this.state.sigmaInstance.graph.edges(),
                    spotlight: appStore.spotlightData,
                    startNode: appStore.startNode,
                    endNode: appStore.endNode,
                    params: this.state.currentQuery
                });
            }
            $.each(graph.nodes, function(i, node) {
                if (node.start) {
                    appStore.startNode = node;
                }

                if (node.end) {
                    appStore.endNode = node;
                }

                node.glyphs = $.map(node.glyphs, function(value, index) {
                    return [value];
                });
            });

            this.setState({ firstDraw: false });
            sigma.misc.animation.camera(this.state.sigmaInstance.camera, {
                x: 0,
                y: 0,
                ratio: 1.075
            });

            appStore.spotlightData = graph.spotlight;
            this.state.sigmaInstance.graph.clear();
            this.state.sigmaInstance.graph.read(graph);
            this.applyDesign();

            if (appStore.dagre) {
                sigma.layouts.dagre.start(this.state.sigmaInstance);
            } else {
                sigma.layouts.startForceLink();
            }
            emitter.emit("spotlightUpdate");
        }
    }

    import(payload) {
        readFile(
            payload,
            "utf8",
            function(err, data) {
                var graph;
                try {
                    graph = JSON.parse(data);
                } catch (err) {
                    emitter.emit("showAlert", "Bad JSON File");
                    return;
                }

                if (graph.nodes.length === 0) {
                    emitter.emit("showAlert", "No data returned from query");
                } else {
                    $.each(graph.nodes, function(i, node) {
                        node.glyphs = $.map(node.glyphs, function(
                            value,
                            index
                        ) {
                            return [value];
                        });
                    });
                    appStore.queryStack.push({
                        nodes: this.state.sigmaInstance.graph.nodes(),
                        edges: this.state.sigmaInstance.graph.edges(),
                        spotlight: appStore.spotlightData,
                        startNode: appStore.startNode,
                        endNode: appStore.endNode,
                        params: this.state.currentQuery
                    });

                    appStore.spotlightData = graph.spotlight;
                    this.state.sigmaInstance.graph.clear();
                    this.state.sigmaInstance.graph.read(graph);
                    this.state.sigmaInstance.refresh();
                    emitter.emit("spotlightUpdate");
                }
            }.bind(this)
        );
    }

    clearGraph() {
        this.state.sigmaInstance.graph.clear();
        this.state.sigmaInstance.refresh();
    }

    applyDesign() {
        this.state.design.deprecate();
        this.state.sigmaInstance.refresh();
        this.state.design.apply();

        $.each(this.state.sigmaInstance.graph.edges(), function(index, edge) {
            if (edge.hasOwnProperty("enforced")) {
                if (edge.enforced === false) {
                    edge.type = "dashed";
                }
            }
        });

        $.each(
            this.state.sigmaInstance.graph.nodes(),
            function(_, node) {
                if (node.hasOwnProperty("blocksinheritance")) {
                    if (node.blocksinheritance === true) {
                        let targets = [];
                        $.each(
                            this.state.sigmaInstance.graph.outNeighbors(
                                node.id
                            ),
                            function(_, nodeid) {
                                targets.push(parseInt(nodeid));
                            }.bind(this)
                        );

                        $.each(
                            this.state.sigmaInstance.graph.adjacentEdges(
                                node.id
                            ),
                            function(_, edge) {
                                if (targets.includes(edge.target)) {
                                    edge.type = "dotted";
                                }
                            }
                        );
                    }
                }
            }.bind(this)
        );
    }

    setGraphicsMode() {
        var lowgfx = appStore.performance.lowGraphics;
        var sigmaInstance = this.state.sigmaInstance;
        this.state.design.clear();
        if (lowgfx) {
            sigmaInstance.settings("defaultEdgeType", "line");
            sigmaInstance.settings("defaultEdgeColor", "black");
            this.state.design.setPalette(appStore.lowResPalette);
            this.state.design.setStyles(appStore.lowResStyle);
        } else {
            sigmaInstance.settings("defaultEdgeType", "tapered");
            sigmaInstance.settings("defaultEdgeColor", "#356");
            this.state.design.setPalette(appStore.highResPalette);
            this.state.design.setStyles(appStore.highResStyle);
        }
        this.applyDesign();
    }

    resetZoom() {
        sigma.misc.animation.camera(this.state.sigmaInstance.camera, {
            x: 0,
            y: 0,
            ratio: 1.075
        });
    }

    zoomOut() {
        var sigmaInstance = this.state.sigmaInstance;
        var cam = sigmaInstance.camera;

        sigma.misc.animation.camera(
            cam,
            {
                ratio: cam.ratio * cam.settings("zoomingRatio")
            },
            {
                duration: sigmaInstance.settings("animationsTime")
            }
        );
    }

    zoomIn() {
        var sigmaInstance = this.state.sigmaInstance;
        var cam = sigmaInstance.camera;

        sigma.misc.animation.camera(
            cam,
            {
                ratio: cam.ratio / cam.settings("zoomingRatio")
            },
            {
                duration: sigmaInstance.settings("animationsTime")
            }
        );
    }

    render() {
        return (
            <div className="graph">
                <div id="graph" className={this.state.darkMode ? "graph graph-dark" : "graph graph-light"} />
            </div>
        );
    }

    goBack() {
        if (appStore.queryStack.length > 0) {
            this.clearScale();
            closeTooltip();
            sigma.layouts.stopForceLink();

            let query = appStore.queryStack.pop();
            this.state.sigmaInstance.graph.clear();
            this.state.sigmaInstance.graph.read({
                nodes: query.nodes,
                edges: query.edges
            });
            this.setState({currentQuery: query.params})
            this.applyDesign();
            this.lockScale();
            appStore.spotlightData = query.spotlight;
            (appStore.startNode = query.startNode),
                (appStore.endNode = query.endNode);
            emitter.emit("spotlightUpdate");
        }
    }

    spotlightClickHandler(nodeId, parentId) {
        let sigmaInstance = this.state.sigmaInstance;
        let parent = sigmaInstance.graph.nodes(nodeId);
        let label, child;
        if (typeof parent === "undefined") {
            child = sigmaInstance.graph
                .nodes(parentId)
                .folded.nodes.filter(function(val) {
                    return val.id === nodeId;
                })[0];
            parent = sigmaInstance.graph.nodes(parentId);
        } else {
            child = parent;
        }
        label = child.label;
        if (child.type_user) {
            emitter.emit("userNodeClicked", label);
        } else if (child.type_group) {
            emitter.emit("groupNodeClicked", label);
        } else if (child.type_computer) {
            emitter.emit("computerNodeClicked", label);
        }
        parent.color = "#2DC486";
        sigma.misc.animation.camera(
            sigmaInstance.camera,
            {
                x: parent[sigmaInstance.camera.readPrefix + "x"],
                y: parent[sigmaInstance.camera.readPrefix + "y"],
                ratio: 0.5
            },
            { duration: sigmaInstance.settings("animationsTime") }
        );

        setTimeout(function() {
            parent.color = "black";
            sigmaInstance.refresh({ skipIndexation: true });
        }, 2000);
    }

    doQueryNative(params) {
        this.clearScale();
        if (appStore.performance.debug) {
            emitter.emit("setRawQuery", params.statement);
        }
        let nodes = {};
        let edges = {};
        let session = driver.session();
        if (typeof params.props === "undefined") {
            params.props = {};
        }
        emitter.emit("showLoadingIndicator", true);
        emitter.emit("updateLoadingText", "Querying Database");
        emitter.emit("resetSpotlight");
        this.setState({"currentQuery": params})

        let edgearr = []
        let stat = appStore.edgeincluded;

        $.each(Object.keys(stat), function(_, key){
            if (stat[key]){
                edgearr.push(key);
            }
        })

        if (edgearr.length === 0){
            emitter.emit("showAlert", "Must specify at least one edge type!");
            emitter.emit("updateLoadingText", "Done!");
            setTimeout(function() {
                emitter.emit("showLoadingIndicator", false);
            }, 1500);
            return;
        }

        let finaledges = edgearr.join('|');
        let statement = params.statement.format(finaledges)
        let promises = [];
        session.run(statement, params.props).subscribe({
            onNext: async function(result) {
                $.each( 
                    result._fields,
                    function(_, field) {
                        if (field !== null) {
                            if (field.hasOwnProperty("segments")) {
                                $.each(
                                    field.segments,
                                    function(_, segment) {
                                        let end = this.createNodeFromRow(
                                            segment.end,
                                            params
                                        );
                                        let start = this.createNodeFromRow(
                                            segment.start,
                                            params
                                        );
                                        let edge = this.createEdgeFromRow(
                                            segment.relationship
                                        );

                                        if (!edges[edge.id]) {
                                            edges[edge.id] = edge;
                                        }

                                        if (!nodes[end.id]) {
                                            nodes[end.id] = end;
                                        }

                                        if (!nodes[start.id]) {
                                            nodes[start.id] = start;
                                        }
                                    }.bind(this)
                                );
                            } else {
                                if ($.isArray(field)) {
                                    $.each(
                                        field,
                                        function(_, value) {
                                            if (value !== null) {
                                                let id = value.identity.low;
                                                if (value.end && !edges.id) {
                                                    edges[
                                                        id
                                                    ] = this.createEdgeFromRow(
                                                        value
                                                    );
                                                } else if (!nodes.id) {
                                                    nodes[
                                                        id
                                                    ] = this.createNodeFromRow(
                                                        value,
                                                        params
                                                    );
                                                }
                                            }
                                        }.bind(this)
                                    );
                                } else {
                                    let id = field.identity.low;
                                    if (field.end && !edges.id) {
                                        edges[id] = this.createEdgeFromRow(
                                            field
                                        );
                                    } else if (!nodes.id) {
                                        nodes[id] = this.createNodeFromRow(
                                            field,
                                            params
                                        );
                                    }
                                }
                            }
                        }
                    }.bind(this)
                );
            }.bind(this),
            onError: function(error) {
                console.log(error);
            },
            onCompleted: function() {
                var graph = { nodes: [], edges: [] };
                $.each(nodes, function(node) {
                    graph.nodes.push(nodes[node]);
                });

                $.each(edges, function(edge) {
                    graph.edges.push(edges[edge]);
                });
                emitter.emit("updateLoadingText", "Processing Data");

                child.send(
                    JSON.stringify({
                        graph: graph,
                        edge: params.allowCollapse
                            ? appStore.performance.edge
                            : 0,
                        sibling: params.allowCollapse
                            ? appStore.performance.sibling
                            : 0,
                        start: params.start,
                        end: params.end
                    })
                );
                session.close();
            }.bind(this)
        });
    }

    createEdgeFromRow(data) {
        var id = data.identity.low;
        var type = data.type;
        var source = data.start.low;
        var target = data.end.low;

        var edge = {
            id: id,
            type: type,
            source: source,
            target: target,
            label: type
        };

        if (
            data.hasOwnProperty("properties") &&
            data.properties.hasOwnProperty("enforced")
        ) {
            edge.enforced = data.properties.enforced;
        }

        return edge;
    }

    createNodeFromRow(data, params) {
        var id = data.identity.low;
        var type = data.labels[0];
        var label = data.properties.name;
        var guid = data.properties.guid;

        if (label == null) {
            label = guid;
        }

        var node = {
            id: id,
            type: type,
            label: label,
            Enabled: data.properties.Enabled,
            glyphs: [],
            folded: {
                nodes: [],
                edges: []
            },
            x: Math.random(),
            y: Math.random()
        };

        if (data.hasOwnProperty("properties")) {
            if (data.properties.hasOwnProperty("blocksinheritance")) {
                node.blocksinheritance = data.properties.blocksinheritance;
            }

            if (data.properties.hasOwnProperty("guid")) {
                node.guid = data.properties.guid;
            }

            if (data.properties.hasOwnProperty("owned")){
                if (data.properties.owned){
                    node.owned = true;
                }else{
                    node.notowned = true;
                }
            }

            node.highvalue = data.properties.highvalue;
        }

        if (label === params.start) {
            node.start = true;
            node.glyphs.push({
                position: "bottom-right",
                font: '"Font Awesome 5 Free"',
                content: "\uF3C5",
                fillColor: "#3399FF",
                fontScale: 1.5,
                fontStyle: "900"
            });
        }

        if (label === params.end) {
            node.end = true;
            node.glyphs.push({
                position: "bottom-right",
                font: '"Font Awesome 5 Free"',
                fillColor: "#990000",
                content: "\uF140",
                fontScale: 1.5,
                fontStyle: "900"
            });
        }

        if (node.owned){
            node.glyphs.push({
                position: "top-left",
                font: '"Font Awesome 5 Free"',
                content: "\uf54c",
                fillColor: "black",
                fontScale: 2.0,
                fontStyle: "900"
            });
        }

        if (node.highvalue){
            node.glyphs.push({
                position: "top-right",
                font: '"Font Awesome 5 Free"',
                content: "\uf3a5",
                fillColor: "black",
                fontScale: 1.5,
                fontStyle: "900"
            });
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
            case "GPO":
                node.type_gpo = true;
                break;
            case "OU":
                node.type_ou = true;
                break;
        }

        return node;
    }

    unfoldEdgeNode(id) {
        var sigmaInstance = this.state.sigmaInstance;
        sigmaInstance.graph.read(sigmaInstance.graph.nodes(id).folded);
        this.state.design.deprecate();
        this.state.design.apply();
        this.relayout();
    }

    foldEdgeNode(id) {
        var sigmaInstance = this.state.sigmaInstance;
        $.each(sigmaInstance.graph.nodes(id).folded.nodes, function(
            _,
            node
        ) {
            sigmaInstance.graph.dropNode(node.id);
        });
        sigmaInstance.refresh();
        this.state.design.deprecate();
        this.state.design.apply();
        this.relayout();
    }

    ungroupNode(id) {
        var sigmaInstance = this.state.sigmaInstance;
        var node = sigmaInstance.graph.nodes(id);
        sigmaInstance.graph.dropNode(id);
        sigmaInstance.graph.read(node.folded);
        this.state.design.deprecate();
        sigmaInstance.refresh();
        this.state.design.apply();
        this.relayout();
    }

    doSearchQuery(payload, props) {
        if (typeof props === "undefined") {
            props = {};
        }
        this.doQueryNative({
            statement: payload,
            allowCollapse: true,
            props: props
        });
    }

    doGenericQuery(statement, props, start, end, allowCollapse = true) {
        closeTooltip()

        if (typeof props === "undefined") {
            props = {};
        }

        this.doQueryNative({
            statement: statement,
            allowCollapse: allowCollapse,
            start: start,
            end: end,
            props: props
        });
    }

    _nodeDragged() {
        this.setState({ dragged: true });
    }

    _nodeClicked(n) {
        if (!this.state.dragged) {
            if (n.data.node.type_user) {
                emitter.emit("userNodeClicked", n.data.node.label);
            } else if (n.data.node.type_group) {
                emitter.emit("groupNodeClicked", n.data.node.label);
            } else if (
                n.data.node.type_computer &&
                n.data.node.label !== "Grouped Computers"
            ) {
                emitter.emit("computerNodeClicked", n.data.node.label);
            } else if (n.data.node.type_domain) {
                emitter.emit("domainNodeClicked", n.data.node.label);
            } else if (n.data.node.type_gpo) {
                emitter.emit(
                    "gpoNodeClicked",
                    n.data.node.label,
                    n.data.node.guid
                );
            } else if (n.data.node.type_ou) {
                emitter.emit(
                    "ouNodeClicked",
                    n.data.node.label,
                    n.data.node.guid,
                    n.data.node.blocksinheritance
                );
            }
        } else {
            this.setState({ dragged: false });
        }
    }

    //Function taken from the DragNodes code https://github.com/jacomyal/sigma.js/blob/master/plugins/sigma.plugins.dragNodes/sigma.plugins.dragNodes.js
    calculateOffset(element) {
        var style = window.getComputedStyle(element);
        var getCssProperty = function(prop) {
          return parseInt(style.getPropertyValue(prop).replace('px', '')) || 0;
        };
        return {
          left: element.getBoundingClientRect().left + getCssProperty('padding-left'),
          top: element.getBoundingClientRect().top + getCssProperty('padding-top')
        };
    };

    lockScale(){
        let graph = this.state.sigmaInstance.graph;
        graph.initScale = graph.currentScale;
    }

    clearScale(){
        let graph = this.state.sigmaInstance.graph;
        graph.initScale = null;
    }

    //Function taken from the DragNodes code https://github.com/jacomyal/sigma.js/blob/master/plugins/sigma.plugins.dragNodes/sigma.plugins.dragNodes.js
    calculateClickPos(clientX, clientY){
        let _s = this.state.sigmaInstance;
        let _camera = _s.camera;
        let _prefix = _s.renderers[0].options.prefix;
        var offset = this.calculateOffset(_s.renderers[0].container),
            x = clientX - offset.left,
            y = clientY - offset.top,
            cos = Math.cos(_camera.angle),
            sin = Math.sin(_camera.angle),
            nodes = _s.graph.nodes(),
            ref = [];

        // Rotating the coordinates.
        return {x:x * cos - y * sin, y:y * cos + x * sin}
    }

    initializeSigma() {
        let sigmaInstance, design;

        sigmaInstance = new sigma({
            container: "graph"
        });

        sigmaInstance.settings({
            edgeColor: "default",
            edgeHoverColor: "default",
            defaultEdgeHoverColor: "green",
            enableEdgeHovering: true,
            nodeColor: "default",
            minEdgeSize: 1,
            maxEdgeSize: 2.5,
            iconThreshold: 4,
            labelThreshold: 15,
            labelAlignment: "bottom",
            labelColor: "default",
            font: "Roboto",
            glyphFillColor: "black",
            glyphTextColor: "white",
            glyphTextThreshold: 1,
            zoomingRatio: 1.4,
            scalingMode: "inside",
            autoRescale: true,
            sideMargin: 20
        });

        //Monkeypatch the drawIcon function to add font-weight to the canvas drawing for drawIcon
        //Kill me.
        sigma.utils.canvas.drawIcon = function(node, x, y, size, context, threshold){
            var font = node.icon.font || 'Arial',
            fgColor = node.icon.color || '#F00',
            text = node.icon.content || '?',
            px = node.icon.x || 0.5,
            py = node.icon.y || 0.5,
            height = size,
            width = size;
            var fontSizeRatio = 0.70;
            if (typeof node.icon.scale === "number") {
            fontSizeRatio = Math.abs(Math.max(0.01, node.icon.scale));
            }

            var fontSize = Math.round(fontSizeRatio * height);

            context.save();
            context.fillStyle = fgColor;
            context.font = '900 ' + fontSize + 'px ' + font;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, x, y);
            context.restore();
        }

        //Monkeypatch the middleware with a customized patch from here: https://github.com/jacomyal/sigma.js/pull/302/files
        sigma.middlewares.rescale = function(readPrefix, writePrefix, options) {
            var _this = this,
                i,
                l,
                a,
                b,
                c,
                d,
                scale,
                margin,
                n = this.graph.nodes(),
                e = this.graph.edges(),
                settings = this.settings.embedObjects(options || {}),
                bounds = settings('bounds') || sigma.utils.getBoundaries(
                  this.graph,
                  readPrefix,
                  true
                ),
                minX = bounds.minX,
                minY = bounds.minY,
                maxX = bounds.maxX,
                maxY = bounds.maxY,
                sizeMax = bounds.sizeMax,
                weightMax = bounds.weightMax,
                w = settings('width') || 1,
                h = settings('height') || 1,
                rescaleSettings = settings('autoRescale'),
                validSettings = {
                  nodePosition: 1,
                  nodeSize: 1,
                  edgeSize: 1
                };
            /**
             * What elements should we rescale?
             */
            if (!(rescaleSettings instanceof Array))
              rescaleSettings = ['nodePosition', 'nodeSize', 'edgeSize'];
        
            for (i = 0, l = rescaleSettings.length; i < l; i++)
              if (!validSettings[rescaleSettings[i]])
                throw new Error(
                  'The rescale setting "' + rescaleSettings[i] + '" is not recognized.'
                );
        
            var np = ~rescaleSettings.indexOf('nodePosition'),
                ns = ~rescaleSettings.indexOf('nodeSize'),
                es = ~rescaleSettings.indexOf('edgeSize');
        
            if (np) {
              /**
               * First, we compute the scaling ratio, without considering the sizes
               * of the nodes : Each node will have its center in the canvas, but might
               * be partially out of it.
               */
              scale = settings('scalingMode') === 'outside' ?
                Math.max(
                  w / Math.max(maxX - minX, 1),
                  h / Math.max(maxY - minY, 1)
                ) :
                Math.min(
                  w / Math.max(maxX - minX, 1),
                  h / Math.max(maxY - minY, 1)
                );

                _this.graph.currentScale = scale;
              /**
               * Then, we correct that scaling ratio considering a margin, which is
               * basically the size of the biggest node.
               * This has to be done as a correction since to compare the size of the
               * biggest node to the X and Y values, we have to first get an
               * approximation of the scaling ratio.
               **/
              margin =
                (
                  settings('rescaleIgnoreSize') ?
                    0 :
                    (settings('maxNodeSize') || sizeMax) / scale
                ) +
                (settings('sideMargin') || 0);
              maxX += margin;
              minX -= margin;
              maxY += margin;
              minY -= margin;
        
              // Fix the scaling with the new extrema:
              scale = settings('scalingMode') === 'outside' ?
                Math.max(
                  w / Math.max(maxX - minX, 1),
                  h / Math.max(maxY - minY, 1)
                ) :
                Math.min(
                  w / Math.max(maxX - minX, 1),
                  h / Math.max(maxY - minY, 1)
                );
                _this.graph.currentScale = scale;
            }
        
            // Size homothetic parameters:
            if (!settings('maxNodeSize') && !settings('minNodeSize')) {
              a = 1;
              b = 0;
            } else if (settings('maxNodeSize') === settings('minNodeSize')) {
              a = 0;
              b = +settings('maxNodeSize');
            } else {
              a = (settings('maxNodeSize') - settings('minNodeSize')) / sizeMax;
              b = +settings('minNodeSize');
            }
        
            if (!settings('maxEdgeSize') && !settings('minEdgeSize')) {
              c = 1;
              d = 0;
            } else if (settings('maxEdgeSize') === settings('minEdgeSize')) {
              c = 0;
              d = +settings('minEdgeSize');
            } else {
              c = (settings('maxEdgeSize') - settings('minEdgeSize')) / weightMax;
              d = +settings('minEdgeSize');
            }
        
            // Rescale the nodes and edges:
            for (i = 0, l = e.length; i < l; i++)
              e[i][writePrefix + 'size'] =
                e[i][readPrefix + 'size'] * (es ? c : 1) + (es ? d : 0);
        
            for (i = 0, l = n.length; i < l; i++) {
              n[i][writePrefix + 'size'] =
                n[i][readPrefix + 'size'] * (ns ? a : 1) + (ns ? b : 0);
        
              if (np) {
                n[i][writePrefix + 'x'] =
                  (n[i][readPrefix + 'x'] - (maxX + minX) / 2) * (this.graph.initScale || scale);
                n[i][writePrefix + 'y'] =
                  (n[i][readPrefix + 'y'] - (maxY + minY) / 2) * (this.graph.initScale || scale);
              }
              else {
                n[i][writePrefix + 'x'] = n[i][readPrefix + 'x'];
                n[i][writePrefix + 'y'] = n[i][readPrefix + 'y'];
              }
            }
        };

        //Bind sigma events
        sigmaInstance.renderers[0].bind("render", function(e) {
            sigmaInstance.renderers[0].glyphs();
        });

        sigmaInstance.camera.bind("coordinatesUpdated", function(e) {
            if (appStore.performance.edgeLabels === 0) {
                if (e.target.ratio > 1.25) {
                    sigmaInstance.settings("drawEdgeLabels", false);
                } else {
                    sigmaInstance.settings("drawEdgeLabels", true);
                }
            } else if (appStore.performance.edgeLabels === 1) {
                sigmaInstance.settings("drawEdgeLabels", true);
            } else {
                sigmaInstance.settings("drawEdgeLabels", false);
            }
        });

        sigmaInstance.bind("clickNode", this._nodeClicked.bind(this));

        sigmaInstance.bind(
            "hovers",
            function(e) {
                if (e.data.enter.nodes.length > 0) {
                    if (appStore.endNode !== null) {
                        findGraphPath(
                            this.state.sigmaInstance,
                            false,
                            e.data.enter.nodes[0].id,
                            []
                        );
                    }

                    if (appStore.startNode !== null) {
                        findGraphPath(
                            this.state.sigmaInstance,
                            true,
                            e.data.enter.nodes[0].id,
                            []
                        );
                    }

                    sigmaInstance.refresh({ skipIndexation: true });
                }

                if (e.data.leave.nodes.length > 0) {
                    if (appStore.highlightedEdges.length > 0) {
                        $.each(appStore.highlightedEdges, function(
                            index,
                            edge
                        ) {
                            edge.color =
                                sigmaInstance.settings.defaultEdgeColor;
                        });
                        appStore.highlightedEdges = [];
                        sigmaInstance.refresh({ skipIndexation: true });
                    }
                }
            }.bind(this)
        );

        sigmaInstance.bind("rightClickStage", event => {
            let x = event.data.captor.clientX;
            let y = event.data.captor.clientY;

            let newPos = this.calculateClickPos(x,y)

            this.setState({tooltipPos: {x: newPos.x, y: newPos.y}})
        })

        sigmaInstance.bind("clickStage", event => {
            closeTooltip()
        })

        //Some key binds
        $(window).on(
            "keyup",
            function(e) {
                let key = e.keyCode ? e.keyCode : e.which;
                let mode = appStore.performance.nodeLabels;
                let sigmaInstance = this.state.sigmaInstance;

                if (document.activeElement === document.body && key === 17) {
                    mode = mode + 1;
                    if (mode > 2) {
                        mode = 0;
                    }
                    appStore.performance.nodeLabels = mode;
                    conf.set("performance", appStore.performance);

                    if (mode === 2) {
                        sigmaInstance.settings("labelThreshold", 500);
                        emitter.emit("showAlert", "Hiding Node Labels");
                    } else if (mode === 0) {
                        sigmaInstance.settings("labelThreshold", 15);
                        emitter.emit(
                            "showAlert",
                            "Default Node Label Threshold"
                        );
                    } else {
                        sigmaInstance.settings("labelThreshold", 1);
                        emitter.emit("showAlert", "Always Showing Node Labels");
                    }

                    sigmaInstance.refresh({ skipIndexation: true });
                }
            }.bind(this)
        );

        //Plugin Configuration
        var dragListener = sigma.plugins.dragNodes(
            sigmaInstance,
            sigmaInstance.renderers[0]
        );

        dragListener.bind("drag", this._nodeDragged.bind(this));

        var tooltips = sigma.plugins.tooltips(
            sigmaInstance,
            sigmaInstance.renderers[0],
            {
                node: [
                    {
                        show: "rightClickNode",
                        cssClass: "new-tooltip",
                        autoadjust: true,
                        renderer: function(node) {
                            var template = this.state.nodeTemplate;
                            node.expand = false;
                            node.collapse = false;
                            if (
                                node.folded.nodes.length > 0 &&
                                !node.groupedNode
                            ) {
                                if (
                                    typeof this.state.sigmaInstance.graph.nodes(
                                        node.folded.nodes[0].id
                                    ) === "undefined"
                                ) {
                                    node.expand = true;
                                } else {
                                    node.collapse = true;
                                }
                            }
                            return Mustache.render(template, node);
                        }.bind(this)
                    }
                ],
                edge: [
                    {
                        show: "rightClickEdge",
                        cssClass: "new-tooltip",
                        autoadjust: true,
                        renderer: function(edge){
                            var template = this.state.edgeTemplate;
                            return Mustache.render(template, edge);
                        }.bind(this)
                    }
                ],
                stage: [
                    {
                        show: "rightClickStage",
                        cssClass: "new-tooltip",
                        autoadjust: true,
                        renderer: function(){
                            var template = this.state.stageTemplate;
                            return Mustache.render(template);
                        }.bind(this)
                    }
                ]
            }
        );

        tooltips.bind("shown", function(event) {
            appStore.currentTooltip = event.target;
        });

        tooltips.bind("hidden", function(event) {
            appStore.currentTooltip = null;
        });

        //Layout Plugins
        var forcelinkListener = sigma.layouts.configForceLink(sigmaInstance, {
            worker: true,
            background: true,
            easing: "cubicInOut",
            autoStop: true,
            alignNodeSiblings: true,
            barnesHutOptimize: true,
            randomize: "globally"
        });

        forcelinkListener.bind("stop", function(event) {
            emitter.emit("updateLoadingText", "Fixing Overlap");
            sigmaInstance.startNoverlap();
        });

        forcelinkListener.bind("start", function(event) {
            emitter.emit("updateLoadingText", "Initial Layout");
            emitter.emit("showLoadingIndicator", true);
        });

        var dagreListener = sigma.layouts.dagre.configure(sigmaInstance, {
            easing: "cubicInOut",
            boundingBox: {
                minX: 0,
                minY: 0,
                maxX: $("#graph").outerWidth(),
                maxY: $("#graph").outerHeight()
            },
            background: true,
            rankDir: "LR"
        });

        dagreListener.bind("stop", event => {
            var needsfix = false;
            sigmaInstance.graph.nodes().forEach(function(node) {
                if (isNaN(node.x) || isNaN(node.y)) {
                    emitter.emit("updateLoadingText", "Fixing Overlap");
                    sigmaInstance.startNoverlap();
                    needsfix = true;
                    return;
                }
            }, this);
            if (!needsfix) {
                emitter.emit("updateLoadingText", "Done!");
                this.lockScale();
                sigma.canvas.edges.autoCurve(sigmaInstance);
                setTimeout(function() {
                    emitter.emit("showLoadingIndicator", false);
                }, 1500);
            }
        });

        dagreListener.bind("start", function(event) {
            emitter.emit("updateLoadingText", "Initial Layout");
            emitter.emit("showLoadingIndicator", true);
        });

        // var noverlapListener = sigmaInstance.configNoverlap({
        //     nodeMargin: 5.0,
        //     easing: 'cubicInOut',
        //     gridSize: 20,
        //     permittedExpansion: 1.3
        // });
        //

        var noverlapListener = sigmaInstance.configNoverlap({});

        noverlapListener.bind("stop", event => {
            emitter.emit("updateLoadingText", "Done!");
            this.lockScale();
            sigma.canvas.edges.autoCurve(sigmaInstance);
            setTimeout(function() {
                emitter.emit("showLoadingIndicator", false);
            }, 1500);
        });

        var lowgfx = appStore.performance.lowGraphics;

        design = sigma.plugins.design(sigmaInstance);
        if (lowgfx) {
            sigmaInstance.settings("defaultEdgeType", "line");
            sigmaInstance.settings("defaultEdgeColor", "black");
            design.setPalette(appStore.lowResPalette);
            design.setStyles(appStore.lowResStyle);
        } else {
            sigmaInstance.settings("defaultEdgeType", "tapered");
            sigmaInstance.settings("defaultEdgeColor", "#356");
            design.setPalette(appStore.highResPalette);
            design.setStyles(appStore.highResStyle);
        }

        var mode = appStore.performance.nodeLabels;

        if (mode === 2) {
            sigmaInstance.settings("labelThreshold", 500);
        } else if (mode === 0) {
            sigmaInstance.settings("labelThreshold", 15);
        } else {
            sigmaInstance.settings("labelThreshold", 1);
        }

        this.setState({
            sigmaInstance: sigmaInstance,
            design: design
        });
    }
}
