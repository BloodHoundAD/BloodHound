import React, { useEffect, useState, useContext } from 'react';
const { app, shell } = require('electron').remote;
import { join } from 'path';
import { promises } from 'fs';
import { Modal, Button } from 'react-bootstrap';
import styles from './About.module.css';
import { AppContext } from '../../AppContext';
import BaseModal from './BaseModal';

const About = () => {
    const [data, setData] = useState('');
    const [version, setVersion] = useState('');
    const [open, setOpen] = useState(false);
    const context = useContext(AppContext);

    const getVersion = async () => {
        let data = await promises.readFile(
            join(app.getAppPath(), 'package.json')
        );
        let version = JSON.parse(data).version;

        setVersion(version);
    };

    const getLicense = async () => {
        let data = await promises.readFile(
            join(app.getAppPath(), 'LICENSE.md'),
            'utf-8'
        );
        setData(data);
    };

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const openLink = (link) => {
        shell.openExternal(link);
    };

    useEffect(() => {
        getVersion();
        getLicense();

        emitter.on('showAbout', handleOpen);
        return () => {
            emitter.removeListener('showAbout', handleOpen);
        };
    }, []);

    return (
        <BaseModal
            show={open}
            onHide={handleClose}
            label='AboutHeader'
            className={context.darkMode ? styles.dark : styles.light}
        >
            <Modal.Header closeButton className={styles.about}>
                <Modal.Title id='AboutHeader'>About BloodHound</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <h5>Version: {version}</h5>
                <h5>
                    GitHub:{' '}
                    <a
                        href='#'
                        onClick={() => {
                            openLink(
                                'https://www.github.com/BloodHoundAD/BloodHound'
                            );
                        }}
                    >
                        https://www.github.com/BloodHoundAD/BloodHound
                    </a>
                </h5>
                <h5>
                    BloodHound Slack:{' '}
                    <a
                        href='#'
                        onClick={() => {
                            openLink('https://bloodhoundgang.herokuapp.com/');
                        }}
                    >
                        https://bloodhoundgang.herokuapp.com/
                    </a>
                </h5>
                <h5>
                    Authors:{' '}
                    <a
                        href='#'
                        onClick={() => {
                            openLink('https://www.twitter.com/_wald0');
                        }}
                    >
                        @_wald0
                    </a>
                    ,{' '}
                    <a
                        href='#'
                        onClick={() => {
                            openLink('https://www.twitter.com/cptjesus');
                        }}
                    >
                        @CptJesus
                    </a>
                    ,{' '}
                    <a
                        href='#'
                        onClick={() => {
                            openLink('https://twitter.com/Haus3c');
                        }}
                    >
                        @Haus3c
                    </a>
                </h5>
                <h5>
                    Created by:{' '}
                    <a
                        href='#'
                        onClick={() => {
                            openLink('https://www.twitter.com/_wald0');
                        }}
                    >
                        @_wald0
                    </a>
                    ,{' '}
                    <a
                        href='#'
                        onClick={() => {
                            openLink('https://www.twitter.com/cptjesus');
                        }}
                    >
                        @CptJesus
                    </a>
                    ,{' '}
                    <a
                        href='#'
                        onClick={() => {
                            openLink('https://www.twitter.com/harmj0y');
                        }}
                    >
                        @harmj0y
                    </a>
                </h5>
                <br />
                <h5>LICENSE</h5>
                <div className={styles.scroll}>{data}</div>
            </Modal.Body>

            <Modal.Footer className={styles.footer}>
                <Button
                    variant='primary'
                    onClick={handleClose}
                    className={styles.btndone}
                >
                    Done
                </Button>
            </Modal.Footer>
        </BaseModal>
    );
};

About.propTypes = {};
export default About;
