import React, {useContext} from 'react';
import styles from './EdgeFilter.module.css';
import {AppContext} from '../../../AppContext';

const EdgeFilterSection = ({ title, edges, sectionName }) => {
    const context = useContext(AppContext);

    const setSection = () => {
        for (let edge of edges) {
            context.setEdgeIncluded(edge, true);
        }
    };

    const clearSection = () => {
        for (let edge of edges) {
            context.setEdgeIncluded(edge, false);
        }
    };

    return (
        <div className={styles.section}>
            <h4>{title}</h4>
            <button
                onClick={setSection}
                className={'fa fa-check-double'}
                data-toggle='tooltip'
                data-placement='top'
                title={`Enable all ${sectionName} edges`}
            />
            <button
                onClick={clearSection}
                className={'fa fa-eraser'}
                data-toggle='tooltip'
                data-placement='top'
                title={`Disable all ${sectionName} edges`}
            />
        </div>
    );
};

EdgeFilterSection.propTypes = {};
export default EdgeFilterSection;
