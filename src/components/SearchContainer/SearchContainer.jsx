import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import GlyphiconSpan from '../GlyphiconSpan';
import Icon from '../Icon';
import TabContainer from './TabContainer';
import { buildSearchQuery, buildSelectQuery } from 'utils';
import SearchRow from './SearchRow';
import styles from './SearchContainer.module.css';
import EdgeFilter from './EdgeFilter';

const SearchContainer = () => {
    const [pathfindingOpen, setPathfindingOpen] = useState(false);
    const [mainSearchValue, setMainSearchValue] = useState('');
    const [mainSearchResults, setMainSearchResults] = useState([]);
    const [mainSearchSelected, setMainSearchSelected] = useState(null);
    const [mainSearchLoading, setMainSearchLoading] = useState(false);
    const [pathSearchValue, setPathSearchValue] = useState('');
    const [pathSearchResults, setPathSearchResults] = useState([]);
    const [pathSearchSelected, setPathSearchSelected] = useState(null);
    const [pathSearchLoading, setPathSearchLoading] = useState(false);

    const [filterVisible, setFilterVisible] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const pathfinding = useRef(null);
    const tabs = useRef(null);

    const mainSearchRef = useRef(null);
    const pathSearchRef = useRef(null);

    useEffect(() => {
        jQuery(pathfinding.current).slideToggle(0);
        jQuery(tabs.current).slideToggle(0);

        setDarkMode(appStore.performance.darkMode);
        emitter.on('nodeClicked', openNodeTab);
        emitter.on('toggleDarkMode', toggleDarkMode);

        emitter.on('setStart', node => {
            let temp = {
                name: node.label,
                objectid: node.objectid,
                type: node.type,
            };
            closeTooltip();
            setMainSearchSelected(temp);
            let instance = mainSearchRef.current.getInstance();
            instance.clear();
            instance.setState({ text: temp.name });
        });

        emitter.on('setEnd', node => {
            let temp = {
                name: node.label,
                objectid: node.objectid,
                type: node.type,
            };
            closeTooltip();
            var elem = jQuery(pathfinding.current);
            if (!elem.is(':visible')) {
                setPathfindingOpen(true);
                elem.slideToggle();
            }
            setPathSearchSelected(temp);
            let instance = pathSearchRef.current.getInstance();
            instance.clear();
            instance.setState({ text: temp.name });
        });
    }, []);

    const doSearch = (query, source) => {
        let session = driver.session();
        let [statement, term] = buildSearchQuery(query);
        if (source === 'main') {
            setMainSearchLoading(true);
        } else {
            setPathSearchLoading(true);
        }

        session.run(statement, { name: term }).then(result => {
            let data = [];
            for (let record of result.records) {
                let properties = record._fields[0].properties;
                properties.type = record._fields[0].labels[0];
                data.push(properties);
            }

            if (source === 'main') {
                setMainSearchResults(data);
                setMainSearchLoading(false);
            } else {
                setPathSearchResults(data);
                setPathSearchLoading(false);
            }
            session.close();
        });
    };

    const toggleDarkMode = enabled => {
        setDarkMode(enabled);
    };

    const onFilterClick = () => {
        setFilterVisible(!filterVisible);
    };

    const onPathfindClick = () => {
        jQuery(pathfinding.current).slideToggle();
        let open = !pathfindingOpen;
        setPathfindingOpen(open);
    };

    const onExpandClick = () => {
        jQuery(tabs.current).slideToggle();
    };

    const onPlayClick = () => {
        if (
            mainSearchSelected === null ||
            pathSearchSelected === null ||
            mainSearchSelected.objectid === pathSearchSelected.objectid
        ) {
            return;
        }

        let [query, props, startTarget, endTarget] = buildSelectQuery(
            mainSearchSelected,
            pathSearchSelected
        );

        mainSearchRef.current.getInstance().blur();
        pathSearchRef.current.getInstance().blur();
        emitter.emit('query', query, props, startTarget, endTarget);
    };

    const setSelection = (selection, source) => {
        if (selection.length === 0) {
            return;
        }
        if (source === 'main') {
            setMainSearchSelected(selection[0]);
        } else {
            setPathSearchSelected(selection[0]);
        }
    };

    useEffect(() => {
        if (mainSearchSelected === null) {
            return;
        }

        let stop = false;
        if (!$('.searchSelectorS > ul').is(':hidden')) {
            $('.searchSelectorS > ul li').each(function(i) {
                if ($(this).hasClass('active')) {
                    stop = true;
                }
            });
        }

        if (!$('.searchSelectorP > ul').is(':hidden')) {
            $('.searchSelectorP > ul li').each(function(i) {
                if ($(this).hasClass('active')) {
                    stop = true;
                }
            });
        }

        if (stop) {
            return;
        }

        let event = new Event('');
        event.keyCode = 13;
        onEnterPress(event);
    }, [mainSearchSelected]);

    useEffect(() => {
        if (pathSearchSelected === null) {
            return;
        }

        let stop = false;
        if (!$('.searchSelectorS > ul').is(':hidden')) {
            $('.searchSelectorS > ul li').each(function(i) {
                if ($(this).hasClass('active')) {
                    stop = true;
                }
            });
        }

        if (!$('.searchSelectorP > ul').is(':hidden')) {
            $('.searchSelectorP > ul li').each(function(i) {
                if ($(this).hasClass('active')) {
                    stop = true;
                }
            });
        }

        if (stop) {
            return;
        }

        let event = new Event('');
        event.keyCode = 13;
        onEnterPress(event);
    }, [pathSearchSelected]);

    const openNodeTab = () => {
        let e = jQuery(tabs.current);
        if (!e.is(':visible')) {
            e.slideToggle();
        }
    };

    const onEnterPress = event => {
        let key = event.keyCode ? event.keyCode : event.which;

        if (key !== 13) {
            return;
        }

        let stop = false;
        if (!$('.searchSelectorS > ul').is(':hidden')) {
            $('.searchSelectorS > ul li').each(function(i) {
                if ($(this).hasClass('active')) {
                    stop = true;
                }
            });
        }

        if (!$('.searchSelectorP > ul').is(':hidden')) {
            $('.searchSelectorP > ul li').each(function(i) {
                if ($(this).hasClass('active')) {
                    stop = true;
                }
            });
        }

        if (stop) {
            return;
        }

        mainSearchRef.current.getInstance().blur();
        pathSearchRef.current.getInstance().blur();

        if (!pathfindingOpen) {
            if (mainSearchSelected === null) {
                let [statement, prop] = buildSearchQuery(mainSearchValue);
                emitter.emit('searchQuery', statement, {
                    name: prop,
                });
            } else {
                let statement = `MATCH (n:${mainSearchSelected.type} {objectid:$objectid}) RETURN n`;
                emitter.emit('searchQuery', statement, {
                    objectid: mainSearchSelected.objectid,
                });
            }
        } else {
            onPlayClick();
        }
    };

    return (
        <div
            id='searchdiv'
            className={
                darkMode
                    ? 'searchdiv searchdiv-dark'
                    : 'searchdiv searchdiv-light'
            }
        >
            <EdgeFilter open={filterVisible} />
            <div className='input-group input-group-unstyled searchSelectorS'>
                <GlyphiconSpan
                    tooltip
                    tooltipDir='bottom'
                    tooltipTitle='More Info'
                    classes='input-group-addon spanfix glyph-hover-style'
                    click={() => onExpandClick()}
                >
                    <Icon glyph='menu-hamburger' extraClass='menuglyph' />
                </GlyphiconSpan>
                <AsyncTypeahead
                    id={'mainSearchBar'}
                    filterBy={(option, props) => {
                        let name = (
                            option.name || option.objectid
                        ).toLowerCase();
                        let id =
                            option.objectid != null
                                ? option.objectid.toLowerCase()
                                : '';
                        let search;
                        if (props.text.includes(':')) {
                            search = props.text.split(':')[1];
                        } else {
                            search = props.text.toLowerCase();
                        }
                        return name.includes(search) || id.includes(search);
                    }}
                    placeholder={
                        pathfindingOpen
                            ? 'Start Node'
                            : 'Start typing to search for a node...'
                    }
                    isLoading={mainSearchLoading}
                    delay={500}
                    renderMenuItemChildren={SearchRow}
                    labelKey={option => {
                        return option.name || option.objectid;
                    }}
                    useCache={false}
                    options={mainSearchResults}
                    onSearch={query => doSearch(query, 'main')}
                    inputProps={{ className: 'searchbox', id: styles.searcha }}
                    onKeyDown={event => onEnterPress(event)}
                    onChange={selection => setSelection(selection, 'main')}
                    onInputChange={event => {
                        setMainSearchSelected(null);
                        setMainSearchValue(event);
                    }}
                    ref={mainSearchRef}
                />
                <GlyphiconSpan
                    tooltip
                    tooltipDir='bottom'
                    tooltipTitle='Pathfinding'
                    classes='input-group-addon spanfix glyph-hover-style'
                    click={() => onPathfindClick()}
                >
                    <Icon glyph='road' extraClass='menuglyph' />
                </GlyphiconSpan>
                <GlyphiconSpan
                    tooltip
                    tooltipDir='bottom'
                    tooltipTitle='Back'
                    classes='input-group-addon spanfix glyph-hover-style'
                    click={function() {
                        emitter.emit('graphBack');
                    }}
                >
                    <Icon glyph='step-backward' extraClass='menuglyph' />
                </GlyphiconSpan>
                <GlyphiconSpan
                    tooltip
                    tooltipDir='bottom'
                    tooltipTitle='Filter Edge Types'
                    classes='input-group-addon spanfix glyph-hover-style'
                    click={() => onFilterClick()}
                >
                    <Icon glyph='filter' extraClass='menuglyph' />
                </GlyphiconSpan>
            </div>
            <div ref={pathfinding}>
                <div className='input-group input-group-unstyled searchSelectorP'>
                    <GlyphiconSpan
                        tooltip={false}
                        classes='input-group-addon spanfix invisible'
                    >
                        <Icon glyph='menu-hamburger' extraClass='menuglyph' />
                    </GlyphiconSpan>
                    <AsyncTypeahead
                        ref={pathSearchRef}
                        id={'pathSearchbar'}
                        placeholder={'Target Node'}
                        isLoading={pathSearchLoading}
                        delay={500}
                        renderMenuItemChildren={SearchRow}
                        labelKey={option => {
                            return option.name || option.objectid;
                        }}
                        filterBy={(option, props) => {
                            let name = (
                                option.name || option.objectid
                            ).toLowerCase();
                            let id =
                                option.objectid != null
                                    ? option.objectid.toLowerCase()
                                    : '';
                            let search;
                            if (props.text.includes(':')) {
                                search = props.text.split(':')[1];
                            } else {
                                search = props.text.toLowerCase();
                            }
                            return name.includes(search) || id.includes(search);
                        }}
                        useCache={false}
                        options={pathSearchResults}
                        onSearch={query => doSearch(query, 'secondary')}
                        onKeyDown={event => onEnterPress(event)}
                        onChange={selection =>
                            setSelection(selection, 'secondary')
                        }
                        onInputChange={event => {
                            setPathSearchValue(event);
                            setPathSearchSelected(null);
                        }}
                        inputProps={{
                            className: 'searchbox',
                            id: styles.searchb,
                        }}
                    />
                    <GlyphiconSpan
                        tooltip={false}
                        classes='input-group-addon spanfix invisible'
                    >
                        <Icon glyph='road' extraClass='menuglyph' />
                    </GlyphiconSpan>
                    <GlyphiconSpan
                        tooltip
                        tooltipDir='bottom'
                        tooltipTitle='Find Path'
                        classes='input-group-addon spanfix glyph-hover-style'
                        click={() => onPlayClick()}
                    >
                        <Icon glyph='play' extraClass='menuglyph' />
                    </GlyphiconSpan>
                </div>
            </div>

            <div id='tabcontainer' ref={tabs}>
                <TabContainer />
            </div>
        </div>
    );
};

SearchContainer.propTypes = {};
export default SearchContainer;
