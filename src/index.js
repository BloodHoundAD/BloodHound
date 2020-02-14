import '@babel/polyfill'; // generators
import React from 'react';
import ReactDOM from 'react-dom';

import AppContainer from './AppContainer';
import Login from './components/Float/Login';
import { transitions, positions, Provider as AlertProvider } from 'react-alert';
import AlertTemplate from 'react-alert-template-basic';

import { remote, shell } from 'electron';
const { app } = remote;
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

import ConfigStore from 'electron-store';

import 'react-bootstrap-typeahead/css/Typeahead.css';

global.conf = new ConfigStore();
global.imageconf = new ConfigStore({
    name: 'images',
});
import { EventEmitter2 as e } from 'eventemitter2';
global.emitter = new e({});
emitter.setMaxListeners(0);
global.renderEmit = new e({});
global.neo4j = require('neo4j-driver').v1;
global.Mustache = require('mustache');

//open links externally by default
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

String.prototype.format = function() {
    var i = 0,
        args = arguments;
    return this.replace(/{}/g, function() {
        return typeof args[i] !== 'undefined' ? args[i++] : '';
    });
};

String.prototype.formatAll = function() {
    var args = arguments;
    return this.replace(/{}/g, args[0]);
};

String.prototype.formatn = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

String.prototype.toTitleCase = function() {
    return this.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

Array.prototype.allEdgesSameType = function() {
    for (var i = 1; i < this.length; i++) {
        if (this[i].neo4j_type !== this[0].neo4j_type) return false;
    }

    return true;
};

Array.prototype.chunk = function() {
    let i = 0;
    let len = this.length;
    let temp = [];
    let chunkSize = 10000;

    for (i = 0; i < len; i += chunkSize) {
        temp.push(this.slice(i, i + chunkSize));
    }

    return temp;
};

if (!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    };
}

sigma.renderers.def = sigma.renderers.canvas;

sigma.classes.graph.addMethod('outboundNodes', function(id) {
    return this.outNeighborsIndex.get(id).keyList();
});

sigma.classes.graph.addMethod('inboundNodes', function(id) {
    return this.inNeighborsIndex.get(id).keyList();
});

sigma.classes.graph.addMethod('outNeighbors', function(id) {
    return this.outNeighborsIndex.get(id).keyList();
});

global.appStore = {
    dagre: true,
    startNode: null,
    endNode: null,
    prebuiltQuery: [],
    highlightedEdges: [],
    spotlightData: {},
    queryStack: [],
    currentTooltip: null,
    highResPalette: {
        iconScheme: {
            User: {
                font: "'Font Awesome 5 Free'",
                content: '\uf007',
                scale: 1.5,
                color: '#17E625',
            },
            Computer: {
                font: "'Font Awesome 5 Free'",
                content: '\uF108',
                scale: 1.2,
                color: '#E67873',
            },
            Group: {
                font: "'Font Awesome 5 Free'",
                content: '\uF0C0',
                scale: 1.5,
                color: '#DBE617',
            },
            Domain: {
                font: "'Font Awesome 5 Free'",
                content: '\uF0AC',
                scale: 1.5,
                color: '#17E6B9',
            },
            OU: {
                font: "'Font Awesome 5 Free'",
                content: '\uF0E8',
                scale: 1.25,
                color: '#FFAA00',
            },
            GPO: {
                font: "'Font Awesome 5 Free'",
                content: '\uF03A',
                scale: 1.25,
                color: '#7F72FD',
            },
            Unknown: {
                font: "'Font Awesome 5 Free'",
                content: '\uF128',
                scale: 1.25,
                color: '#E6E600',
            },
        },
        edgeScheme: {
            AdminTo: 'tapered',
            MemberOf: 'tapered',
            HasSession: 'tapered',
            AllExtendedRights: 'tapered',
            ForceChangePassword: 'tapered',
            GenericAll: 'tapered',
            GenericWrite: 'tapered',
            WriteDacl: 'tapered',
            WriteOwner: 'tapered',
            AddMember: 'tapered',
            TrustedBy: 'curvedArrow',
            DCSync: 'tapered',
            Contains: 'tapered',
            GpLink: 'tapered',
            Owns: 'tapered',
            CanRDP: 'tapered',
            ExecuteDCOM: 'tapered',
            ReadLAPSPassword: 'tapered',
            AllowedToDelegate: 'tapered',
            AddAllowedToAct: 'tapered',
            AllowedToAct: 'tapered',
            GetChanges: 'tapered',
            GetChangeAll: 'tapered',
            SQLAdmin: 'tapered',
            ReadGMSAPassword: 'tapered',
            HasSIDHistory: 'tapered',
            CanPSRemote: 'tapered',
        },
    },
    lowResPalette: {
        colorScheme: {
            User: '#17E625',
            Computer: '#E67873',
            Group: '#DBE617',
            Domain: '#17E6B9',
            OU: '#FFAA00',
            GPO: '#7F72FD',
            Unknown: '#E6E600',
        },
        edgeScheme: {
            AdminTo: 'line',
            MemberOf: 'line',
            HasSession: 'line',
            AllExtendedRights: 'line',
            ForceChangePassword: 'line',
            GenericAll: 'line',
            GenericWrite: 'line',
            WriteDacl: 'line',
            WriteOwner: 'line',
            AddMember: 'line',
            TrustedBy: 'curvedArrow',
            DCSync: 'line',
            Contains: 'line',
            GpLink: 'line',
            Owns: 'line',
            CanRDP: 'line',
            ExecuteDCOM: 'line',
            ReadLAPSPassword: 'line',
            AllowedToDelegate: 'line',
            AddAllowedToAct: 'line',
            AllowedToAct: 'line',
            GetChanges: 'line',
            GetChangeAll: 'line',
            SQLAdmin: 'line',
            ReadGMSAPassword: 'line',
            HasSIDHistory: 'line',
            CanPSRemote: 'line',
        },
    },
    highResStyle: {
        nodes: {
            label: {
                by: 'label',
            },
            size: {
                by: 'degree',
                bins: 5,
                min: 10,
                max: 20,
            },
            icon: {
                by: 'type',
                scheme: 'iconScheme',
            },
        },
        edges: {
            type: {
                by: 'type',
                scheme: 'edgeScheme',
            },
            size: {
                by: 'degree',
                bins: 1,
                min: 4,
                max: 4,
            },
        },
    },
    lowResStyle: {
        nodes: {
            label: {
                by: 'label',
            },
            size: {
                by: 'degree',
                bins: 10,
                min: 10,
                max: 20,
            },
            color: {
                by: 'type',
                scheme: 'colorScheme',
            },
        },
        edges: {
            type: {
                by: 'type',
                scheme: 'edgeScheme',
            },
            size: {
                by: 'degree',
                bins: 1,
                min: 4,
                max: 4,
            },
        },
    },
};

