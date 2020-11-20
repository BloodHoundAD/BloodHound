import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
const { app } = remote;
import path from 'path';
import fs from 'fs';
import { platform } from 'process';
import { exec } from 'child_process';
import PrebuiltQueryNode from './PrebuiltQueryNode';
import styles from './PrebuiltQueries.module.css';
import { useContext } from 'react';
import { AppContext } from '../../../AppContext';

const PrebuiltQueriesDisplay = () => {
    const [queries, setQueries] = useState([]);
    const [custom, setCustom] = useState([]);
    const context = useContext(AppContext);

    useEffect(() => {
        readCustom();
        readBase();
    }, []);

    const readCustom = async () => {
        let filePath = path.join(
            app.getPath('userData'),
            '/customqueries.json'
        );
        fs.readFile(filePath, 'utf8', (err, data) => {
            let j = JSON.parse(data);
            var y = [];
            j.queries.forEach((query) => {
                y.push(query);
            });

            setCustom(y);
        });
    };

    const readBase = async () => {
        $.ajax({
            url: 'src/components/SearchContainer/Tabs/PrebuiltQueries.json',
            type: 'GET',
            success: function (response) {
                var y = [];

                $.each(response.queries, function (_, el) {
                    y.push(el);
                });

                setQueries(y);
            },
        });
    };

    const getCommandLine = () => {
        switch (platform) {
            case 'darwin':
                return 'open';
            case 'win32':
                return '';
            case 'win64':
                return '';
            default:
                return 'xdg-open';
        }
    };

    const editCustom = () => {
        exec(
            getCommandLine() +
                ' "' +
                join(app.getPath('userData'), '/customqueries.json') +
                '"'
        );
    };

    const refreshCustom = () => {
        readCustom();
    };

    return (
        <div className={context.darkMode ? styles.dark : null}>
            <h3>Pre-Built Analytics Queries</h3>
            <div className='query-box'>
                {queries.map(function (a) {
                    return <PrebuiltQueryNode key={a.name} info={a} />;
                })}
            </div>
            <h3>
                Custom Queries
                <i
                    className='glyphicon glyphicon-pencil customQueryGlyph'
                    data-toggle='tooltip'
                    title='Edit Queries'
                    onClick={editCustom}
                />
                <i
                    className='glyphicon glyphicon-refresh customQueryGlyph'
                    onClick={refreshCustom}
                    style={{ paddingLeft: '5px' }}
                    data-toggle='tooltip'
                    title='Refresh Queries'
                />
            </h3>
            <div className='query-box'>
                {custom.length === 0 && <div>No user defined queries.</div>}
                {custom.length > 0 && (
                    <div>
                        {custom.map(function (a) {
                            return <PrebuiltQueryNode key={a.name} info={a} />;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

PrebuiltQueriesDisplay.propTypes = {};
export default PrebuiltQueriesDisplay;
