import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import PoseContainer from '../PoseContainer';
import Draggable from 'react-draggable';
import styles from './ExportContainer.module.css';
import { Panel, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import { AppContext } from '../../AppContext';
import clsx from 'clsx';
import { useDragControls } from 'framer-motion';

const ExportContainer = () => {
    const [jsonActive, setJsonActive] = useState(true);
    const [imageActive, setImageActive] = useState(false);
    const [visible, setVisible] = useState(false);
    const dragControl = useDragControls();

    const context = useContext(AppContext);

    const handleShow = () => {
        closeTooltip();
        setVisible(true);
    };

    const handleClose = () => {
        setVisible(false);
    };

    const jsonClicked = () => {
        setJsonActive(true);
        setImageActive(false);
    };

    const imageClicked = () => {
        setJsonActive(false);
        setImageActive(true);
    };

    const startExport = () => {
        emitter.emit('export', jsonActive ? 'json' : 'image');
    };

    useEffect(() => {
        emitter.on('showExport', handleShow);
        return () => {
            emitter.removeListener('showExport', handleShow);
        };
    }, []);

    return (
        <PoseContainer
            visible={visible}
            className={clsx(
                styles.container,
                context.darkMode ? styles.dark : null
            )}
            dragHandle={dragControl}
        >
            <Panel>
                <Panel.Heading onMouseDown={(e) => dragControl.start(e)}>
                    Export Graph
                    <Button
                        onClick={handleClose}
                        className='close'
                        aria-label='Close'
                    >
                        <span aria-hidden='true'>&times;</span>
                    </Button>
                </Panel.Heading>

                <Panel.Body>
                    <ListGroup>
                        <ListGroupItem
                            header={'Export to JSON'}
                            onClick={jsonClicked}
                            active={jsonActive}
                        >
                            Use this format to export data and re-import it
                            later
                        </ListGroupItem>
                        <ListGroupItem
                            header={'Export to Image'}
                            onClick={imageClicked}
                            active={imageActive}
                        >
                            Use this format to export data and view it as an
                            image
                        </ListGroupItem>
                    </ListGroup>
                    <div className={styles.centerButton}>
                        <Button onClick={startExport} size={'lg'}>
                            Export Data
                        </Button>
                    </div>
                </Panel.Body>
            </Panel>
        </PoseContainer>
    );
};

ExportContainer.propTypes = {};
export default ExportContainer;
