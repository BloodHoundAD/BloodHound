import React, { useEffect, useState } from 'react';
import styles from './NoteGallery.module.css';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Notes = ({ objectid, type }) => {
    const [showCheck, setShowCheck] = useState(false);
    const [notes, setNotes] = useState('');

    const variants = {
        visible: {
            opacity: 1,
            display: 'inline-block',
            transition: {
                duration: 1,
            },
        },
        hidden: {
            opacity: 0,
            transitionEnd: {
                display: 'none',
            },
            transition: {
                duration: 1,
            },
        },
    };

    useEffect(() => {
        let session = driver.session();
        session
            .run(
                `MATCH (n:${type} {objectid: $objectid}) RETURN n.notes AS notes`,
                {
                    objectid: objectid,
                }
            )
            .then(r => {
                setNotes(r.records[0].get('notes') || '');
                session.close();
            });
    }, [objectid]);

    const textChanged = event => {
        setNotes(event.target.value);
    };

    const notesBlur = async () => {
        let newNotes = notes === '' ? null : notes;
        let session = driver.session();

        if (newNotes === null) {
            await session.run(
                `MATCH (n:${type} {objectid: $objectid}) REMOVE n.notes`,
                {
                    objectid: objectid,
                }
            );
            await session.close();
        } else {
            await session.run(
                `MATCH (n:${type} {objectid: $objectid}) SET n.notes=$notes`,
                {
                    objectid: objectid,
                    notes: newNotes,
                }
            );
            await session.close();
        }
        setShowCheck(true);
        setTimeout(() => {
            setShowCheck(false);
        }, 2000);
    };

    return (
        <>
            <div>
                <h4 className={styles.inline}>Notes</h4>
                <motion.i
                    className={clsx(
                        'fa',
                        'fa-check',
                        styles.green,
                        styles.check
                    )}
                    variants={variants}
                    animate={showCheck ? 'visible' : 'hidden'}
                />
            </div>
            <textarea
                onChange={textChanged}
                className={styles.textarea}
                onBlur={notesBlur}
                value={notes}
            />
        </>
    );
};

Notes.propTypes = {};
export default Notes;
