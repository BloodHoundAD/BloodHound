import 'babel-polyfill'; // generators
import React from 'react';
import ReactDOM from 'react-dom';

import AppContainer from './components/appcontainer';
import { getStorageData, storageHasKey, storageSetKey } from './js/utils.js';

const ConfigStore = require('configstore');

global.conf = new ConfigStore('bloodhound')
var e = require('eventemitter2').EventEmitter2
global.emitter = new e({})


String.prototype.format = function () {
  var i = 0, args = arguments;
  return this.replace(/{}/g, function () {
    return typeof args[i] != 'undefined' ? args[i++] : '';
  });
};


Array.prototype.allEdgesSameType = function() {

    for (var i = 1; i < this.length; i++) {
        if (this[i].neo4j_type !== this[0].neo4j_type)
            return false;
    }

    return true;
};

global.appStore = {
	startNode: null,
	endNode: null,
	reversePath: [],
	forwardPath: [],
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
        }
	},
	lowResPalette: {
		colorScheme: {
			'User' : '#17E625',
			'Computer' : '#E67873',
			'Group' : '#DBE617',
			'Domain' : '#17E6B9'
		}
	},
	highResStyle: {
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
	},
	lowResStyle: {
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
			color: {
				by: 'neo4j_labels.0',
				scheme: 'colorScheme'
			}
		}	
	}
}

if (typeof conf.get('performance') === 'undefined'){
	conf.set('performance', {
		edge: 5,
		sibling: 5,
		lowGraphics: false
	})
}

if (typeof conf.get('databaseInfo') === 'undefined'){
	conf.set('databaseInfo', {
		url: 'http://localhost:7474',
		user: 'neo4j',
		password: 'neo4jj'
	})
}

appStore.performance = conf.get('performance')
appStore.databaseInfo = conf.get('databaseInfo');

ReactDOM.render(<AppContainer />, document.getElementById('root'))