if (typeof conf.get('performance') === 'undefined') {
    conf.set('performance', {
        edge: 5,
        lowGraphics: false,
        nodeLabels: 0,
        edgeLabels: 0,
        darkMode: false,
    });
}

if (typeof conf.get('edgeincluded') === 'undefined') {
    conf.set('edgeincluded', {
        MemberOf: true,
        HasSession: true,
        AdminTo: true,
        AllExtendedRights: true,
        AddMember: true,
        ForceChangePassword: true,
        GenericAll: true,
        GenericWrite: true,
        Owns: true,
        WriteDacl: true,
        WriteOwner: true,
        CanRDP: true,
        ExecuteDCOM: true,
        AllowedToDelegate: true,
        ReadLAPSPassword: true,
        Contains: true,
        GpLink: true,
        AddAllowedToAct: true,
        AllowedToAct: true,
        SQLAdmin: true,
        ReadGMSAPassword: true,
        HasSIDHistory: true,
        CanPSRemote: true,
    });
}

const alertOptions = {
    position: positions.TOP_CENTER,
    timeout: 5000,
    offset: '30px',
    transitions: transitions.FADE,
    containerStyle: {
        zIndex: 100,
        width: '25%',
    },
};

appStore.edgeincluded = conf.get('edgeincluded');
//Code to add new edges to filter
if (!appStore.edgeincluded.hasOwnProperty('AddAllowedToAct')) {
    appStore.edgeincluded.AddAllowedToAct = true;
    conf.set('edgeincluded', appStore.edgeincluded);
}

if (!appStore.edgeincluded.hasOwnProperty('AllowedToAct')) {
    appStore.edgeincluded.AllowedToAct = true;
    conf.set('edgeincluded', appStore.edgeincluded);
}

if (!appStore.edgeincluded.hasOwnProperty('SQLAdmin')) {
    appStore.edgeincluded.SQLAdmin = true;
    conf.set('edgeincluded', appStore.edgeincluded);
}

if (!appStore.edgeincluded.hasOwnProperty('ReadGMSAPassword')) {
    appStore.edgeincluded.ReadGMSAPassword = true;
    conf.set('edgeincluded', appStore.edgeincluded);
}

if (!appStore.edgeincluded.hasOwnProperty('HasSIDHistory')) {
    appStore.edgeincluded.HasSIDHistory = true;
    conf.set('edgeincluded', appStore.edgeincluded);
}

if (!appStore.edgeincluded.hasOwnProperty('CanPSRemote')) {
    appStore.edgeincluded.HasSIDHistory = true;
    conf.set('edgeincluded', appStore.edgeincluded);
}

// if (!appStore.edgeincluded.hasOwnProperty("ReadLAPSPassword")) {
//     appStore.edgeincluded.ReadLAPSPassword = true;
//     conf.set("edgeincluded", appStore.edgeincluded)
// }

appStore.performance = conf.get('performance');

if (typeof appStore.performance.edgeLabels === 'undefined') {
    appStore.performance.edgeLabels = 0;
    conf.set('performance', appStore.performance);
}

if (typeof appStore.performance.darkMode === 'undefined') {
    appStore.performance.darkMode = false;
    conf.set('performance', appStore.performance);
}

var custompath = join(app.getPath('userData'), 'customqueries.json');
if (!existsSync(custompath)) {
    writeFileSync(custompath, '{"queries": []}');
}

let imagepath = join(app.getPath('userData'), 'images');
if (!existsSync(imagepath)) {
    mkdirSync(imagepath);
}

global.closeTooltip = function() {
    emitter.emit('closeTooltip');
};

renderEmit.on('login', function() {
    emitter.removeAllListeners();
    ReactDOM.unmountComponentAtNode(document.getElementById('root'));
    let Root = () => (
        <AlertProvider
            id='alertContainer'
            template={AlertTemplate}
            {...alertOptions}
        >
            <AppContainer />
        </AlertProvider>
    );
    ReactDOM.render(<Root />, document.getElementById('root'));
});

renderEmit.on('logout', function() {
    emitter.removeAllListeners();
    ReactDOM.unmountComponentAtNode(document.getElementById('root'));
    ReactDOM.render(<Login />, document.getElementById('root'));
});

ReactDOM.render(<Login />, document.getElementById('root'));
