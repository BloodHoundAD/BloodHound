import React, { useEffect, useState } from 'react';
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
import { Table } from 'react-bootstrap';
import CollapsibleSection from './Components/CollapsibleSection';

const PrebuiltQueriesDisplay = () => {
    const [queries, setQueries] = useState([]);
    const [custom, setCustom] = useState([]);
    const context = useContext(AppContext);

    useEffect(() => {
        readCustom();
        readBase();
        emitter.on('updateCustomQueries', refreshCustom);
    }, []);

    const readCustom = async () => {
        let filePath = path.join(
            app.getPath('userData'),
            '/customqueries.json'
        );
        fs.readFile(filePath, 'utf8', (err, data) => {
            let j = JSON.parse(data);
            let y = [];
            j.queries.forEach((query) => {
                try {
                    if (query.category === undefined || query.category === "") {
                        query.category = "Uncategorized Query";
                    }
                    if (query.name === "") {
                        query.name = "Unnamed Query"
                    }
                    if (!(query.category in y)) {
                            y[query.category] = [];
                    }

                    y[query.category].push(query);
                } catch (e) {
                    alert("Custom Queries Category Array Exception: " + e.message);
                }
            });

            setCustom(y);
        });
    };

    const readBase = async () => {
        $.ajax({
            url: 'src/components/SearchContainer/Tabs/PrebuiltQueries.json',
            type: 'GET',
            success: function (response) {
                let y = [];

                $.each(response.queries, function (_, el) {
                    try {
                        if (el.category === undefined || el.category === "") {
                            el.category = "Uncategorized Query";
                        }
                        if (el.name === "") {
                            el.name = "Unnamed Query"
                        }
                        if (!(el.category in y)) {
                            y[el.category] = [];
                        }
                        y[el.category].push(el);
                    } catch (e){
                        alert("Queries Category Array Exception: "+e.message);
                    }
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

    const createQuerieSections = (queryArray) => {
        let finalQueryElement = [];
        
        for (let queryCategory in queryArray) {
            try {
                finalQueryElement.push(
                    <CollapsibleSection header={queryCategory} key={queryCategory}>
                        <div className={styles.itemlist}>
                            <Table>
                                <thead/>
                                <tbody className='searchable'>
                                    {queryArray[queryCategory].map(function (a) { return <PrebuiltQueryNode key={a.name} info={a} />; })}
                                </tbody>
                            </Table>
                        </div>
                    </CollapsibleSection>);
            } catch (e) {
                //alert("Create Query Section Exception: " + e.message + "\nqueryCategory: " + queryCategory);
            }
        }

        emitter.emit('registerQueryCategories',queryArray);
        return finalQueryElement;
    }

    const settingsClick = () => {
        emitter.emit('openQueryCreate');
    };

    return (
        <div className={context.darkMode ? styles.dark : styles.light}>
            <div className={styles.dl}>
                <h5>Pre-Built Analytics Queries</h5>

                {createQuerieSections(queries).map((a) => { return a })}


            
                <hr />
                <h5>
                    Custom Queries
                    <i
                        className='glyphicon glyphicon-pencil customQueryGlyph'
                        data-toggle='tooltip'
                        title='Edit Queries'
                        onClick={settingsClick}
                    />
                    <i
                        className='glyphicon glyphicon-refresh customQueryGlyph'
                        onClick={refreshCustom}
                        style={{ paddingLeft: '5px' }}
                        data-toggle='tooltip'
                        title='Refresh Queries'
                    />
                </h5>
                    {Object.keys(custom).length === 0 && <div>No user defined queries.</div>}
                    {Object.keys(custom).length > 0 && (
                        createQuerieSections(custom).map((a) => { return a })
                    )}
            </div>
        </div>
    );
};

PrebuiltQueriesDisplay.propTypes = {};
export default PrebuiltQueriesDisplay;