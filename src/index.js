import 'babel-polyfill'; // generators
import React from 'react';
import ReactDOM from 'react-dom';

import AppContainer from './AppContainer';
import Login from './components/Float/Login'
import { getStorageData, storageHasKey, storageSetKey } from './js/utils.js';

const { app } = require('electron').remote
var fs = require('fs')
const path = require('path');

const ConfigStore = require('configstore');

global.conf = new ConfigStore('bloodhound')
var e = require('eventemitter2').EventEmitter2
global.emitter = new e({})
global.renderEmit = new e({})
global.neo4j = require('neo4j-driver').v1;

global.Mustache = require('mustache')

String.prototype.format = function() {
    var i = 0,
        args = arguments;
    return this.replace(/{}/g, function() {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

String.prototype.formatAll = function() {
    var args = arguments;
    return this.replace(/{}/g, args[0]);
};

String.prototype.toTitleCase = function() {
    return this.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};

Array.prototype.allEdgesSameType = function() {

    for (var i = 1; i < this.length; i++) {
        if (this[i].neo4j_type !== this[0].neo4j_type)
            return false;
    }

    return true;
};

if (!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    };
};

sigma.renderers.def = sigma.renderers.canvas;

sigma.classes.graph.addMethod('outboundNodes', function(id) {
    return this.outNeighborsIndex.get(id).keyList();
});

sigma.classes.graph.addMethod('inboundNodes', function(id) {
    return this.inNeighborsIndex.get(id).keyList();
});

global.appStore = {
    dagre: false,
    startNode: null,
    endNode: null,
    highlightedEdges: [],
    spotlightData: {},
    queryStack: [],
    currentTooltip: null,
    highResPalette: {
        iconScheme: {
            'User': {
                font: 'FontAwesome',
                content: '\uF007',
                scale: 1.5,
                color: '#17E625'
            },
            'Computer': {
                font: 'FontAwesome',
                content: '\uF108',
                scale: 1.2,
                color: '#E67873'
            },
            'Group': {
                font: 'FontAwesome',
                content: '\uF0C0',
                scale: 1.5,
                color: '#DBE617'
            },
            'Domain': {
                font: 'FontAwesome',
                content: '\uF0AC',
                scale: 1.5,
                color: '#17E6B9'
            }
        },
        edgeScheme: {
            'AdminTo': 'tapered',
            'MemberOf': 'tapered',
            'HasSession': 'tapered',
            'AllExtendedRights': 'tapered',
            'ForceChangePassword': 'tapered',
            'GenericAll': 'tapered',
            'GenericWrite': 'tapered',
            'WriteDACL': 'tapered',
            'WriteOwner': 'tapered',
            'AddMembers': 'tapered',
            'TrustedBy': 'curvedArrow'
        }
    },
    lowResPalette: {
        colorScheme: {
            'User': '#17E625',
            'Computer': '#E67873',
            'Group': '#DBE617',
            'Domain': '#17E6B9'
        },
        edgeScheme: {
            'AdminTo': 'line',
            'MemberOf': 'line',
            'HasSession': 'line',
            'AllExtendedRights': 'line',
            'ForceChangePassword': 'line',
            'GenericAll': 'line',
            'GenericWrite': 'line',
            'WriteDACL': 'line',
            'WriteOwner': 'line',
            'AddMembers': 'line',
            'TrustedBy': 'curvedArrow'
        }
    },
    highResStyle: {
        nodes: {
            label: {
                by: 'label'
            },
            size: {
                by: 'degree',
                bins: 5,
                min: 10,
                max: 20
            },
            icon: {
                by: 'type',
                scheme: 'iconScheme'
            }
        },
        edges: {
            type: {
                by: 'type',
                scheme: 'edgeScheme'
            }
        }
    },
    lowResStyle: {
        nodes: {
            label: {
                by: 'label'
            },
            size: {
                by: 'degree',
                bins: 10,
                min: 10,
                max: 20
            },
            color: {
                by: 'type',
                scheme: 'colorScheme'
            }
        },
        edges: {
            type: {
                by: 'type',
                scheme: 'edgeScheme'
            }
        }
    }
}

if (typeof conf.get('performance') === 'undefined') {
    conf.set('performance', {
        edge: 5,
        sibling: 10,
        lowGraphics: false,
        nodeLabels: 1
    })
}

var custompath = path.join(app.getPath('userData'), 'customqueries.json')

fs.stat(custompath, function(err, stats) {
    if (err) {
        fs.writeFile(custompath, "[]")
    }
})

appStore.performance = conf.get('performance')

renderEmit.on('login', function() {
    emitter.removeAllListeners()
    ReactDOM.unmountComponentAtNode(document.getElementById('root'))
    ReactDOM.render( < AppContainer / > , document.getElementById('root'))
})

renderEmit.on('logout', function() {
    emitter.removeAllListeners()
    ReactDOM.unmountComponentAtNode(document.getElementById('root'))
    ReactDOM.render( < Login / > , document.getElementById('root'))
})

ReactDOM.render( < Login / > , document.getElementById('root'))