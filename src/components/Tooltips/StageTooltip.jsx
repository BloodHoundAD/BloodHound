import React, { useEffect } from 'react';

const StageTooltip = ({ x, y }) => {
    return (
        <div className={'new-tooltip'} style={{ left: x, top: y }}>
            <div className='header'>Graph Options</div>
            <ul className='tooltip-ul'>
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
