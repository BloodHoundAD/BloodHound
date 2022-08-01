import React, { useContext, useEffect, useState } from 'react';
import styles from './FileUploadDisplay.module.css';
import { Col, Grid, ProgressBar, Row } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { AppContext } from '../../AppContext';
import clsx from 'clsx';

const PostProcessDisplay = ({
    step,
    visible,
    adPostProcessCount,
    azPostProcessCount,
}) => {
    const [progress, setProgress] = useState(0);

    const context = useContext(AppContext);

    const totalQueries = adPostProcessCount + azPostProcessCount;

    const getStatusText = () => {
        if (step === 0) return 'Awaiting Post Processing';
        else if (step <= adPostProcessCount)
            return 'Post Processing Active Directory';
        else if (step < totalQueries) return 'Post Processing Azure';
        else if (step === totalQueries) return 'Post Processing Complete';
    };

    useEffect(() => {
        if (step === totalQueries) {
            setProgress(100);
            return;
        }
        setProgress(Math.floor((step / totalQueries) * 100));
    }, [step]);

    return (
        <motion.div
            className={clsx(
                styles.panel,
                context.darkMode ? styles.dark : styles.light,
                visible ? '' : styles.invisible
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Grid>
                <Row>
                    <Col xs={12} className={styles.fileName}>
                        Post Process
                    </Col>
                </Row>
                <Row>
                    <Col xs={8} className={styles.status}>
                        {getStatusText()}
                    </Col>
                    <Col xs={2} xsOffset={2} className={styles.status}>
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

PostProcessDisplay.propTypes = {};
export default PostProcessDisplay;
