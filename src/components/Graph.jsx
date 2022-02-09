import React, { Component } from 'react';
import { findGraphPath, generateUniqueId, setSchema } from 'utils';
import { writeFile, readFile } from 'fs';
import { fork } from 'child_process';

let child;
import { join } from 'path';
import { remote } from 'electron';
const { dialog } = remote;
import { v4 as uuidv4 } from 'uuid'
let Observer = require('fontfaceobserver');
import { withAlert } from 'react-alert';
import NodeTooltip from './Tooltips/NodeTooltip';
import StageTooltip from './Tooltips/StageTooltip';
import EdgeTooltip from './Tooltips/EdgeTooltip';
import ConfirmDrawModal from './Modals/ConfirmDrawModal';
import { escapeRegExp } from '../js/utils';

class GraphContainer extends Component {
    constructor(props) {
        super(props);

        child = fork(join(__dirname, 'src', 'js', 'worker.js'), {
            silent: true,
        });

        this.state = {
            sigmaInstance: null,
            design: null,
            dragged: false,
            firstDraw: true,
            session: driver.session(),
            darkMode: false,
            nodeTooltip: {
                visible: false,
                node: null,
                x: null,
                y: null,
            },
            stageTooltip: {
                visible: false,
                x: null,
                y: null,
            },
            edgeTooltip: {
                visible: false,
                x: null,
                y: null,
                edge: null,
            },
            ctrlDown: false,
            otherDown: false,
        };

        child.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.log(`error: ${data}`);
        });

        child.on(
            'message',
            function (m) {
                this.loadFromChildProcess(m);
            }.bind(this)
        );

        setSchema();

        emitter.on(
            'doLogout',
            function () {
                this.state.sigmaInstance.graph.clear();
                this.state.sigmaInstance.refresh();
                sigma.layouts.killForceLink();
                this.setState({ sigmaInstance: null });
                child.kill();
            }.bind(this)
        );
    }

    componentWillMount() {
        emitter.on('searchQuery', this.doSearchQuery.bind(this));
        emitter.on('graphBack', this.goBack.bind(this));
        emitter.on('query', this.doGenericQuery.bind(this));
        emitter.on('spotlightClick', this.spotlightClickHandler.bind(this));
        emitter.on('graphRefresh', this.relayout.bind(this));
        emitter.on('graphReload', this.reload.bind(this));
        emitter.on('export', this.export.bind(this));
        emitter.on('import', this.import.bind(this));
        emitter.on('clearDB', this.clearGraph.bind(this));
        emitter.on('changeGraphicsMode', this.setGraphicsMode.bind(this));
        emitter.on('ungroupNode', this.ungroupNode.bind(this));
        emitter.on('collapseNode', this.foldEdgeNode.bind(this));
        emitter.on('resetZoom', this.resetZoom.bind(this));
        emitter.on('zoomIn', this.zoomIn.bind(this));
        emitter.on('zoomOut', this.zoomOut.bind(this));
        emitter.on('changeNodeLabels', this.changeNodeLabelMode.bind(this));
        emitter.on('changeEdgeLabels', this.changeEdgeLabelMode.bind(this));
        emitter.on('deleteEdgeConfirm', this.deleteEdge.bind(this));
        emitter.on('deleteNodeConfirm', this.deleteNode.bind(this));
        emitter.on('changeLayout', this.changeLayout.bind(this));
        emitter.on('addNodeFinal', this.addNode.bind(this));
        emitter.on('setOwned', this.setOwned.bind(this));
        emitter.on('setHighVal', this.setHighVal.bind(this));
        emitter.on('getHelp', this.getHelpEdge.bind(this));
        emitter.on('toggleDarkMode', this.toggleDarkMode.bind(this));
        emitter.on('closeTooltip', this.hideTooltip.bind(this));
        emitter.on('confirmGraphDraw', this.sendToChild.bind(this));
    }

    componentDidMount() {
        const font = new Observer('Font Awesome 5 Free');
        font.load().then((x) => {
            this.inita();
        });
    }

    hideTooltip() {
        this.setState({
            nodeTooltip: { visible: false },
            edgeTooltip: { visible: false },
            stageTooltip: { visible: false },
        });
    }

    toggleDarkMode(enabled) {
        this.setState({ darkMode: enabled });

        if (enabled) {
            this.state.sigmaInstance.settings('defaultEdgeColor', 'white');
            this.state.sigmaInstance.settings('defaultLabelColor', 'white');
            this.state.sigmaInstance.settings('defaultEdgeLabelColor', 'white');
            this.state.sigmaInstance.settings(
                'defaultEdgeHoverLabelBGColor',
                'black'
            );
            //this.state.sigmaInstance.settings("defaultNodeColor", "white");
        } else {
            this.state.sigmaInstance.settings('defaultEdgeColor', '#356');
            this.state.sigmaInstance.settings('defaultLabelColor', 'black');
            this.state.sigmaInstance.settings('defaultEdgeLabelColor', 'black');
            this.state.sigmaInstance.settings(
                'defaultEdgeHoverLabelBGColor',
                'white'
            );
            //this.state.sigmaInstance.settings("defaultNodeColor", "black");
        }

        this.state.sigmaInstance.refresh({ skipIndexation: true });
    }

    inita() {
        this.initializeSigma();
        this.toggleDarkMode(appStore.performance.darkMode);
        this.doQueryNative({
            statement:
                'MATCH (n:Group) WHERE n.objectid =~ "(?i)S-1-5.*-512" WITH n MATCH (n)<-[r:MemberOf*1..]-(m) RETURN n,r,m',
            //statement: 'MATCH (n)-[r:AdminTo]->(m) RETURN n,r,m LIMIT 5',
            //statement: 'MATCH p=(n:Domain)-[r]-(m:Domain) RETURN p',
            //statement: 'MATCH p=(n)-[r]->(m) RETURN p',
            allowCollapse: false,
            props: {},
        });
    }

    getHelpEdge(id) {
        closeTooltip();
        let instance = this.state.sigmaInstance.graph;
        let edge = instance.edges(id);
        let source = instance.nodes(edge.source);
        let target = instance.nodes(edge.target);
        emitter.emit('displayHelp', edge, source, target);
    }

    setOwned(id, status) {
        closeTooltip();
        let instance = this.state.sigmaInstance;
        let node = instance.graph.nodes(id);
        if (status) {
            node.owned = true;
            node.notowned = false;
            node.glyphs.push({
                position: 'top-left',
                font: '"Font Awesome 5 Free"',
                content: '\uf54c',
                fillColor: 'black',
                fontScale: 2.0,
                fontStyle: '900',
            });
        } else {
            let newglyphs = [];
            $.each(node.glyphs, (_, glyph) => {
                if (glyph.position !== 'top-left') {
                    newglyphs.push(glyph);
                }
            });
            node.glyphs = newglyphs;
            node.notowned = true;
            node.owned = false;
        }

        instance.renderers[0].glyphs();
        instance.refresh();

        let q = driver.session();
        q.run(
            `MATCH (n:${node.type} {objectid:$objectid}) SET n.owned=$status`,
            {
                objectid: node.objectid,
                status: status,
            }
        ).then((x) => {
            q.close();
        });
    }

    setHighVal(id, status) {
        closeTooltip();
        let instance = this.state.sigmaInstance;
        let node = instance.graph.nodes(id);
        node.highvalue = status;
        if (status) {
            node.glyphs.push({
                position: 'top-right',
                font: '"Font Awesome 5 Free"',
                content: '\uf3a5',
                fillColor: 'black',
                fontScale: 1.5,
                fontStyle: '900',
            });
        } else {
            let newglyphs = [];
            $.each(node.glyphs, (_, glyph) => {
                if (glyph.position !== 'top-right') {
                    newglyphs.push(glyph);
                }
            });
            node.glyphs = newglyphs;
        }

        instance.renderers[0].glyphs();
        instance.refresh();

        let q = driver.session();

        q.run(
            `MATCH (n:${node.type} {objectid: $objectid}) SET n.highvalue=$status`,
            { objectid: node.objectid, status: status }
        ).then(() => {
            q.close();
        });
    }

    async addNode(name, type) {
        let guid = uuidv4();

        let statement = `MERGE (n:Base {objectid: $guid}) ON CREATE SET n:${type} SET n.name=$name`;
        if (type === 'Computer' || type === 'User') {
            statement = `${statement}, n.owned=false`;
        }
        let session = driver.session();
        await session.run(statement, { name: name, guid: guid });
        await session.close();

        let instance = this.state.sigmaInstance;
        let id = generateUniqueId(instance, true);
        let node = {
            id: id,
            label: name,
            type: type,
            x: this.state.stageTooltip.x,
            y: this.state.stageTooltip.y,
            folded: {
                nodes: [],
                edges: [],
            },
            groupedNode: false,
            degree: 1,
        };
        node[type] = true;
        instance.graph.addNode(node);
        closeTooltip();
        this.applyDesign();
        await session.close();
    }

    relayout() {
        closeTooltip();
        this.clearScale();
        sigma.layouts.stopForceLink();

        if (appStore.dagre) {
            sigma.layouts.dagre.start(this.state.sigmaInstance);
        } else {
            sigma.layouts.startForceLink();
        }
    }

    changeLayout() {
        appStore.dagre = !appStore.dagre;
        const type = appStore.dagre ? 'Hierarchical' : 'Directed';
        this.props.alert.success('Changed Layout to {}'.format(type));
        this.relayout();
    }

    deleteNode(id) {
        let instance = this.state.sigmaInstance;
        let node = instance.graph.nodes(id);
        let type = node.type;

        let statement = `MATCH (n:${type} {objectid: $objectid}) DETACH DELETE n`;

        instance.graph.dropNode(node.id);
        instance.refresh();

        let q = driver.session();
        q.run(statement, { objectid: node.objectid }).then(() => {
            q.close();
        });
    }

    deleteEdge(id) {
        let instance = this.state.sigmaInstance;
        let edge = instance.graph.edges(id);
        let sourcenode = instance.graph.nodes(edge.source);
        let targetnode = instance.graph.nodes(edge.target);

        let statement = `MATCH (n:${sourcenode.type} {objectid: $sourceid}) MATCH (m:${targetnode.type} {objectid: $targetid}) MATCH (n)-[r:${edge.label}]->(m) DELETE r`;

        instance.graph.dropEdge(edge.id);
        instance.refresh();

        let q = driver.session();
        q.run(statement, {
            sourceid: sourcenode.objectid,
            targetid: targetnode.objectid,
        }).then(() => {
            q.close();
        });
    }

    reload() {
        closeTooltip();
        this.doQueryNative(this.state.currentQuery);
    }

    export(payload) {
        if (payload === 'image') {
            let size = $('#graph').outerWidth();
            let bgColor = this.state.darkMode ? '#383332' : '#f2f5f9';
            sigma.plugins.image(
                this.state.sigmaInstance,
                this.state.sigmaInstance.renderers[0],
                {
                    download: true,
                    size: size,
                    background: bgColor,
                    clip: true,
                }
            );
        } else {
            let json = this.state.sigmaInstance.toJSON({
                pretty: true,
            });

            json = JSON.parse(json);
            json.spotlight = appStore.spotlightData;

            let r = dialog.showSaveDialogSync({
                defaultPath: 'graph.json',
            });
            if (r !== undefined) {
                writeFile(r, JSON.stringify(json, null, 2), (err) => {
                    if (err) console.log(err);
                    console.log('Saved ' + r + ' successfully');
                });
            }
        }
    }

    changeNodeLabelMode() {
        let mode = appStore.performance.nodeLabels;
        let instance = this.state.sigmaInstance;
        if (mode === 0) {
            instance.settings('labelThreshold', 15);
        } else if (mode === 1) {
            instance.settings('labelThreshold', 1);
        } else {
            instance.settings('labelThreshold', 500);
        }
        instance.refresh({ skipIndexation: true });
        this.setState({
            sigmaInstance: instance,
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
            sigmaInstance: instance,
        });
    }

    loadFromChildProcess(graph) {
        if (graph.nodes.length === 0) {
            this.props.alert.info('No data returned from query');
            emitter.emit('updateLoadingText', 'Done!');
            setTimeout(function () {
                emitter.emit('showLoadingIndicator', false);
            }, 1500);
        } else {
            this.drawGraph(true, graph);
        }
    }

    sendToChild(confirm, graph, params) {
        if (confirm) {
            emitter.emit('updateLoadingText', 'Processing Data');
            child.send(
                JSON.stringify({
                    graph: graph,
                    edge: params.allowCollapse ? appStore.performance.edge : 0,
                    sibling: params.allowCollapse
                        ? appStore.performance.sibling
                        : 0,
                    start: params.start,
                    end: params.end,
                })
            );
        } else {
            emitter.emit('updateLoadingText', 'Done!');
            setTimeout(function () {
                emitter.emit('showLoadingIndicator', false);
            }, 1500);
            return;
        }
    }

    drawGraph(confirm, graph) {
        if (!confirm) {
            emitter.emit('updateLoadingText', 'Done!');
            setTimeout(function () {
                emitter.emit('showLoadingIndicator', false);
            }, 1500);
            return;
        }

        appStore.queryStack.push({
            nodes: this.state.sigmaInstance.graph.nodes(),
            edges: this.state.sigmaInstance.graph.edges(),
            spotlight: appStore.spotlightData,
            startNode: appStore.startNode,
            endNode: appStore.endNode,
            params: this.state.currentQuery,
        });

        $.each(graph.nodes, function (i, node) {
            if (node.start) {
                appStore.startNode = node;
            }

            if (node.end) {
                appStore.endNode = node;
            }

            node.glyphs = $.map(node.glyphs, function (value, index) {
                return [value];
            });
        });

        this.setState({ firstDraw: false });
        sigma.misc.animation.camera(this.state.sigmaInstance.camera, {
            x: 0,
            y: 0,
            ratio: 1.075,
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
        emitter.emit('spotlightUpdate');
    }

    import(payload) {
        readFile(
            payload,
            'utf8',
            function (err, data) {
                let graph;
                try {
                    graph = JSON.parse(data);
                } catch (err) {
                    this.props.alert.error('Bad JSON File');
                    return;
                }

                if (graph.nodes.length === 0) {
                    this.props.alert.info('No data returned from query');
                } else {
                    $.each(graph.nodes, function (i, node) {
                        node.glyphs = $.map(
                            node.glyphs,
                            function (value, index) {
                                return [value];
                            }
                        );
                    });
                    appStore.queryStack.push({
                        nodes: this.state.sigmaInstance.graph.nodes(),
                        edges: this.state.sigmaInstance.graph.edges(),
                        spotlight: appStore.spotlightData,
                        startNode: appStore.startNode,
                        endNode: appStore.endNode,
                        params: this.state.currentQuery,
                    });

                    appStore.spotlightData = graph.spotlight;
                    this.state.sigmaInstance.graph.clear();
                    this.state.sigmaInstance.graph.read(graph);
                    this.state.sigmaInstance.refresh();
                    emitter.emit('spotlightUpdate');
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

        $.each(this.state.sigmaInstance.graph.edges(), function (index, edge) {
            if (edge.hasOwnProperty('enforced')) {
                if (edge.enforced === false) {
                    edge.type = 'dashed';
                }
            }
        });

        $.each(
            this.state.sigmaInstance.graph.nodes(),
            function (_, node) {
                if (node.hasOwnProperty('blocksinheritance')) {
                    if (node.blocksinheritance === true) {
                        let targets = [];
                        $.each(
                            this.state.sigmaInstance.graph.outNeighbors(
                                node.id
                            ),
                            function (_, nodeid) {
                                targets.push(parseInt(nodeid));
                            }.bind(this)
                        );

                        $.each(
                            this.state.sigmaInstance.graph.adjacentEdges(
                                node.id
                            ),
                            function (_, edge) {
                                if (targets.includes(edge.target)) {
                                    edge.type = 'dotted';
                                }
                            }
                        );
                    }
                }
            }.bind(this)
        );
    }

    setGraphicsMode() {
        const lowgfx = appStore.performance.lowGraphics;
        const sigmaInstance = this.state.sigmaInstance;
        this.state.design.clear();
        if (lowgfx) {
            sigmaInstance.settings('defaultEdgeType', 'line');
            sigmaInstance.settings('defaultEdgeColor', 'black');
            this.state.design.setPalette(appStore.lowResPalette);
            this.state.design.setStyles(appStore.lowResStyle);
        } else {
            sigmaInstance.settings('defaultEdgeType', 'tapered');
            sigmaInstance.settings('defaultEdgeColor', '#356');
            this.state.design.setPalette(appStore.highResPalette);
            this.state.design.setStyles(appStore.highResStyle);
        }
        this.applyDesign();
    }

    resetZoom() {
        sigma.misc.animation.camera(this.state.sigmaInstance.camera, {
            x: 0,
            y: 0,
            ratio: 1.075,
        });
    }

    zoomOut() {
        const sigmaInstance = this.state.sigmaInstance;
        const cam = sigmaInstance.camera;

        sigma.misc.animation.camera(
            cam,
            {
                ratio: cam.ratio * cam.settings('zoomingRatio'),
            },
            {
                duration: sigmaInstance.settings('animationsTime'),
            }
        );
    }

    zoomIn() {
        const sigmaInstance = this.state.sigmaInstance;
        const cam = sigmaInstance.camera;

        sigma.misc.animation.camera(
            cam,
            {
                ratio: cam.ratio / cam.settings('zoomingRatio'),
            },
            {
                duration: sigmaInstance.settings('animationsTime'),
            }
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
                edges: query.edges,
            });
            this.setState({ currentQuery: query.params });

            if (appStore.performance.debug) {
                let temp = query.params.statement;
                $.each(Object.keys(query.params.props), function (_, key) {
                    let propKey = `$${key}`;
                    let replace = escapeRegExp(propKey);
                    let regexp = new RegExp(replace, 'g');
                    let props = `"${query.params.props[key]}"`;

                    temp = temp.replace(regexp, props);
                });
                emitter.emit('setRawQuery', temp);
            }

            this.applyDesign();
            this.lockScale();
            appStore.spotlightData = query.spotlight;
            appStore.startNode = query.startNode;
            appStore.endNode = query.endNode;
            emitter.emit('spotlightUpdate');
        }
    }

    spotlightClickHandler(nodeId, parentId) {
        let sigmaInstance = this.state.sigmaInstance;
        let parent = sigmaInstance.graph.nodes(nodeId);
        let label, child;
        if (typeof parent === 'undefined') {
            child = sigmaInstance.graph
                .nodes(parentId)
                .folded.nodes.filter(function (val) {
                    return val.id === nodeId;
                })[0];
            parent = sigmaInstance.graph.nodes(parentId);
        } else {
            child = parent;
        }
        label = child.objectid;
        emitter.emit('nodeClicked', child.type, label);
        parent.color = '#2DC486';
        sigma.misc.animation.camera(
            sigmaInstance.camera,
            {
                x: parent[sigmaInstance.camera.readPrefix + 'x'],
                y: parent[sigmaInstance.camera.readPrefix + 'y'],
                ratio: 0.5,
            },
            { duration: sigmaInstance.settings('animationsTime') }
        );

        setTimeout(function () {
            parent.color = 'black';
            sigmaInstance.refresh({ skipIndexation: true });
        }, 2000);
    }

    doQueryNative(params) {
        this.clearScale();
        let nodes = {};
        let edges = {};
        let session = driver.session();
        if (typeof params.props === 'undefined') {
            params.props = {};
        }
        emitter.emit('showLoadingIndicator', true);
        emitter.emit('updateLoadingText', 'Querying Database');
        emitter.emit('resetSpotlight');
        this.setState({ currentQuery: params });

        let edgearr = [];
        let stat = appStore.edgeincluded;

        $.each(Object.keys(stat), function (_, key) {
            if (stat[key]) {
                edgearr.push(key);
            }
        });

        if (edgearr.length === 0) {
            this.props.alert.info('Must specify at least one edge type');
            emitter.emit('updateLoadingText', 'Done!');
            setTimeout(function () {
                emitter.emit('showLoadingIndicator', false);
            }, 1500);
            return;
        }

        let finaledges = edgearr.join('|');
        let statement = params.statement.format(finaledges);

        if (appStore.performance.debug) {
            let temp = statement;
            $.each(Object.keys(params.props), function (_, key) {
                let propKey = `$${key}`;
                let replace = escapeRegExp(propKey);
                let regexp = new RegExp(replace, 'g');
                let props = `"${params.props[key]}"`;

                temp = temp.replace(regexp, props);
            });
            emitter.emit('setRawQuery', temp);
        }

        session.run(statement, params.props).subscribe({
            onNext: async function (result) {
                $.each(
                    result._fields,
                    function (_, field) {
                        if (field !== null) {
                            if (field.hasOwnProperty('segments')) {
                                $.each(
                                    field.segments,
                                    function (_, segment) {
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

                                        if (end !== null) {
                                            if (!nodes[end.id]) {
                                                nodes[end.id] = end;
                                            }
                                        }

                                        if (start !== null) {
                                            if (!nodes[start.id]) {
                                                nodes[start.id] = start;
                                            }
                                        }
                                    }.bind(this)
                                );
                            } else {
                                if ($.isArray(field)) {
                                    $.each(
                                        field,
                                        function (_, value) {
                                            if (value !== null) {
                                                let id = value.identity;
                                                if (
                                                    'end' in value &&
                                                    !edges.id
                                                ) {
                                                    edges[
                                                        id
                                                    ] = this.createEdgeFromRow(
                                                        value
                                                    );
                                                } else if (
                                                    !nodes.id &&
                                                    !('end' in value)
                                                ) {
                                                    let node = this.createNodeFromRow(
                                                        value,
                                                        params
                                                    );
                                                    if (node !== null) {
                                                        nodes[id] = node;
                                                    }
                                                }
                                            }
                                        }.bind(this)
                                    );
                                } else {
                                    let id = field.identity;
                                    if (
                                        Object.hasOwnProperty(field, 'end') &&
                                        !edges.id
                                    ) {
                                        edges[id] = this.createEdgeFromRow(
                                            field
                                        );
                                    } else if (
                                        !nodes.id &&
                                        !Object.hasOwnProperty(field, 'end')
                                    ) {
                                        let node = this.createNodeFromRow(
                                            field,
                                            params
                                        );
                                        if (node !== null) {
                                            nodes[id] = node;
                                        }
                                    }
                                }
                            }
                        }
                    }.bind(this)
                );
            }.bind(this),
            onError: function (error) {
                emitter.emit('showGraphError', error.message);
                emitter.emit('updateLoadingText', 'Done!');
                setTimeout(function () {
                    emitter.emit('showLoadingIndicator', false);
                }, 1500);
            },
            onCompleted: function () {
                const graph = {nodes: [], edges: []};
                $.each(nodes, function (node) {
                    graph.nodes.push(nodes[node]);
                });

                $.each(edges, function (edge) {
                    graph.edges.push(edges[edge]);
                });

                if (graph.nodes.length > 500) {
                    emitter.emit('showGraphConfirm', graph, params);
                    return;
                }
                this.sendToChild(true, graph, params);
                session.close();
            }.bind(this),
        });
    }

    createEdgeFromRow(data) {
        const id = data.identity;
        const type = data.type;
        const source = data.start;
        const target = data.end;

        const edge = {
            id: id,
            etype: type,
            source: source,
            target: target,
            label: type,
        };

        if (data.hasOwnProperty('properties')) {
            if (data.properties.hasOwnProperty('enforced')) {
                edge.enforced = data.properties.enforced;
            }

            if (data.properties.hasOwnProperty('port')) {
                let port = data.properties.port;
                edge.label = `${type} (${port})`;
            }
        }

        if (
            data.hasOwnProperty('properties') &&
            data.properties.hasOwnProperty('enforced')
        ) {
            edge.enforced = data.properties.enforced;
        }

        return edge;
    }

    selectLabel(properties){
        if (properties.hasOwnProperty("name")){
            return properties["name"];
        }else if (properties.hasOwnProperty("azname")){
            return properties["azname"];
        }else{
            return properties["objectid"]
        }
    }

    createNodeFromRow(data, params) {
        if (!data.hasOwnProperty('identity')) {
            return null;
        }
        let id = data.identity;
        let fType = data.labels.filter((w) => w !== 'Base');
        let type = fType.length > 0 ? fType[0] : 'Base';
        let label = this.selectLabel(data.properties)

        let node = {
            id: id,
            type: type,
            label: label,
            Enabled: data.properties.Enabled,
            props: data.properties,
            glyphs: [],
            folded: {
                nodes: [],
                edges: [],
            },
            x: Math.random(),
            y: Math.random(),
        };

        node.objectid = data.properties.objectid;

        if (data.hasOwnProperty('properties')) {
            if (data.properties.hasOwnProperty('blocksinheritance')) {
                node.blocksinheritance = data.properties.blocksinheritance;
            }

            if (data.properties.hasOwnProperty('haslaps')) {
                node.haslaps = data.properties.haslaps;
            }

            if (data.properties.hasOwnProperty('guid')) {
                node.guid = data.properties.guid;
            }

            if (data.properties.hasOwnProperty('owned')) {
                if (data.properties.owned) {
                    node.owned = true;
                } else {
                    node.notowned = true;
                }
            }

            node.highvalue = data.properties.highvalue;
        }

        if (label === params.start) {
            node.start = true;
            node.glyphs.push({
                position: 'bottom-right',
                font: '"Font Awesome 5 Free"',
                content: '\uF3C5',
                fillColor: '#3399FF',
                fontScale: 1.5,
                fontStyle: '900',
            });
        }

        if (label === params.end) {
            node.end = true;
            node.glyphs.push({
                position: 'bottom-right',
                font: '"Font Awesome 5 Free"',
                fillColor: '#990000',
                content: '\uF140',
                fontScale: 1.5,
                fontStyle: '900',
            });
        }

        if (node.owned) {
            node.glyphs.push({
                position: 'top-left',
                font: '"Font Awesome 5 Free"',
                content: '\uf54c',
                fillColor: 'black',
                fontScale: 2.0,
                fontStyle: '900',
            });
        }

        if (node.highvalue) {
            node.glyphs.push({
                position: 'top-right',
                font: '"Font Awesome 5 Free"',
                content: '\uf3a5',
                fillColor: 'black',
                fontScale: 1.5,
                fontStyle: '900',
            });
        }

        switch (type) {
            case 'Group':
                node.type_group = true;
                break;
            case 'User':
                node.type_user = true;
                break;
            case 'Computer':
                node.type_computer = true;
                break;
            case 'Domain':
                node.type_domain = true;
                break;
            case 'GPO':
                node.type_gpo = true;
                break;
            case 'OU':
                node.type_ou = true;
                break;
        }

        return node;
    }

    unfoldEdgeNode(id) {
        const sigmaInstance = this.state.sigmaInstance;
        sigmaInstance.graph.read(sigmaInstance.graph.nodes(id).folded);
        this.state.design.deprecate();
        this.state.design.apply();
        this.relayout();
    }

    foldEdgeNode(id) {
        const sigmaInstance = this.state.sigmaInstance;
        $.each(sigmaInstance.graph.nodes(id).folded.nodes, function (_, node) {
            sigmaInstance.graph.dropNode(node.id);
        });
        sigmaInstance.refresh();
        this.state.design.deprecate();
        this.state.design.apply();
        this.relayout();
    }

    ungroupNode(id) {
        const sigmaInstance = this.state.sigmaInstance;
        const node = sigmaInstance.graph.nodes(id);
        node.glyphs = node.glyphs.filter((glyph) => {
            return glyph.position !== 'bottom-left';
        });
        node.isGrouped = false;
        sigmaInstance.graph.read(node.folded);
        this.state.design.deprecate();
        sigmaInstance.refresh();
        this.state.design.apply();
        this.relayout();
    }

    doSearchQuery(payload, props) {
        if (typeof props === 'undefined') {
            props = {};
        }
        this.doQueryNative({
            statement: payload,
            allowCollapse: true,
            props: props,
        });
    }

    doGenericQuery(statement, props, start, end, allowCollapse = true) {
        closeTooltip();

        if (typeof props === 'undefined') {
            props = {};
        }

        this.doQueryNative({
            statement: statement,
            allowCollapse: allowCollapse,
            start: start,
            end: end,
            props: props,
        });
    }

    _nodeDragged() {
        this.setState({ dragged: true });
    }

    _nodeClicked(n) {
        if (!this.state.dragged) {
            emitter.emit(
                'nodeClicked',
                n.data.node.type,
                n.data.node.objectid,
                n.data.node.blocksinheritance,
                n.data.node.props.domain
            );
        } else {
            this.setState({ dragged: false });
        }
    }

    //Function taken from the DragNodes code https://github.com/jacomyal/sigma.js/blob/master/plugins/sigma.plugins.dragNodes/sigma.plugins.dragNodes.js
    calculateOffset(element) {
        const style = window.getComputedStyle(element);
        const getCssProperty = function (prop) {
            return (
                parseInt(style.getPropertyValue(prop).replace('px', '')) || 0
            );
        };
        return {
            left:
                element.getBoundingClientRect().left +
                getCssProperty('padding-left'),
            top:
                element.getBoundingClientRect().top +
                getCssProperty('padding-top'),
        };
    }

    lockScale() {
        let graph = this.state.sigmaInstance.graph;
        graph.initScale = graph.currentScale;
    }

    clearScale() {
        let graph = this.state.sigmaInstance.graph;
        graph.initScale = null;
    }

    //Function taken from the DragNodes code https://github.com/jacomyal/sigma.js/blob/master/plugins/sigma.plugins.dragNodes/sigma.plugins.dragNodes.js
    calculateClickPos(clientX, clientY) {
        let _s = this.state.sigmaInstance;
        let _camera = _s.camera;
        let _prefix = _s.renderers[0].options.prefix;
        const offset = this.calculateOffset(_s.renderers[0].container),
            x = clientX - offset.left,
            y = clientY - offset.top,
            cos = Math.cos(_camera.angle),
            sin = Math.sin(_camera.angle),
            nodes = _s.graph.nodes(),
            ref = [];

        // Rotating the coordinates.
        return { x: x * cos - y * sin, y: y * cos + x * sin };
    }

    initializeSigma() {
        let sigmaInstance, design;

        sigmaInstance = new sigma({
            container: 'graph',
        });

        sigmaInstance.settings({
            edgeColor: 'default',
            edgeHoverColor: 'default',
            defaultEdgeHoverColor: 'green',
            enableEdgeHovering: true,
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
            scalingMode: 'inside',
            autoRescale: true,
            sideMargin: 20,
        });

        //Monkeypatch the drawIcon function to add font-weight to the canvas drawing for drawIcon
        //Kill me.
        sigma.utils.canvas.drawIcon = function (
            node,
            x,
            y,
            size,
            context,
            threshold
        ) {
            const font = node.icon.font || 'Arial',
                fgColor = node.icon.color || '#F00',
                text = node.icon.content || '?',
                px = node.icon.x || 0.5,
                py = node.icon.y || 0.5,
                height = size,
                width = size;
            let fontSizeRatio = 0.7;
            if (typeof node.icon.scale === 'number') {
                fontSizeRatio = Math.abs(Math.max(0.01, node.icon.scale));
            }

            const fontSize = Math.round(fontSizeRatio * height);

            context.save();
            context.fillStyle = fgColor;
            context.font = '900 ' + fontSize + 'px ' + font;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, x, y);
            context.restore();
        };

        //Monkeypatch the middleware with a customized patch from here: https://github.com/jacomyal/sigma.js/pull/302/files
        sigma.middlewares.rescale = function (
            readPrefix,
            writePrefix,
            options
        ) {
            const _this = this;
            let i,
                l,
                a,
                b,
                c,
                d,
                scale,
                margin;
            const n = this.graph.nodes(),
                e = this.graph.edges(),
                settings = this.settings.embedObjects(options || {}),
                bounds =
                    settings('bounds') ||
                    sigma.utils.getBoundaries(this.graph, readPrefix, true);
            let minX = bounds.minX,
                minY = bounds.minY,
                maxX = bounds.maxX,
                maxY = bounds.maxY;
            const sizeMax = bounds.sizeMax,
                weightMax = bounds.weightMax,
                w = settings('width') || 1,
                h = settings('height') || 1;
            let rescaleSettings = settings('autoRescale');
            const validSettings = {
                nodePosition: 1,
                nodeSize: 1,
                edgeSize: 1,
            };
            /**
             * What elements should we rescale?
             */
            if (!(rescaleSettings instanceof Array))
                rescaleSettings = ['nodePosition', 'nodeSize', 'edgeSize'];

            for (i = 0, l = rescaleSettings.length; i < l; i++)
                if (!validSettings[rescaleSettings[i]])
                    throw new Error(
                        'The rescale setting "' +
                            rescaleSettings[i] +
                            '" is not recognized.'
                    );

            const np = ~rescaleSettings.indexOf('nodePosition'),
                ns = ~rescaleSettings.indexOf('nodeSize'),
                es = ~rescaleSettings.indexOf('edgeSize');

            if (np) {
                /**
                 * First, we compute the scaling ratio, without considering the sizes
                 * of the nodes : Each node will have its center in the canvas, but might
                 * be partially out of it.
                 */
                scale =
                    settings('scalingMode') === 'outside'
                        ? Math.max(
                              w / Math.max(maxX - minX, 1),
                              h / Math.max(maxY - minY, 1)
                          )
                        : Math.min(
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
                    (settings('rescaleIgnoreSize')
                        ? 0
                        : (settings('maxNodeSize') || sizeMax) / scale) +
                    (settings('sideMargin') || 0);
                maxX += margin;
                minX -= margin;
                maxY += margin;
                minY -= margin;

                // Fix the scaling with the new extrema:
                scale =
                    settings('scalingMode') === 'outside'
                        ? Math.max(
                              w / Math.max(maxX - minX, 1),
                              h / Math.max(maxY - minY, 1)
                          )
                        : Math.min(
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
                a =
                    (settings('maxNodeSize') - settings('minNodeSize')) /
                    sizeMax;
                b = +settings('minNodeSize');
            }

            if (!settings('maxEdgeSize') && !settings('minEdgeSize')) {
                c = 1;
                d = 0;
            } else if (settings('maxEdgeSize') === settings('minEdgeSize')) {
                c = 0;
                d = +settings('minEdgeSize');
            } else {
                c =
                    (settings('maxEdgeSize') - settings('minEdgeSize')) /
                    weightMax;
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
                        (n[i][readPrefix + 'x'] - (maxX + minX) / 2) *
                        (this.graph.initScale || scale);
                    n[i][writePrefix + 'y'] =
                        (n[i][readPrefix + 'y'] - (maxY + minY) / 2) *
                        (this.graph.initScale || scale);
                } else {
                    n[i][writePrefix + 'x'] = n[i][readPrefix + 'x'];
                    n[i][writePrefix + 'y'] = n[i][readPrefix + 'y'];
                }
            }
        };

        //Bind sigma events
        sigmaInstance.renderers[0].bind('render', function (e) {
            sigmaInstance.renderers[0].glyphs();
        });

        sigmaInstance.camera.bind('coordinatesUpdated', function (e) {
            if (appStore.performance.edgeLabels === 0) {
                if (e.target.ratio > 1.25) {
                    sigmaInstance.settings('drawEdgeLabels', false);
                } else {
                    sigmaInstance.settings('drawEdgeLabels', true);
                }
            } else if (appStore.performance.edgeLabels === 1) {
                sigmaInstance.settings('drawEdgeLabels', true);
            } else {
                sigmaInstance.settings('drawEdgeLabels', false);
            }
        });

        sigmaInstance.bind('clickNode', this._nodeClicked.bind(this));

        sigmaInstance.bind(
            'hovers',
            function (e) {
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
                        $.each(
                            appStore.highlightedEdges,
                            function (index, edge) {
                                edge.color =
                                    sigmaInstance.settings.defaultEdgeColor;
                            }
                        );
                        appStore.highlightedEdges = [];
                        sigmaInstance.refresh({ skipIndexation: true });
                    }
                }
            }.bind(this)
        );

        sigmaInstance.bind('rightClickStage', (event) => {
            let x = event.data.captor.clientX;
            let y = event.data.captor.clientY;

            this.setState({
                stageTooltip: {
                    x: x,
                    y: y,
                    visible: true,
                },
                edgeTooltip: {
                    visible: false,
                },
                nodeTooltip: {
                    visible: false,
                },
            });
        });

        sigmaInstance.bind('rightClickEdge', (event) => {
            this.setState({
                edgeTooltip: {
                    edge: event.data.edge,
                    x: event.data.captor.clientX,
                    y: event.data.captor.clientY,
                    visible: true,
                },
                stageTooltip: {
                    visible: false,
                },
                nodeTooltip: {
                    visible: false,
                },
            });
        });

        sigmaInstance.bind('clickStage', (event) => {
            closeTooltip();
        });

        sigmaInstance.bind('rightClickNode', (event) => {
            this.setState({
                nodeTooltip: {
                    node: event.data.node,
                    x: event.data.captor.clientX,
                    y: event.data.captor.clientY,
                    visible: true,
                },
                edgeTooltip: {
                    visible: false,
                },
                stageTooltip: {
                    visible: false,
                },
            });
        });

        //Some key binds
        $(window).on('keydown', (e) => {
            let key = e.key;
            if (key === 'Control' || key === 'ControlRight') {
                this.setState({
                    ctrlDown: true,
                });
            } else {
                this.setState({
                    otherDown: true,
                });
            }
        });
        $(window).on(
            'keyup',
            function (e) {
                let mode = appStore.performance.nodeLabels;
                let sigmaInstance = this.state.sigmaInstance;

                if (
                    document.activeElement === document.body &&
                    this.state.ctrlDown &&
                    !this.state.otherDown
                ) {
                    mode = mode + 1;
                    if (mode > 2) {
                        mode = 0;
                    }
                    appStore.performance.nodeLabels = mode;
                    conf.set('performance', appStore.performance);

                    if (mode === 2) {
                        sigmaInstance.settings('labelThreshold', 500);
                        this.props.alert.info('Hiding Node Labels');
                    } else if (mode === 0) {
                        sigmaInstance.settings('labelThreshold', 15);
                        this.props.alert.info('Default Node Label Threshold');
                    } else {
                        sigmaInstance.settings('labelThreshold', 1);
                        this.props.alert.info('Always Showing Node Labels');
                    }

                    sigmaInstance.refresh({ skipIndexation: true });
                }

                this.setState({
                    ctrlDown: false,
                    otherDown: false,
                });
            }.bind(this)
        );

        //Plugin Configuration
        const dragListener = sigma.plugins.dragNodes(
            sigmaInstance,
            sigmaInstance.renderers[0]
        );

        dragListener.bind('drag', this._nodeDragged.bind(this));

        //Layout Plugins
        const forcelinkListener = sigma.layouts.configForceLink(sigmaInstance, {
            worker: true,
            background: true,
            easing: 'cubicInOut',
            autoStop: true,
            alignNodeSiblings: true,
            barnesHutOptimize: true,
            randomize: 'globally',
        });

        forcelinkListener.bind('stop', function (event) {
            emitter.emit('updateLoadingText', 'Fixing Overlap');
            sigmaInstance.startNoverlap();
        });

        forcelinkListener.bind('start', function (event) {
            emitter.emit('updateLoadingText', 'Initial Layout');
            emitter.emit('showLoadingIndicator', true);
        });

        const dagreListener = sigma.layouts.dagre.configure(sigmaInstance, {
            easing: 'cubicInOut',
            boundingBox: {
                minX: 0,
                minY: 0,
                maxX: $('#graph').outerWidth(),
                maxY: $('#graph').outerHeight(),
            },
            background: true,
            rankDir: 'LR',
        });

        dagreListener.bind('stop', (event) => {
            let needsfix = false;
            sigmaInstance.graph.nodes().forEach(function (node) {
                if (isNaN(node.x) || isNaN(node.y)) {
                    emitter.emit('updateLoadingText', 'Fixing Overlap');
                    sigmaInstance.startNoverlap();
                    needsfix = true;
                    return;
                }
            }, this);
            if (!needsfix) {
                emitter.emit('updateLoadingText', 'Done!');
                this.lockScale();
                sigma.canvas.edges.autoCurve(sigmaInstance);
                setTimeout(function () {
                    emitter.emit('showLoadingIndicator', false);
                }, 1500);
            }
        });

        dagreListener.bind('start', function (event) {
            emitter.emit('updateLoadingText', 'Initial Layout');
            emitter.emit('showLoadingIndicator', true);
        });

        // var noverlapListener = sigmaInstance.configNoverlap({
        //     nodeMargin: 5.0,
        //     easing: 'cubicInOut',
        //     gridSize: 20,
        //     permittedExpansion: 1.3
        // });
        //

        const noverlapListener = sigmaInstance.configNoverlap({});

        noverlapListener.bind('stop', (event) => {
            emitter.emit('updateLoadingText', 'Done!');
            this.lockScale();
            sigma.canvas.edges.autoCurve(sigmaInstance);
            setTimeout(function () {
                emitter.emit('showLoadingIndicator', false);
            }, 1500);
        });

        const lowgfx = appStore.performance.lowGraphics;

        design = sigma.plugins.design(sigmaInstance);
        if (lowgfx) {
            sigmaInstance.settings('defaultEdgeType', 'line');
            sigmaInstance.settings('defaultEdgeColor', 'black');
            design.setPalette(appStore.lowResPalette);
            design.setStyles(appStore.lowResStyle);
        } else {
            sigmaInstance.settings('defaultEdgeType', 'tapered');
            sigmaInstance.settings('defaultEdgeColor', '#356');
            design.setPalette(appStore.highResPalette);
            design.setStyles(appStore.highResStyle);
        }

        const mode = appStore.performance.nodeLabels;

        if (mode === 2) {
            sigmaInstance.settings('labelThreshold', 500);
        } else if (mode === 0) {
            sigmaInstance.settings('labelThreshold', 15);
        } else {
            sigmaInstance.settings('labelThreshold', 1);
        }

        this.setState({
            sigmaInstance: sigmaInstance,
            design: design,
        });
    }

    render() {
        return (
            <div className='graph'>
                <div
                    id='graph'
                    className={
                        this.state.darkMode
                            ? 'graph graph-dark'
                            : 'graph graph-light'
                    }
                />
                {this.state.nodeTooltip.visible && (
                    <NodeTooltip {...this.state.nodeTooltip} />
                )}
                {this.state.stageTooltip.visible && (
                    <StageTooltip {...this.state.stageTooltip} />
                )}
                {this.state.edgeTooltip.visible && (
                    <EdgeTooltip {...this.state.edgeTooltip} />
                )}
                <ConfirmDrawModal />
            </div>
        );
    }
}

export default withAlert()(GraphContainer);
