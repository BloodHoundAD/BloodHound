import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import PoseContainer from '../PoseContainer';
import GlyphiconSpan from '../GlyphiconSpan';
import Icon from '../Icon';
import SpotlightRow from './SpotlightRow';
import { Table } from 'react-bootstrap';
import { AppContext } from '../../AppContext';
import clsx from 'clsx';
import styles from './SpotlightContainer.module.css';

const SpotlightContainer = () => {
    const [data, setData] = useState(appStore.spotlightData);
    const [searchVal, setSearchVal] = useState('');
    const [regex, setRegex] = useState(new RegExp('', 'i'));
    const [visible, setVisible] = useState(false);
    const context = useContext(AppContext);

    const updateSpotlight = () => {
        setData(appStore.spotlightData);
    };

    const closeSpotlight = () => {
        setVisible(false);
    };

    const resetSpotlight = () => {
        setSearchVal('');
        setRegex(new RegExp('', 'i'));
    };

    const handleSearch = event => {
        setSearchVal(event.target.value);
        setRegex(new RegExp(event.target.value, 'i'));
    };

    const handleSpace = event => {
        var key = event.keyCode ? event.keyCode : event.which;

        if (document.activeElement === document.body && key === 32) {
            setVisible(v => !v);
        }
    };

    useEffect(() => {
        emitter.on('spotlightUpdate', updateSpotlight);
        emitter.on('spotlightClick', closeSpotlight);
        emitter.on('resetSpotlight', resetSpotlight);
        window.addEventListener('keyup', handleSpace);

        return () => {
            emitter.removeListener('spotlightUpdate', updateSpotlight);
            emitter.removeListener('spotlightClick', closeSpotlight);
            emitter.removeListener('resetSpotlight', resetSpotlight);
            window.removeEventListener('keyup', handleSpace);
        };
    }, []);

    return (
        <PoseContainer
            visible={visible}
            className={clsx('spotlight', context.darkMode ? styles.dark : null)}
        >
            <div
                className={'input-group input-group-unstyled no-border-radius'}
            >
                <GlyphiconSpan
                    tooltip={false}
                    classes='input-group-addon spanfix'
                >
                    <Icon glyph='search' />
                </GlyphiconSpan>
                <input
                    onChange={handleSearch}
                    value={searchVal}
                    type='search'
                    className='form-control searchbox'
                    autoComplete='off'
                    placeholder='Explore Nodes'
                    data-type='search'
                />
            </div>

            <div className={styles.nodelist}>
                <Table>
                    <thead>
                        <tr>
                            <td>Node Label</td>
                            <td>Collapsed Into</td>
                        </tr>
                    </thead>
                    <tbody className='searchable'>
                        {Object.keys(data)
                            .sort()
                            .map(
                                function(key) {
                                    var d = data[key];
                                    var nid = parseInt(key);
                                    var x = regex.test(d[0]) ? (
                                        <SpotlightRow
                                            key={key}
                                            nodeId={nid}
                                            parentNodeId={d[1]}
                                            nodeLabel={d[0]}
                                            parentNodeLabel={d[2]}
                                            nodeType={d[3]}
                                            parentNodeType={d[4]}
                                        />
                                    ) : null;
                                    return x;
                                }.bind(this)
                            )}
                    </tbody>
                </Table>
            </div>
        </PoseContainer>
    );
};

SpotlightContainer.propTypes = {};
export default SpotlightContainer;
