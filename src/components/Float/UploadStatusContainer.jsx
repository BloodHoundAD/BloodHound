import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import PoseContainer from '../PoseContainer';
import styles from './UploadStatusContainer.module.css';
import clsx from 'clsx';
import { useContext } from 'react';
import { AppContext } from '../../AppContext';
import { Button, Panel, Table } from 'react-bootstrap';
import FileUploadDisplay from './FileUploadDisplay';
import { AnimatePresence, useDragControls } from 'framer-motion';

const UploadStatusContainer = ({ files }) => {
    const [open, setOpen] = useState(true);
    const dragControl = useDragControls();
    var context = useContext(AppContext);
    return (
        <PoseContainer
            visible={open}
            className={clsx(
                styles.panel,
                context.darkMode ? styles.dark : null
            )}
            dragHandle={dragControl}
        >
            <div className={styles.content}>
                <div
                    className={styles.header}
                    onMouseDown={(e) => dragControl.start(e)}
                >
                    Upload Status
                    <Button
                        onClick={() => setOpen(false)}
                        className={styles.close}
                        aria-label='Close'
                    >
                        <span aria-hidden='true'>&times;</span>
                    </Button>
                </div>
                <AnimatePresence>
                    {Object.keys(files).map((key) => {
                        return (
                            <FileUploadDisplay key={key} file={files[key]} />
                        );
                    })}
                </AnimatePresence>
            </div>
        </PoseContainer>
    );
};

UploadStatusContainer.propTypes = {};
export default UploadStatusContainer;
