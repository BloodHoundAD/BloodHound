import React, {useContext, useEffect, useState} from 'react';
import styles from './FileUploadDisplay.module.css';
import {Col, Grid, ProgressBar, Row,} from 'react-bootstrap';
import {motion} from 'framer-motion';
import {AppContext} from '../../AppContext';
import clsx from 'clsx';

const FileStatus = Object.freeze({
    ParseError: 0,
    InvalidVersion: 1,
    BadType: 2,
    Waiting: 3,
    Processing: 4,
    Done: 5,
    NoData: 6,
});

const FileUploadDisplay = ({ file }) => {
    const [progress, setProgress] = useState(0);

    const context = useContext(AppContext);

    const getStatusText = () => {
        let status = file.status;
        if (status === FileStatus.BadType) {
            return 'Invalid File Type';
        } else if (status === FileStatus.ParseError) {
            return 'Error parsing JSON (Malformed)';
        } else if (status === FileStatus.Done) {
            return 'Upload Complete';
        } else if (status === FileStatus.InvalidVersion) {
            return 'File created from incompatible collector';
        } else if (status === FileStatus.Waiting) {
            return 'Waiting for upload';
        } else if (status === FileStatus.Processing) {
            return 'Uploading Data';
        } else if (status === FileStatus.NoData) {
            return 'No Data In File';
        }
    };

    useEffect(() => {
        if (file.count === 0) {
            setProgress(100);
            return;
        } else if (file.progress > file.count) {
            setProgress(100);
            return;
        }
        setProgress(Math.floor((file.progress / file.count) * 100));
    }, [file.progress]);

    return (
        <motion.div
            className={clsx(
                styles.panel,
                context.darkMode ? styles.dark : styles.light
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Grid>
                <Row>
                    <Col xs={12} className={styles.fileName}>
                        {file.name}
                    </Col>
                </Row>
                <Row>
                    <Col xs={6} className={styles.status}>
                        {getStatusText()}
                    </Col>
                    <Col xs={2} xsOffset={4} className={styles.status}>
                        {`${progress}%`}
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <ProgressBar
                            className={styles.progressBar}
                            active={progress < 100}
                            now={progress}
                            label={`${progress}%`}
                        />
                    </Col>
                </Row>
            </Grid>
        </motion.div>
    );
};

FileUploadDisplay.propTypes = {};
export default FileUploadDisplay;
