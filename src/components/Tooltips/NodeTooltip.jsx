import React, { useEffect, useRef, useState } from 'react';
import { If, Then, Else } from 'react-if';

const NodeTooltip = ({ node, x, y }) => {
    //console.log(node);
    let type = node.type;
    let label = node.label;
    let guid = node.guid;
    let id = node.id;
    let targetSpec = type === 'OU' ? '{guid:{guid}}' : '{name:{name}}';
    let target = type === 'OU' ? { guid: guid } : { name: label };
    let targetProp = type === 'OU' ? guid : label;

    const [realX, setRealX] = useState(0);
    const [realY, setRealY] = useState(0);

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
            className={'new-tooltip'}
            style={{
                left: realX === 0 ? x : realX,
                top: realY === 0 ? y : realY,
            }}
        >
            <div className='header'>{label}</div>
            <ul className='tooltip-ul'>
                <If condition={type === 'OU'}>
                    <Then>
                        <li
                            onClick={() => {
                                emitter.emit('setStart', `${type}:${guid}`);
                            }}
                        >
                            <i className='fa fa-map-marker-alt' /> Set as
                            Starting Node
                        </li>
                        <li
                            onClick={() => {
                                emitter.emit('setEnd', `${type}:${guid}`);
                            }}
                        >
                            <i className='fa fa-bullseye' /> Set as Ending Node
                        </li>
                    </Then>
                    <Else>
                        <li
                            onClick={() => {
                                emitter.emit('setStart', `${type}:${label}`);
                            }}
                        >
                            <i className='fa fa-map-marker-alt' /> Set as
                            Starting Node
                        </li>
                        <li
                            onClick={() => {
                                emitter.emit('setEnd', `${type}:${label}`);
                            }}
                        >
                            <i className='fa fa-bullseye' /> Set as Ending Node
                        </li>
                    </Else>
                </If>
                <li
                    onClick={() => {
                        emitter.emit(
                            'query',
                            `MATCH (n:${type} ${targetSpec}), (m), p=shortestPath((m)-[r:{}*1..]->(n)) WHERE NOT m=n RETURN p`,
                            target,
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
                            `MATCH (n:${type} ${targetSpec}), (m {owned: true}), p=shortestPath((m)-[r:{}*1..]->(n)) WHERE NOT m=n RETURN p`,
                            target,
                            label
                        );
                    }}
                >
                    <i className='fa fa-random' /> Shortest Paths to Here from
                    Owned
                </li>
                <li
                    onClick={() => {
                        emitter.emit('editnode', targetProp, type);
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
                {node.expand && (
                    <li
                        onClick={() => {
                            emitter.emit('unfoldNode', id);
                        }}
                    >
                        <i className='fa fa-object-ungroup' /> Expand
                    </li>
                )}
                {node.collapse && (
                    <li
                        onClick={() => {
                            emitter.emit('collapseNode', id);
                        }}
                    >
                        <i className='fa fa-object-group' /> Collapse
                    </li>
                )}
                {node.groupedNode && (
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
