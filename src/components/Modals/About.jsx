import React, { Component } from 'react';

import { Modal } from 'react-bootstrap';
import { join } from 'path';
import { readFileSync, readFile } from 'fs';
import { remote } from 'electron';
const { app, shell } = remote;

export default class About extends Component {
    constructor() {
        super();

        var json = JSON.parse(
            readFileSync(join(app.getAppPath(), 'package.json'))
        );

        readFile(
            join(app.getAppPath(), 'LICENSE.md'),
            'utf8',
            function(err, data) {
                this.setState({
                    license: data,
                });
            }.bind(this)
        );

        this.state = {
            open: false,
            version: json.version,
        };
    }

    componentDidMount() {
        emitter.on('showAbout', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    openModal() {
        this.setState({ open: true });
    }

    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby='AboutHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='AboutHeader'>About BloodHound</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <h5>
                        <b>Version:</b> {this.state.version}
                    </h5>
                    <h5>
                        <b>GitHub:</b>{' '}
                        <a
                            href='#'
                            onClick={function() {
                                shell.openExternal(
                                    'https://www.github.com/BloodHoundAD/BloodHound'
                                );
                            }}
                        >
                            https://www.github.com/BloodHoundAD/BloodHound
                        </a>
                    </h5>
                    <h5>
                        <b>BloodHound Slack:</b>{' '}
                        <a
                            href='#'
                            onClick={function() {
                                shell.openExternal(
                                    'https://bloodhoundgang.herokuapp.com/'
                                );
                            }}
                        >
                            https://bloodhoundgang.herokuapp.com/
                        </a>
                    </h5>
                    <h5>
                        <b>Authors:</b>{' '}
                        <a
                            href='#'
                            onClick={function() {
                                shell.openExternal(
                                    'https://www.twitter.com/harmj0y'
                                );
                            }}
                        >
                            @harmj0y
                        </a>
                        ,{' '}
                        <a
                            href='#'
                            onClick={function() {
                                shell.openExternal(
                                    'https://www.twitter.com/_wald0'
                                );
                            }}
                        >
                            @_wald0
                        </a>
                        ,{' '}
                        <a
                            href='#'
                            onClick={function() {
                                shell.openExternal(
                                    'https://www.twitter.com/cptjesus'
                                );
                            }}
                        >
                            @cptjesus
                        </a>
                    </h5>
                    <br />
                    <h5>
                        <b>License</b>
                    </h5>
                    <div className='aboutscroll'>{this.state.license}</div>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type='button'
                        className='btn btn-primary'
                        onClick={this.closeModal.bind(this)}
                    >
                        Close
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
