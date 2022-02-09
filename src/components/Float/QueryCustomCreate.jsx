import React, {useContext, useEffect, useState} from 'react';
import {Button, Col, ControlLabel, FormGroup, Panel, Row} from 'react-bootstrap';
import {Typeahead} from 'react-bootstrap-typeahead';
import styles from './QueryCustomCreate.module.css';
import clsx from 'clsx';
import {AppContext} from '../../AppContext';
import PoseContainer from '../PoseContainer';
import {useDragControls} from 'framer-motion';

import {remote} from 'electron';
import path from 'path';
import fs from 'fs';

const { app } = remote;

const QueryCustomCreate = () => {
    const [nodeCollapse, setNodeCollapse] = useState(appStore.performance.edge);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const dragControl = useDragControls();
    const [categories, setCategories] = useState([]);
    const [singleSelections, setSingleSelections] = useState([]);
    const [queryName, setQueryName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const context = useContext(AppContext);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const changeNodeCollapse = (e) => {
        let val = parseInt(e.target.value);
        setNodeCollapse(val);
        appStore.performance.edge = val;
        conf.set('performance', appStore.performance);
    };

    const edgeLabelChange = (e) => {
        let val = parseInt(e.target.value);
        context.setEdgeLabels(val);
    };

    const nodeLabelChange = (e) => {
        let val = parseInt(e.target.value);
        context.setNodeLabels(val);
    };

    const onKeyDown = (e) => {
        let key = e.keyCode ? e.keyCode : e.which;

        if (key === 13) {
            emitter.emit('query', query);
        }
    };

    const runQuery = () => {
        emitter.emit('query', query);
    }

    const saveQuery = () => {

        let filePath = path.join(
            app.getPath('userData'),
            '/customqueries.json'
        );

        fs.readFile(filePath, 'utf8', (err, data) => {
            let j = JSON.parse(data);
            j.queries.push({ "name": queryName, "category": selectedCategory, "queryList": [{ "final": true, "query": query, "allowCollapse": true }] })
            fs.writeFile(filePath, JSON.stringify(j, null, "\t"), function (err) { emitter.emit('updateCustomQueries'); })
        });

        setSingleSelections([]);
        setSelectedCategory('');
        setQueryName('');
        setQuery('');
        handleClose();
    };

    const onChange = (e) => {
        setQuery(e.target.value);
    };

    const registerCategories = (e) => {
        let tempCategories = categories;
        for (let queryCategory in e) {
            if (['last', 'chunk', 'allEdgesSameType'].includes(queryCategory) || categories.includes(queryCategory)) {
                continue;
            }
            tempCategories.push(queryCategory);
        }
        setCategories(tempCategories);
    }

    useEffect(() => {
        emitter.on('openQueryCreate', handleOpen);
        emitter.on('registerQueryCategories', registerCategories);
        return () => {
            emitter.removeListener('openQueryCreate', handleOpen);
            emitter.removeListener('registerQueryCategories', registerCategories);
        };
    }, []);

    return (
        <PoseContainer
            visible={open}
            className={clsx(
                styles.container,
                context.darkMode ? styles.dark : null
            )}
            dragHandle={dragControl}
        >
            <Panel
                style={{ width: "800px" }}
            >
                <Panel.Heading
                    onMouseDown={(e) => {
                        dragControl.start(e);
                    }}
                >
                    Create Custom Query
                    <Button
                        onClick={handleClose}
                        className='close'
                        aria-label='close'
                    >
                        <span aria-hidden='true'>&times;</span>
                    </Button>
                </Panel.Heading>

                <Panel.Body>
                    <FormGroup>
                        <Row>
                            <Col componentClass={ControlLabel} sm={6}>
                                <input
                                    id='queryName'
                                    type='text'
                                    className={clsx('form-control')}
                                    value={queryName}
                                    autoComplete='off'
                                    placeholder='Name your query.'
                                    onChange={event => setQueryName(event.target.value)}
                                />
                            </Col>
                            <Col componentClass={ControlLabel} sm={1}>

                            </Col>
                            <Col componentClass={ControlLabel} sm={5}>
                                <Typeahead
                                    placeholder='Select query category'
                                    onChange={setSingleSelections}
                                    options={categories}
                                    selected={singleSelections}
                                    maxHeight={100}
                                    onBlur={event => setSelectedCategory(event.target.defaultValue)}
                                />
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Col componentClass={ControlLabel} sm={11}>
                                <input
                                    type='text'
                                    onKeyDown={onKeyDown}
                                    onChange={onChange}
                                    value={query}
                                    className={clsx(styles.input, 'form-control')}
                                    autoComplete='off'
                                    placeholder='Enter a cypher query. Your query must return nodes or paths.'
                                />
                            </Col>
                            <Col componentClass={ControlLabel} style={{ margin: "auto", cursor: "pointer"}} sm={1}>
                                <i className="fa fa-play fa-2x" onClick={runQuery}/>
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Col componentClass={ControlLabel} sm={2}>
                                <Button
                                    onClick={handleClose}
                                >
                                    Cancel
                                </Button>
                            </Col>
                            <Col componentClass={ControlLabel} sm={8}>

                            </Col>
                            <Col
                                componentClass={ControlLabel}
                                style={{textAlign: "right"}}
                                sm={2}
                            >
                                <Button
                                    onClick={saveQuery}
                                >
                                    Save
                                </Button>
                            </Col>
                        </Row>
                    </FormGroup>
                </Panel.Body>
            </Panel>
        </PoseContainer>
    );
};

QueryCustomCreate.propTypes = {};
export default QueryCustomCreate;
