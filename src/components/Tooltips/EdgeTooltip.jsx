import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const EdgeTooltip = ({ edge, x, y }) => {
    let label = edge.label;
    let id = edge.id;

    const tooltipDiv = useRef(null);

    const [realX, setRealX] = useState(0);
    const [realY, setRealY] = useState(0);

    useEffect(() => {
        let rect = tooltipDiv.current.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) {
            x = window.innerWidth - rect.width - 10;
        }

        if (y + rect.height > window.innerHeight) {
            y = window.innerHeight - rect.height - 10;
        }

        setRealX(x);
        setRealY(y);
    }, [x, y]);

    return (
        <div
            ref={tooltipDiv}
            className={'new-tooltip'}
            style={{
                left: realX === 0 ? x : realX,
                top: realY === 0 ? y : realY,
            }}
        >
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
