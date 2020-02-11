import React, { useEffect, useState, useContext } from 'react';
import clsx from 'clsx';
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
        let data = await promises.readFile(join(app.getAppPath(), 'package.json'))
        let version = JSON.parse(data).version;

        setVersion(version);
    }

    const getLicense = async () => {
        let data = await promises.readFile(join(app.getAppPath(), 'LICENSE.md'), 'utf-8');
        setData(data);
    }

    const handleOpen = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
    }

    const openLink = (link) => {
        shell.openExternal(link)
    }

    useEffect(() => {
        getVersion();
        getLicense();

        emitter.on('showAbout', handleOpen)
        return () => {
            emitter.removeListener('showAbout', handleOpen);
        };
    }, [])

    return (
        <BaseModal
            show={open}
            onHide={handleClose}
            label='AboutHeader'
        >
            <Modal.Header closeButton>
                <Modal.Title id='AboutHeader'>About BloodHound</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <h5>
                    <b>Version:</b> {version}
                </h5>
                <h5>
                    <b>GitHub:</b>{' '}
                    <a
                        href='#'
                        onClick={() => { openLink('https://www.github.com/BloodHoundAD/BloodHound') }}
                    >
                        https://www.github.com/BloodHoundAD/BloodHound
                        </a>
                </h5>
                <h5>
                    <b>BloodHound Slack:</b>{' '}
                    <a
                        href='#'
                        onClick={() => { openLink('https://bloodhoundgang.herokuapp.com/') }}
                    >
                        https://bloodhoundgang.herokuapp.com/
                        </a>
                </h5>
                <h5>
                    <b>Authors:</b>{' '}
                    <a
                        href='#'
                        onClick={() => { openLink('https://www.twitter.com/harmj0y') }}
                    >
                        @harmj0y
                        </a>
                    ,{' '}
                    <a
                        href='#'
                        onClick={() => { openLink('https://www.twitter.com/_wald0') }}
                    >
                        @_wald0
                        </a>
                    ,{' '}
                    <a
                        href='#'
                        onClick={() => { openLink('https://www.twitter.com/cptjesus') }}
                    >
                        @cptjesus
                        </a>
                </h5>
                <br />
                <h5>
                    <b>License</b>
                </h5>
                <div className={styles.scroll}>{data}</div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant='primary' onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </BaseModal >
    )
}

About.propTypes = {

}
export default About
