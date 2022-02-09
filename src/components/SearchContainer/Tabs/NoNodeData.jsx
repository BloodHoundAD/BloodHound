import React from 'react';
import { useContext } from 'react';
import { AppContext } from '../../../AppContext';

const NoNodeData = ({ visible }) => {
    const context = useContext(AppContext);
    return (
        <div
            style={{ color: context.darkMode ? 'white' : 'black' }}
            className={visible ? '' : 'hidden'}
        >
            <h3>Node Properties</h3>
            <p style={{ marginLeft: 10 }}>Select a node for more information</p>
        </div>
    );
};

NoNodeData.propTypes = {};
export default NoNodeData;
