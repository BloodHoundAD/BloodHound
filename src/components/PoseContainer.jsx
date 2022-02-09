import React from 'react';
import { motion } from 'framer-motion';

const PoseContainer = ({
    className,
    visible,
    dragHandle,
    draggable = true,
    children,
}) => {
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
            drag={draggable}
            dragControls={dragHandle}
            dragListener={false}
            dragElastic={false}
            dragMomentum={false}
        >
            {children}
        </motion.div>
    );
};

PoseContainer.propTypes = {};
export default PoseContainer;
