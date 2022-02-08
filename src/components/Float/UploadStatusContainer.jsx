import React from 'react';
import PoseContainer from '../PoseContainer';
import styles from './UploadStatusContainer.module.css';
import clsx from 'clsx';
import { useContext } from 'react';
import { AppContext } from '../../AppContext';
import { Button, Grid, Row, Col } from 'react-bootstrap';
import FileUploadDisplay from './FileUploadDisplay';
import { AnimatePresence, useDragControls } from 'framer-motion';

const UploadStatusContainer = ({ files, clearFinished, open, close }) => {
    const dragControl = useDragControls();

    let context = useContext(AppContext);

    return (
        <PoseContainer
            visible={open}
            className={clsx(
                styles.panel,
                context.darkMode ? styles.dark : styles.light
            )}
            dragHandle={dragControl}
        >
            <div className={styles.content}>
                <div
                    className={styles.header}
                    onMouseDown={(e) => dragControl.start(e)}
                >
                    <Grid fluid className={styles.cheight}>
                        <Row>
                            <Col xs={8}>Upload Progress</Col>
                            <Col xs={3}></Col>
                            <Col xs={1}>
                                <Button
                                    onClick={close}
                                    className={styles.closeButton}
                                    aria-label='Close'
                                >
                                    <span aria-hidden='true'>&times;</span>
                                </Button>
                            </Col>
                        </Row>
                    </Grid>
                </div>
                <AnimatePresence>
                    <div className={styles.uploads}>
                        {Object.keys(files).map((key) => {
                            return (
                                <FileUploadDisplay
                                    key={key}
                                    file={files[key]}
                                />
                            );
                        })}
                    </div>
                </AnimatePresence>
                <div className={styles.footer}>
                    <Button onClick={clearFinished}>Clear Finished</Button>
                </div>
            </div>
        </PoseContainer>
    );
};

UploadStatusContainer.propTypes = {};
export default UploadStatusContainer;
