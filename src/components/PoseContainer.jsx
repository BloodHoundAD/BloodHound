import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const PoseContainer = ({ className, visible, children }) => {
    return (
        <motion.div
            variants={{
                visible: {
                    opacity: 1,
                    display: 'block',
                    transition: { duration: 0.25 },
                },
                hidden: {
                    opacity: 0,
                    transition: { duration: 0.25 },
                    transitionEnd: { display: 'none' },
                },
            }}
            animate={visible ? 'visible' : 'hidden'}
            className={className}
        >
            {children}
        </motion.div>
    );
};

PoseContainer.propTypes = {};
export default PoseContainer;
