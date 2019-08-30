import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const EdgeTooltip = ({ edge, x, y }) => {
    let label = edge.label;
    let id = edge.id;
    return (
        <div className={'new-tooltip'} style={{ left: x, top: y }}>
            <div className='header'>{label}</div>
            <ul className='tooltip-ul'>
                <li
                    onClick={() => {
                        emitter.emit('getHelp', id);
                    }}
                >
                    <i className='fa fa-question' /> Help
                </li>
                <li
                    onClick={() => {
                        emitter.emit('deleteEdge', id);
                    }}
                >
                    <i className='fa fa-trash' /> Delete Edge
                </li>
            </ul>
        </div>
    );
};

EdgeTooltip.propTypes = {};
export default EdgeTooltip;
