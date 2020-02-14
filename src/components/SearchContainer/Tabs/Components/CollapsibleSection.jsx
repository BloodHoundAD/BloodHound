import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './CollapsibleSection.module.css';
import clsx from 'clsx';
import { Row, Col, Grid } from 'react-bootstrap';
import { motion } from 'framer-motion';

const CollapsibleSection = ({ header, children }) => {
    const [open, setOpen] = useState(true);

    return (
        <>
            <h4 className={styles.header} onClick={() => setOpen(!open)}>
                <Grid fluid className={styles.removeGutters}>
                    <Row className={'row-no-gutters'}>
                        <Col sm={11}>{header}</Col>
                        <Col sm={1} className={'text-right'}>
                            <span>
                                <i
                                    className={clsx(
                                        open &&
                                            'glyphicon glyphicon-chevron-down',
                                        !open &&
                                            'glyphicon glyphicon-chevron-up'
                                    )}
                                />
                            </span>
                        </Col>
                    </Row>
                </Grid>
            </h4>
            <motion.div
                variants={{
                    open: {
                        height: 'auto',
                        transitionEnd: {
                            overflow: 'visible',
                        },
                    },
                    closed: {
                        height: 0,
                        overflow: 'hidden',
                    },
                }}
                animate={open ? 'open' : 'closed'}
            >
                {children}
            </motion.div>
        </>
    );
};

CollapsibleSection.propTypes = {};
export default CollapsibleSection;
