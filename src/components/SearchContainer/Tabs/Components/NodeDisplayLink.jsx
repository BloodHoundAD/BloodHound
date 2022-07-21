import React from 'react';

const NodeDisplayLink = ({ title, value, graphQuery, queryProps }) => {
    return (
        <tr
            style={{ cursor: 'pointer' }}
            onClick={() => {
                emitter.emit('query', graphQuery, queryProps);
            }}
        >
            <td align={'left'}>{title}</td>
            <td align={'right'}>{value}</td>
        </tr>
    );
};

export default NodeDisplayLink;
