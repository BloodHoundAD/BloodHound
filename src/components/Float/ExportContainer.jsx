import React, {useContext, useEffect, useState} from 'react';
import PoseContainer from '../PoseContainer';
import styles from './ExportContainer.module.css';
import {Button, Panel, Table} from 'react-bootstrap';
import {AppContext} from '../../AppContext';
import clsx from 'clsx';
import {useDragControls} from 'framer-motion';

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

    const startPNGExport = () => {
        emitter.emit('export', 'image');
    };

    const startJSONExport = () => {
        emitter.emit('export', 'json');
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
                        <span aria-hidden='true'>x</span>
                    </Button>
                </Panel.Heading>

                <Panel.Body>
                    <div
                        className={
                            context.darkMode ? styles.itemlistdark : null
                        }
                    >
                        <Table>
                            <thead></thead>
                            <tbody className='searchable'>
                                <tr
                                    style={{ cursor: 'pointer' }}
                                    onClick={startJSONExport}
                                >
                                    <td width='200px' align='center'>
                                        Export to JSON
                                    </td>
                                </tr>
                                <tr
                                    style={{ cursor: 'pointer' }}
                                    onClick={startPNGExport}
                                >
                                    <td width='200px' align='center'>
                                        Export to PNG
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </Panel.Body>
            </Panel>
        </PoseContainer>
    );
};

ExportContainer.propTypes = {};
export default ExportContainer;
