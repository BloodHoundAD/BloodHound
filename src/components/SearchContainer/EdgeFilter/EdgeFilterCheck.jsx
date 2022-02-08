import React, {useContext} from 'react';
import {AppContext} from '../../../AppContext';
import styles from './EdgeFilter.module.css';

const EdgeFilterCheck = ({ name }) => {
    const context = useContext(AppContext);

    const handleChange = (e) => {
        context.setEdgeIncluded(name, e.target.checked);
    };

    return (
        <div className={styles.input}>
            <input
                className='checkbox-inline'
                type='checkbox'
                checked={context.edgeIncluded[name]}
                onChange={handleChange}
            />
            <label onClick={handleChange}>{name}</label>
        </div>
    );
};

EdgeFilterCheck.propTypes = {};
export default EdgeFilterCheck;
