import React, {useEffect, useRef, useState} from 'react';
import {Button} from 'react-bootstrap';
import clsx from 'clsx';
import {motion} from 'framer-motion';
import neo4j from 'neo4j-driver';

const Login = () => {
    const [url, setUrl] = useState('bolt://localhost:7687');
    const [loginEnabled, setLoginEnabled] = useState(false);
    const [loginRunning, setLoginRunning] = useState(false);
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [save, setSave] = useState(false);
    const [icon, setIcon] = useState(null);

    const [pwfReady, setPwfReady] = useState(false);
    const [iconReady, setIconReady] = useState(false);
    const [buttonReady, setButtonReady] = useState(false);

    const [loginSuccess, setLoginSuccess] = useState(false);
    const [visible, setVisible] = useState(true);

    const passwordRef = useRef(null);
    const iconRef = useRef(null);
    const buttonRef = useRef(null);

    const variants = {
        visible: {
            opacity: 1,
            transition: { duration: 0.4 },
            display: 'block',
        },
        hidden: {
            opacity: 0,
            transition: { duration: 0.4 },
            transitionEnd: { display: 'none' },
        },
    };

    useEffect(() => {
        let config = conf.get('databaseInfo');
        if (typeof config !== 'undefined') {
            setUrl(config.url);
            setUser(config.user);
            setPassword(config.password);
            setSave(true);
        }
    }, []);

    useEffect(() => {
        jQuery(passwordRef.current).tooltip({
            placement: 'right',
            title: '',
            container: 'body',
            trigger: 'manual',
            template:
                '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tooltip-inner-custom"></div></div>',
        });

        setPwfReady(true);
    }, [passwordRef]);

    useEffect(() => {
        let icon = jQuery(iconRef.current);
        icon.tooltip({
            placement: 'right',
            title: '',
            container: 'body',
            delay: { show: 200, hide: 0 },
            template:
                '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tooltip-inner-custom"></div></div>',
        });

        icon.toggle(false);
        setIcon(icon);

        setIconReady(true);
    }, [iconRef]);

    useEffect(() => {
        setButtonReady(true);
    }, [buttonRef]);

    useEffect(() => {
        if (pwfReady && iconReady && buttonReady) {
            if (password !== '') {
                checkDatabaseCreds();
            } else {
                checkDatabaseExists();
            }
        }
    }, [pwfReady, iconReady, buttonReady]);

    const checkDatabaseCreds = () => {
        if (loginRunning) {
            return;
        }

        setLoginRunning(true);
        setLoginEnabled(false);

        let driver = neo4j.driver(url, neo4j.auth.basic(user, password));
        let session = driver.session();

        let pwf = jQuery(passwordRef.current);
        pwf.tooltip('hide');

        let btn = jQuery(buttonRef.current);

        let tempUrl = url.replace('bolt://', 'http://').replace('7687', '7474');

        session
            .run('MATCH (n) RETURN n LIMIT 1')
            .then((_) => {
                setLoginRunning(false);
                setLoginSuccess(true);

                const dbInfo = {
                    url: url,
                    user: user,
                    password: password,
                };

                if (save) {
                    conf.set('databaseInfo', dbInfo);
                }

                appStore.databaseInfo = dbInfo;

                pwf.tooltip('hide');
                icon.tooltip('hide');

                session.close();
                driver.close();

                global.driver = neo4j.driver(
                    url,
                    neo4j.auth.basic(user, password),
                    {
                        disableLosslessIntegers: true,
                        connectionTimeout: 120000,
                    }
                );

                session = global.driver.session();
                session
                    .run(
                        'CALL dbms.components() YIELD versions RETURN versions[0] AS version'
                    )
                    .then((result) => {
                        let record = result.records[0];
                        global.neoVersion = record.get('version');
                        session.close();
                    });

                setTimeout(() => {
                    setVisible(false);
                    setTimeout(() => {
                        renderEmit.emit('login');
                    }, 400);
                }, 1500);
            })
            .catch((error) => {
                console.log(error);
                if (error.message.includes('authentication failure')) {
                    setLoginEnabled(true);
                    setLoginRunning(false);

                    pwf.attr(
                        'data-original-title',
                        'Invalid username or password'
                    )
                        .tooltip('fixTitle')
                        .tooltip('show');
                } else if (error.message.includes('too many times in a row')) {
                    setLoginRunning(false);

                    pwf.attr(
                        'data-original-title',
                        'Too many wrong authentication attempts. Please wait'
                    )
                        .tooltip('fixTitle')
                        .tooltip('show');

                    setTimeout(() => {
                        setLoginEnabled(true);
                        pwf.tooltip('hide');
                    }, 5000);
                } else if (
                    error.message.includes('WebSocket connection failure')
                ) {
                    icon.toggle('true');
                    icon.removeClass();
                    icon.addClass(
                        'fa fa-times-circle red-icon-color form-control-feedback'
                    );
                    icon.attr('data-original-title', 'No database found')
                        .tooltip('fixTitle')
                        .tooltip('show');
                    setLoginEnabled(false);
                    setLoginRunning(false);
                } else if (
                    error.message.includes(
                        'The credentials you provided were valid'
                    )
                ) {
                    pwf.attr(
                        'data-original-title',
                        'Credentials need to be changed from the neo4j browser first. Go to {} and change them.'.format(
                            tempUrl
                        )
                    )
                        .tooltip('fixTitle')
                        .tooltip('show');

                    setLoginEnabled(true);
                    setLoginRunning(false);
                }
            });
    };

    const checkDatabaseExists = () => {
        if (url === '') {
            return;
        }

        icon.toggle(true);

        let tempUrl = url.replace(/\/$/, '');
        if (!tempUrl.includes(':')) {
            tempUrl = `${tempUrl}:7687`;
        }

        if (!url.startsWith('bolt://') && !url.startsWith("bolt+s://") && !url.startsWith("neo4j+s://") && !url.startsWith("neo4j://")) {
            tempUrl = `bolt://${tempUrl}`;
        }

        icon.removeClass();
        icon.addClass('fa fa-spinner fa-spin form-control-feedback');
        icon.toggle(true);

        const driver = neo4j.driver(url, neo4j.auth.basic('', ''));
        const session = driver.session();

        session
            .run('MATCH (n) RETURN n LIMIT 1')
            .then((result) => {
                icon.removeClass();
                icon.addClass(
                    'fa fa-check-circle green-icon-color form-control-feedback'
                );
                setLoginEnabled(true);
                setUrl(tempUrl);
            })
            .catch((error) => {
                if (error.message.includes('WebSocket connection failure')) {
                    icon.removeClass();
                    icon.addClass(
                        'fa fa-times-circle red-icon-color form-control-feedback'
                    );
                    icon.attr('data-original-title', 'No database found')
                        .tooltip('fixTitle')
                        .tooltip('show');
                    setLoginRunning(false);
                    setLoginEnabled(false);
                } else if (error.code.includes('Unauthorized')) {
                    icon.removeClass();
                    icon.addClass(
                        'fa fa-check-circle green-icon-color form-control-feedback'
                    );
                    setLoginEnabled(true);
                    setUrl(tempUrl);
                }
            })
            .finally(() => {
                session.close();
                driver.close();
            });
    };

    const triggerLogin = (event) => {
        let key = event.keyCode;

        if (key === 13) {
            checkDatabaseCreds();
        }
    };

    return (
        <div className='loginwindow'>
            <motion.div
                variants={variants}
                animate={visible ? 'visible' : 'hidden'}
                initial={'hidden'}
            >
                <img src='src/img/logo-white-on-transparent.png' />
                <div className='text-center'>
                    <span>Log in to Neo4j Database</span>
                </div>
                <br></br>
                <form>
                    <div className='form-group has-feedback'>
                        <div className='input-group'>
                            <input
                                onFocus={function () {
                                    icon.tooltip('hide');
                                }}
                                onBlur={checkDatabaseExists}
                                onChange={(event) => {
                                    setUrl(event.target.value);
                                }}
                                type='text'
                                className='form-control login-text'
                                value={url}
                                placeholder='Neo4j URL'
                                aria-describedby='dburladdon'
                            />
                            <i
                                ref={iconRef}
                                className='fa fa-spinner fa-spin form-control-feedback'
                            />
                        </div>
                        <div className='input-group spacing'>
                            <input
                                type='text'
                                value={user}
                                onKeyDown={triggerLogin}
                                onChange={(event) => {
                                    setUser(event.target.value);
                                }}
                                className='form-control login-text'
                                placeholder='Neo4j Username'
                                aria-describedby='dbuseraddon'
                            />
                        </div>
                        <div className='input-group spacing'>
                            <input
                                ref={passwordRef}
                                value={password}
                                onKeyDown={triggerLogin}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                }}
                                type='password'
                                className='form-control login-text'
                                placeholder='Neo4j Password'
                                aria-describedby='dbpwaddon'
                            />
                        </div>
                        <div className='savecontainer'>
                            <div className='checkbox logincheck'>
                                <label>
                                    <input
                                        checked={save}
                                        onChange={(event) =>
                                            setSave(event.target.checked)
                                        }
                                        type='checkbox'
                                    />
                                    <font color='white'>Save Password</font>
                                </label>
                            </div>
                            <div className='buttoncontainer'>
                                <Button
                                    disabled={!loginEnabled}
                                    className={clsx(
                                        'loginbutton',
                                        'has-spinner',
                                        loginRunning && 'activate'
                                    )}
                                    bsStyle={
                                        loginSuccess ? 'success' : 'primary'
                                    }
                                    onClick={checkDatabaseCreds}
                                    ref={buttonRef}
                                >
                                    {loginSuccess ? 'Success' : 'Login'}
                                    <span className='button-spinner'>
                                        <i className='fa fa-spinner fa-spin' />
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

Login.propTypes = {};
export default Login;
