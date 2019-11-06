import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {AsyncTypeahead} from 'react-bootstrap-typeahead';
import GlyphiconSpan from '../GlyphiconSpan';
import Icon from '../Icon';
import TabContainer from './TabContainer';
import { buildSearchQuery, buildSelectQuery } from 'utils';
import SearchRow from './SearchRow';
import styles from './SearchContainer.module.css';

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
    const [edgeIncluded, setEdgeIncluded] = useState(appStore.edgeincluded);
    const [darkMode, setDarkMode] = useState(false);
    

    const pathfinding = useRef(null);
    const tabs = useRef(null);
    const edgeFilter = useRef(null);
    const mainSearchRef = useRef(null);
    const pathSearchRef = useRef(null);

    useEffect(() => {
        jQuery(pathfinding.current).slideToggle(0);
        jQuery(tabs.current).slideToggle(0);
        jQuery(edgeFilter.current).animate({
            height: 'toggle',
            width: 'toggle'
        }, 'fast');
        
        setDarkMode(appStore.performance.darkMode);

        emitter.on('userNodeClicked', openNodeTab);
        emitter.on('groupNodeClicked', openNodeTab);
        emitter.on('computerNodeClicked', openNodeTab);
        emitter.on('domainNodeClicked', openNodeTab);
        emitter.on('gpoNodeClicked', openNodeTab);
        emitter.on('ouNodeClicked', openNodeTab);
        emitter.on('toggleDarkMode', toggleDarkMode);

        emitter.on(
            'setStart',
            (node) => {
                let temp = {
                    name: node.label,
                    objectid: node.objectid,
                    type: node.type
                }
                closeTooltip();
                setMainSearchSelected(temp);
                let instance = mainSearchRef.current.getInstance();
                instance.clear();
                instance.setState({text: temp.name});
            }
        );

        emitter.on('setEnd', (node) => {
            let temp = {
                name: node.label,
                objectid: node.objectid,
                type: node.type
            }
            closeTooltip();
            var elem = jQuery(pathfinding.current);
            if (!elem.is(':visible')){
                setPathfindingOpen(true);
                elem.slideToggle();
            }
            setPathSearchSelected(temp);
            let instance = pathSearchRef.current.getInstance();
            instance.clear();
            instance.setState({text: temp.name});
        });
    }, [])

    const doSearch = (query, source) =>{
        let session = driver.session();
        let [statement, term] = buildSearchQuery(query);
        if (source === 'main'){
            setMainSearchLoading(true)
        }else{
            setPathSearchLoading(true);
        }

        session.run(statement, {name: term}).then(result => {
            let data = [];
            for (let record of result.records){
                let properties = record._fields[0].properties;
                properties.type = record._fields[0].labels[0];
                data.push(properties);
            }

            if (source === 'main'){
                setMainSearchResults(data)
                setMainSearchLoading(false)
            }else{
                setPathSearchResults(data);
                setPathSearchLoading(false);
            }
            session.close();
        })
    };

    const toggleDarkMode = (enabled) => {
        setDarkMode(enabled);
    }

    const clearSection = (section) => {
        let current = edgeIncluded;
        if (section === 'default') {
            current.MemberOf = false;
            current.HasSession = false;
            current.AdminTo = false;
        } else if (section === 'acl') {
            current.AllExtendedRights = false;
            current.AddMember = false;
            current.ForceChangePassword = false;
            current.GenericAll = false;
            current.GenericWrite = false;
            current.Owns = false;
            current.WriteDacl = false;
            current.WriteOwner = false;
            current.ReadLAPSPassword = false;
        } else if (section === 'special') {
            current.CanRDP = false;
            current.ExecuteDCOM = false;
            current.AllowedToDelegate = false;
            current.AddAllowedToAct = false;
            current.AllowedToAct = false;
            current.SQLAdmin = false;
        } else {
            current.Contains = false;
            current.GpLink = false;
        }

        setEdgeIncluded(current);
        appStore.edgeincluded = current;
        conf.set('edgeincluded', current)
    }

    const setSection = (section) => {
        let current = edgeIncluded
        if (section === 'default') {
            current.MemberOf = true;
            current.HasSession = true;
            current.AdminTo = true;
        } else if (section === 'acl') {
            current.AllExtendedRights = true;
            current.AddMember = true;
            current.ForceChangePassword = true;
            current.GenericAll = true;
            current.GenericWrite = true;
            current.Owns = true;
            current.WriteDacl = true;
            current.WriteOwner = true;
            current.ReadLAPSPassword = true;
        } else if (section === 'special') {
            current.CanRDP = true;
            current.ExecuteDCOM = true;
            current.AllowedToDelegate = true;
            current.AddAllowedToAct = true;
            current.AllowedToAct = true;
            current.SQLAdmin = true;
        } else {
            current.Contains = true;
            current.GpLink = true;
        }

        setEdgeIncluded(current);
        appStore.edgeincluded = current;
        conf.set('edgeincluded', current)
    }

    const handleEdgeChange = (e) => {
        let current = edgeIncluded;
        let edgeName = e.target.getAttribute('name');
        current[edgeName] = !current[edgeName];
        setEdgeIncluded(current);
        appStore.edgeincluded = current;
        conf.set('edgeincluded', current)
    }

    const onFilterClick = () => {
        jQuery(edgeFilter.current).animate({
            height: 'toggle',
            width: 'toggle'
        }, 'medium');
    }

    const onPathfindClick = () => {
        jQuery(pathfinding.current).slideToggle();
        let open = !pathfindingOpen;
        setPathfindingOpen(open);
    }

    const onExpandClick = () => {
        jQuery(tabs.current).slideToggle();
    }

    const onPlayClick = () => {
        if (mainSearchSelected === null || pathSearchSelected === null || mainSearchSelected.objectid === pathSearchSelected.objectid){
            return;
        }

        let [query, props, startTarget, endTarget] = buildSelectQuery(mainSearchSelected, pathSearchSelected);
        emitter.emit('query', query, props, startTarget, endTarget);
    }

    const setSelection = (selection, source) => {
        if (selection.length === 0){
            return;
        }
        if (source === 'main'){
            setMainSearchSelected(selection[0]);
        }else{
            setPathSearchSelected(selection[0]);
        }
    }

    useEffect(() => {
        if (mainSearchSelected === null){
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

        if (stop){
            return;
        }

        let event = new Event('');
        event.keyCode = 13;
        onEnterPress(event);
        
    }, [mainSearchSelected])

    useEffect(() => {
        if (pathSearchSelected === null){
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

        if (stop){
            return;
        }

        let event = new Event('');
        event.keyCode = 13;
        onEnterPress(event);
        
    }, [pathSearchSelected])

    const openNodeTab = () => {
        let e = jQuery(tabs.current);
        if (!e.is(':visible')) {
            e.slideToggle();
        }
    }

    const onEnterPress = (event) => {
        let key = event.keyCode ? event.keyCode : event.which;
        
        if (key !== 13){
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

        if (stop){
            return;
        }

        if (!pathfindingOpen){
            if (mainSearchSelected === null){
                let [statement, prop] = buildSearchQuery(mainSearchValue);
                emitter.emit('searchQuery', statement, {
                    name: prop
                });
            }else{
                let statement = `MATCH (n:${mainSearchSelected.type} {objectid:{objectid}}) RETURN n`
                emitter.emit('searchQuery', statement, {objectid: mainSearchSelected.objectid})
            }
        }else{
            onPlayClick();
        }
    }

    return (
        <div id='searchdiv' className={darkMode ? 'searchdiv searchdiv-dark' : 'searchdiv searchdiv-light'}>
            <div ref={edgeFilter} className='edgeFilter'>
                <div>
                    <h3>Edge Filtering</h3>
                    <i
                        data-toggle='tooltip'
                        data-placement='right'
                        title='Filters edges in shortest path queries'
                        className='glyphicon glyphicon-question-sign'
                    />
                </div>
                <div className={'edge-filter-heading'}>
                    <h4>Default Edges</h4>
                    <button
                        onClick={() => {setSection('default')}}
                        className={'fa fa-check-double'}
                        data-toggle='tooltip'
                        data-placement='top'
                        title='Check all default edges'
                    />
                    <button
                        onClick={() => {this.clearSection('default')}}
                        className={'fa fa-eraser'}
                        data-toggle='tooltip'
                        data-placement='top'
                        title='Clear all default edges'
                    />
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        checked={edgeIncluded.MemberOf}
                        onChange={e => handleEdgeChange(e)}
                        name='MemberOf'
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='MemberOf'
                    >
                        {' '}
                        MemberOf
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='HasSession'
                        checked={edgeIncluded.HasSession}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='HasSession'
                    >
                        {' '}
                        HasSession
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='AdminTo'
                        checked={edgeIncluded.AdminTo}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='AdminTo'
                    >
                        {' '}
                        AdminTo
                    </label>
                </div>
                <div className={'edge-filter-heading'}>
                    <h4>ACL Edges</h4>
                    <button
                        onClick={() => setSection('acl')}
                        className={'fa fa-check-double'}
                        data-toggle='tooltip'
                        data-placement='top'
                        title='Check all ACL edges'
                    />
                    <button
                        onClick={() => clearSection('acl')}
                        className={'fa fa-eraser'}
                        data-toggle='tooltip'
                        data-placement='top'
                        title='Clear all ACL edges'
                    />
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='AllExtendedRights'
                        checked={edgeIncluded.AllExtendedRights}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='AllExtendedRights'
                    >
                        {' '}
                        AllExtendedRights
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='AddMember'
                        checked={edgeIncluded.AddMember}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='AddMember'
                    >
                        {' '}
                        AddMember
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='ForceChangePassword'
                        checked={
                            edgeIncluded.ForceChangePassword
                        }
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='ForceChangePassword'
                    >
                        {' '}
                        ForceChangePassword
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='GenericAll'
                        checked={edgeIncluded.GenericAll}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='GenericAll'
                    >
                        {' '}
                        GenericAll
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='GenericWrite'
                        checked={edgeIncluded.GenericWrite}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='GenericWrite'
                    >
                        {' '}
                        GenericWrite
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='Owns'
                        checked={edgeIncluded.Owns}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='Owns'
                    >
                        {' '}
                        Owns
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='WriteDacl'
                        checked={edgeIncluded.WriteDacl}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='WriteDacl'
                    >
                        {' '}
                        WriteDacl
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='WriteOwner'
                        checked={edgeIncluded.WriteOwner}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='WriteOwner'
                    >
                        {' '}
                        WriteOwner
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='ReadLAPSPassword'
                        checked={edgeIncluded.ReadLAPSPassword}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='ReadLAPSPassword'
                    >
                        {' '}
                        ReadLAPSPassword
                    </label>
                </div>
                <div className={'edge-filter-heading'}>
                    <h4>Containers</h4>
                    <button
                        onClick={x => setSection('containers')}
                        className={'fa fa-check-double'}
                        data-toggle='tooltip'
                        data-placement='top'
                        title='Check all Containers edges'
                    />
                    <button
                        onClick={x => clearSection('containers')}
                        className={'fa fa-eraser'}
                        data-toggle='tooltip'
                        data-placement='top'
                        title='Clear all Containers edges'
                    />
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='Contains'
                        checked={edgeIncluded.Contains}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='Contains'
                    >
                        {' '}
                        Contains
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='GpLink'
                        checked={edgeIncluded.GpLink}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='GpLink'
                    >
                        {' '}
                        GpLink
                    </label>
                </div>
                <div className={'edge-filter-heading'}>
                    <h4>Special</h4>
                    <button
                        onClick={x => setSection('special')}
                        className={'fa fa-check-double'}
                        data-toggle='tooltip'
                        data-placement='top'
                        title='Check all special edges'
                    />
                    <button
                        onClick={x => clearSection('special')}
                        className={'fa fa-eraser'}
                        data-toggle='tooltip'
                        data-placement='top'
                        title='Clear all special edges'
                    />
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='CanRDP'
                        checked={edgeIncluded.CanRDP}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='CanRDP'
                    >
                        {' '}
                        CanRDP
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='ExecuteDCOM'
                        checked={edgeIncluded.ExecuteDCOM}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='ExecuteDCOM'
                    >
                        {' '}
                        ExecuteDCOM
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='AllowedToDelegate'
                        checked={edgeIncluded.AllowedToDelegate}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='AllowedToDelegate'
                    >
                        {' '}
                        AllowedToDelegate
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='AddAllowedToAct'
                        checked={edgeIncluded.AddAllowedToAct}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='AddAllowedToAct'
                    >
                        {' '}
                        AddAllowedToAct
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='AllowedToAct'
                        checked={edgeIncluded.AllowedToAct}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='AllowedToAct'
                    >
                        {' '}
                        AllowedToAct
                    </label>
                </div>
                <div>
                    <input
                        className='checkbox-inline'
                        type='checkbox'
                        name='SQLAdmin'
                        checked={edgeIncluded.SQLAdmin}
                        onChange={e => handleEdgeChange(e)}
                    />
                    <label
                        onClick={e => handleEdgeChange(e)}
                        name='SQLAdmin'
                    >
                        {' '}
                        SQLAdmin
                    </label>
                </div>
            </div>
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
                        let name = (option.name || option.objectid).toLowerCase();
                        let id = option.objectid.toLowerCase();
                        let search;
                        if (props.text.includes(':')){
                            search = props.text.split(':')[1];
                        }else{
                            search = props.text.toLowerCase()
                        }
                        return name.includes(search) || id.includes(search)
                    }}
                    placeholder={pathfindingOpen ? 'Start Node' : 'Start typing to search for a node...'}
                    isLoading={mainSearchLoading}
                    delay={500}
                    renderMenuItemChildren={SearchRow}
                    labelKey={option => {
                        return option.name || option.objectid;
                    }}
                    useCache={false}
                    options={mainSearchResults}
                    onSearch={
                        query => doSearch(query, 'main')
                    }
                    inputProps={
                        {className:'searchbox', id: styles.searcha}
                    }
                    onKeyDown={(event) => onEnterPress(event)}
                    onChange={(selection) => setSelection(selection, 'main')}
                    onInputChange={(event) => {
                            setMainSearchSelected(null); 
                            setMainSearchValue(event)
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
                        <Icon
                            glyph='menu-hamburger'
                            extraClass='menuglyph'
                        />
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
                            let name = option.name.toLowerCase();
                            let id = option.objectid.toLowerCase();
                            let search = props.text.toLowerCase()
                            return name.includes(search) || id.includes(search)
                        }}
                        useCache={false}
                        options={pathSearchResults}
                        onSearch={
                            query => doSearch(query, 'secondary')
                        }
                        onKeyDown={(event) => onEnterPress(event)}
                        onChange={(selection) => setSelection(selection, 'secondary')}
                        onInputChange={(event) => {
                            setPathSearchValue(event);
                            setPathSearchSelected(null)   
                        }}
                        inputProps={
                            {className:'searchbox',id: styles.searchb}
                        } />
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
    )
}

SearchContainer.propTypes = {

}
export default SearchContainer;