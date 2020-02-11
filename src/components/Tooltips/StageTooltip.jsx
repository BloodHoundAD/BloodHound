import React, { useEffect, useRef, useState, useContext } from 'react';
import { AppContext } from '../../AppContext';
import styles from './Tooltips.module.css';
import clsx from 'clsx';

const StageTooltip = ({ x, y }) => {
    const tooltipDiv = useRef(null);

    const [realX, setRealX] = useState(0);
    const [realY, setRealY] = useState(0);
    const context = useContext(AppContext);

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
            className={clsx(
                styles.tooltip,
                context.darkMode ? styles.dark : null
            )}
            style={{
                left: realX === 0 ? x : realX,
                top: realY === 0 ? y : realY,
            }}
        >
            <div>Graph Options</div>
            <ul>
                <li
                    onClick={() => {
                        emitter.emit('addNode');
                    }}
                >
                    <i className='fa fa-plus' /> Add Node
                </li>
                <li
                    onClick={() => {
                        emitter.emit('addEdge');
                    }}
                >
                    <i className='fa fa-arrow-right' /> Add Edge
                </li>
                <li
                    onClick={() => {
                        emitter.emit('graphRefresh');
                    }}
                >
                    <i className='fa fa-sync-alt' /> Refresh Layout
                </li>
                <li
                    onClick={() => {
                        emitter.emit('graphReload');
                    }}
                >
                    <i className='fa fa-retweet' /> Reload Query
                </li>
                <li
                    onClick={() => {
                        emitter.emit('changeLayout');
                    }}
                >
                    <i className='fa fa-chart-line' /> Change Layout
                </li>
                <li
                    onClick={() => {
                        emitter.emit('importShim');
                    }}
                >
                    <i className='fa fa-download' /> Import Graph
                </li>
                <li
                    onClick={() => {
                        emitter.emit('showExport');
                    }}
                >
                    <i className='fa fa-upload' /> Export Graph
                </li>
            </ul>
        </div>
    );
};

StageTooltip.propTypes = {};
export default StageTooltip;
