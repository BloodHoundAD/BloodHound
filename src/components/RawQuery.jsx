import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { AppContext } from '../AppContext';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import styles from './RawQuery.module.css';

const RawQuery = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const context = useContext(AppContext);

    useEffect(() => {
        emitter.on('setRawQuery', setQueryFromEvent);
        return () => {
            emitter.removeListener('setRawQuery', setQueryFromEvent);
        };
    }, []);

    const setQueryFromEvent = (query) => {
        setQuery(query);
    };

    const onKeyDown = (e) => {
        let key = e.keyCode ? e.keyCode : e.which;

        if (key === 13) {
            emitter.emit('query', query);
        }
    };

    const onChange = (e) => {
        setQueryFromEvent(e.target.value);
    };

    const toggleRawQuery = () => {
        setOpen(!open);
    };

    return (
        <div
            className={clsx(
                styles.container,
                context.darkMode ? styles.dark : null
            )}
        >
            <button className={styles.button} onClick={toggleRawQuery}>
                Raw Query
            </button>
            <motion.div
                variants={{
                    open: {
                        height: 'auto',
                    },
                    closed: {
                        height: 0,
                    },
                }}
                transition={{ duration: 0.25 }}
                animate={open ? 'open' : 'closed'}
            >
                <input
                    type='text'
                    onChange={onChange}
                    value={query}
                    onKeyDown={onKeyDown}
                    className={clsx(styles.input, 'form-control')}
                    autoComplete='off'
                    placeholder='Enter a cypher query. Your query must return nodes or paths.'
                />
            </motion.div>
        </div>
    );
};

RawQuery.propTypes = {};
export default RawQuery;
