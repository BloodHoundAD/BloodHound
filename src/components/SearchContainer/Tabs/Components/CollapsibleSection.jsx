import React, {useContext, useState} from 'react';
import styles from './CollapsibleSection.module.css';
import clsx from 'clsx';
import {Col, Grid, Row} from 'react-bootstrap';
import {motion} from 'framer-motion';
import {AppContext} from '../../../../AppContext';

const CollapsibleSection = ({ header, children }) => {
    const [open, setOpen] = useState(true);
    const context = useContext(AppContext);

    return (
        <>
            <h4
                className={clsx(
                    styles.header,
                    context.darkMode ? styles.dark : styles.light
                )}
                onClick={() => setOpen(!open)}
            >
                <Grid fluid className={styles.removeGutters}>
                    <Row className={'row-no-gutters'}>
                        <Col sm={11}>{header}</Col>
                        <Col sm={1} className={'text-right'}>
                            <span>
                                <i
                                    className={clsx(
                                        open && 'fa fa-minus',
                                        !open && 'fa fa-plus'
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
                transition={{ duration: 0.0 }}
            >
                {children}
            </motion.div>
        </>
    );
};

CollapsibleSection.propTypes = {};
export default CollapsibleSection;
