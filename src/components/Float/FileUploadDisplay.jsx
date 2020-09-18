import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './FileUploadDisplay.module.css';
import {
    Button,
    Panel,
    Table,
    Grid,
    Row,
    Col,
    ProgressBar,
} from 'react-bootstrap';
import { motion } from 'framer-motion';

const FileStatus = Object.freeze({
    ParseError: 0,
    InvalidVersion: 1,
    BadType: 2,
    Waiting: 3,
    Processing: 4,
    Done: 5,
});

const FileUploadDisplay = ({ file }) => {
    const [progress, setProgress] = useState(0);
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
        }
    };

    useEffect(() => {
        if (file.count === 0) {
            setProgress(100);
        } else if (file.progress > file.count) {
            setProgress(100);
        }
        setProgress(Math.floor((file.progress / file.count) * 100));
    }, [file.progress]);

    return (
        <motion.div
            className={styles.panel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Grid fluid>
                <Row>
                    <Col xs={3} xsOffset={1} className={styles.fileName}>
                        {file.name}
                    </Col>
                </Row>
                <Row>
                    <Col xs={6} xsOffset={1} className={styles.status}>
                        {getStatusText()}
                    </Col>
                    <Col xs={2} xsOffset={3} className={styles.status}>
                        {`${progress}%`}
                    </Col>
                </Row>
                <Row>
                    <Col xsOffset={1} xs={10}>
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
