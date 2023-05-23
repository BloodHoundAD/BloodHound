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
            <label>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    checked={context.edgeIncluded[name]}
                    onChange={handleChange}
                />
            {name}</label>
        </div>
    );
};

EdgeFilterCheck.propTypes = {};
export default EdgeFilterCheck;
