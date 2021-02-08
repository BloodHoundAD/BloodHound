import React from 'react';

export const AppContext = React.createContext({
    darkMode: false,
    toggleDarkMode: () => {},
    debugMode: false,
    toggleDebugMode: () => {},
    lowDetailMode: false,
    toggleLowDetailMode: () => {},
    edgeLabels: 0,
    setEdgeLabels: () => {},
    nodeLabels: 0,
    setNodeLabels: () => {},
    edgeIncluded: {},
    setEdgeIncluded: () => {},
});
