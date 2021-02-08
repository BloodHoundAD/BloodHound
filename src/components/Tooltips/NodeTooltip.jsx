import React, { useEffect, useRef, useState, useContext } from 'react';
import { If, Then, Else } from 'react-if';
import styles from './Tooltips.module.css';
import clsx from 'clsx';
import { AppContext } from '../../AppContext';

const NodeTooltip = ({ node, x, y }) => {
    let type = node.type;
    let label = node.label;
    let id = node.id;
    let objectid = node.objectid;

    const [realX, setRealX] = useState(0);
    const [realY, setRealY] = useState(0);

    const context = useContext(AppContext);

    const tooltipDiv = useRef(null);

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
            <div>{label}</div>
            <ul>
                <li
                    onClick={() => {
                        emitter.emit('setStart', node);
                    }}
                >
                    <i className='fa fa-map-marker-alt' /> Set as
                    Starting Node
                </li>
                <li
                    onClick={() => {
                        emitter.emit('setEnd', node);
                    }}
                >
                    <i className='fa fa-bullseye' /> Set as Ending Node
                </li>
                <li
                    onClick={() => {
                        emitter.emit(
                            'query',
                            `MATCH (n:${type} {objectid: $objectid}), (m), p=shortestPath((m)-[r*1..]->(n)) WHERE NOT m=n RETURN p`,
                            { objectid: objectid },
                            label
                        );
                    }}
                >
                    <i className='fa fa-random' /> Shortest Paths to Here
                </li>
                <li
                    onClick={() => {
                        emitter.emit(
                            'query',
                            `MATCH (n:${type} {objectid: $objectid}), (m {owned: true}), p=shortestPath((m)-[r:{}*1..]->(n)) WHERE NOT m=n RETURN p`,
                            { objectid: objectid },
                            label
                        );
                    }}
                >
                    <i className='fa fa-random' /> Shortest Paths to Here from
                    Owned
                </li>
                <li
                    onClick={() => {
                        emitter.emit('editnode', node);
                        closeTooltip();
                    }}
                >
                    <i className='fa fa-edit' />
                    Edit Node
                </li>
                <If condition={node.owned === true}>
                    <Then>
                        <li
                            onClick={() => {
                                emitter.emit('setOwned', id, false);
                            }}
                        >
                            <i className='fa fa-exclamation' /> Unmark {type} as
                            Owned
                        </li>
                    </Then>
                    <Else>
                        <li
                            onClick={() => {
                                emitter.emit('setOwned', id, true);
                            }}
                        >
                            <i className='fa fa-exclamation' /> Mark {type} as
                            Owned
                        </li>
                    </Else>
                </If>
                <If condition={node.highvalue === true}>
                    <Then>
                        <li
                            onClick={() => {
                                emitter.emit('setHighVal', id, false);
                            }}
                        >
                            <i className='fa fa-gem' /> Unmark {type} as High
                            Value
                        </li>
                    </Then>
                    <Else>
                        <li
                            onClick={() => {
                                emitter.emit('setHighVal', id, true);
                            }}
                        >
                            <i className='fa fa-gem' /> Mark {type} as High
                            Value
                        </li>
                    </Else>
                </If>
                <li
                    onClick={() => {
                        emitter.emit('deleteNode', id);
                    }}
                >
                    <i className='fa fa-trash' /> Delete Node
                </li>
                {node.isGrouped && (
                    <li
                        onClick={() => {
                            emitter.emit('ungroupNode', id);
                        }}
                    >
                        <i className='fa fa-object-ungroup' /> Expand
                    </li>
                )}
            </ul>
        </div>
    );
};

export default NodeTooltip;
