import React, { Component } from 'react';
import styles from './DatabaseDataDisplay.module.css';
import { Table } from 'react-bootstrap';

export default class DatabaseDataDisplay extends Component {
    constructor() {
        super();
        this.state = {
            url: appStore.databaseInfo.url,
            user: appStore.databaseInfo.user,
            num_users: 'Refreshing',
            num_computers: 'Refreshing',
            num_groups: 'Refreshing',
            num_relationships: 'Refreshing',
            num_sessions: 'Refreshing',
            num_acls: 'Refreshing',
            interval: null,
        };
    }

    componentDidMount() {
        this.refreshDBData();
        emitter.on('hideDBClearModal', this.refreshDBData.bind(this));
        emitter.on('refreshDBData', this.refreshDBData.bind(this));
        this.createInterval();
    }

    componentWillUnmount() {
        clearInterval(this.state.interval);
        this.setState({
            interval: null,
            session: null,
        });
    }

    createInterval() {
        var x = setInterval(() => {
            this.refreshDBData();
        }, 60000);
        this.setState({
            interval: x,
        });
    }

    toggleLogoutModal() {
        emitter.emit('showLogout');
    }

    toggleDBWarnModal() {
        emitter.emit('openDBWarnModal');
    }

    toggleSessionClearModal() {
        emitter.emit('openSessionClearModal');
    }

    toggleWarmupModal() {
        emitter.emit('openWarmupModal');
    }

    refreshDBData() {
        var s1 = driver.session();
        var s2 = driver.session();
        var s3 = driver.session();
        var s4 = driver.session();
        var s5 = driver.session();
        var s6 = driver.session();

        s1.run(
            "MATCH (n:User) WHERE NOT n.name ENDS WITH '$' RETURN count(n)"
        ).then(result => {
            this.setState({
                num_users: result.records[0]._fields[0].toLocaleString(),
            });
            s1.close();
        });

        s2.run('MATCH (n:Group) RETURN count(n)').then(result => {
            this.setState({
                num_groups: result.records[0]._fields[0].toLocaleString(),
            });
            s2.close();
        });

        s3.run('MATCH (n:Computer) RETURN count(n)').then(result => {
            this.setState({
                num_computers: result.records[0]._fields[0].toLocaleString(),
            });
            s3.close();
        });

        s4.run('MATCH ()-[r:HasSession]->() RETURN count(r)').then(result => {
            this.setState({
                num_sessions: result.records[0]._fields[0].toLocaleString(),
            });
            s4.close();
        });

        s6.run('MATCH ()-[r {isacl: true}]->() RETURN count(r)').then(
            result => {
                this.setState({
                    num_acls: result.records[0]._fields[0].toLocaleString(),
                });
                s6.close();
            }
        );

        s5.run('MATCH ()-[r]->() RETURN count(r)').then(result => {
            this.setState({
                num_relationships: result.records[0]._fields[0].toLocaleString(),
            });
            s5.close();
        });
    }

    render() {
        return (

            <div className={styles.nodelist}>
                <Table class="table table-hover table-striped table-borderless table-responsive">
                    <thead>
                    </thead>
                    <tbody className='searchable'>
                        <tr>
                            <td>
                                Address
                            </td>
                            <td align="right">
                                {this.state.url}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                DB User
                            </td>
                            <td align="right">
                                {this.state.user}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Users
                            </td>
                            <td align="right">
                                {this.state.num_users}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Computers
                            </td>
                            <td align="right">
                                {this.state.num_computers}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Groups
                            </td>
                            <td align="right">
                                {this.state.num_groups}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Sessions
                            </td>
                            <td align="right">
                                {this.state.num_sessions}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ACEs
                            </td>
                            <td align="right">
                                {this.state.num_acls}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Total Relationships
                            </td>
                            <td align="right">
                                {this.state.num_relationships}
                            </td>
                        </tr>
                    </tbody>
                </Table>

                <div className='text-center' class={styles.buttongroup}>
                    <div className='btn-group' role='group' class={styles.buttongroup}>
                        <button
                            type='button'
                            class={styles.btnleft}
                            onClick={function() {
                                this.refreshDBData();
                            }.bind(this)}
                        >
                            Refresh Database Stats
                        </button>
                        <button
                            type='button'
                            class={styles.btnright}
                            onClick={this.toggleWarmupModal}
                        >
                            Warm Up Database
                        </button>
                    </div>
                    <p></p>
                    <div className='btn-group' role='group' class={styles.buttongroup}>
                        <button
                            type='button'
                            class={styles.btnleft}
                            onClick={this.toggleSessionClearModal}
                        >
                            Clear Sessions
                        </button>
                        <button
                            type='button'
                            class={styles.btnright}
                            onClick={this.toggleDBWarnModal}
                        >
                            Clear Database
                        </button>
                    </div>
                    <p></p>
                    <div className='text-center'>
                        <a href="blah">
                            Log Out / Switch Database
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
