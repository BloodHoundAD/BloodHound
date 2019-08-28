import React, { Component } from 'react';
import GlyphiconSpan from '../GlyphiconSpan';
import Icon from '../Icon';
import TabContainer from './TabContainer';
import { buildSearchQuery, buildSelectQuery } from 'utils';
import SearchRow from './SearchRow';
import ReactDOMServer from 'react-dom/server';

const SEPARATOR = '#BLOODHOUNDSEPARATOR#';

export default class SearchContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            mainPlaceholder: 'Start typing to search for a node...',
            pathfindingIsOpen: false,
            mainValue: '',
            pathfindValue: '',
            edgeincluded: appStore.edgeincluded,
            darkMode: false,
        };
    }

    componentDidMount() {
        jQuery(this.refs.pathfinding).slideToggle(0);
        jQuery(this.refs.tabs).slideToggle(0);
        jQuery(this.refs.edgeFilter).animate(
            {
                height: 'toggle',
                width: 'toggle',
            },
            'fast'
        );

        this.toggleDarkMode(appStore.performance.darkMode);

        emitter.on('userNodeClicked', this.openNodeTab.bind(this));
        emitter.on('groupNodeClicked', this.openNodeTab.bind(this));
        emitter.on('computerNodeClicked', this.openNodeTab.bind(this));
        emitter.on('domainNodeClicked', this.openNodeTab.bind(this));
        emitter.on('gpoNodeClicked', this.openNodeTab.bind(this));
        emitter.on('ouNodeClicked', this.openNodeTab.bind(this));
        emitter.on('toggleDarkMode', this.toggleDarkMode.bind(this));
        emitter.on(
            'setStart',
            function(payload) {
                closeTooltip();
                jQuery(this.refs.searchbar).val(payload);
            }.bind(this)
        );

        emitter.on(
            'setEnd',
            function(payload) {
                closeTooltip();
                jQuery(this.refs.pathbar).val(payload);
                var e = jQuery(this.refs.pathfinding);
                if (!e.is(':visible')) {
                    this.setState({ pathfindingIsOpen: true });
                    e.slideToggle();
                }
            }.bind(this)
        );

        jQuery(this.refs.searchbar).typeahead({
            source: function(query, process) {
                let session = driver.session();
                let [statement, term] = buildSearchQuery(query);

                session.run(statement, { name: term }).then(x => {
                    let data = [];
                    let map = {};
                    $.each(x.records, (index, record) => {
                        let props = record._fields[0].properties;
                        Object.assign(props, {
                            type: record._fields[0].labels[0],
                        });
                        map[index] = props;
                        data.push(`${props.name}${SEPARATOR}${index}`);
                    });

                    this.map = map;
                    session.close();
                    return process(data);
                });
            },
            afterSelect: function(selected) {
                if (!this.state.pathfindingIsOpen) {
                    let props = {};
                    let statement = '';
                    if (selected.type === 'OU') {
                        statement = `MATCH (n:${
                            selected.type
                        }) WHERE n.guid = {guid} RETURN n`;
                        props = { guid: selected.guid };
                    } else {
                        statement = `MATCH (n:${
                            selected.type
                        }) WHERE n.name = {name} RETURN n`;
                        props = { name: selected.name };
                    }

                    emitter.emit('searchQuery', statement, props);
                } else {
                    let start = jQuery(this.refs.searchbar).val();
                    let end = jQuery(this.refs.pathbar).val();

                    if (start === '' || end === '') {
                        return;
                    }

                    if (start === end) {
                        return;
                    }

                    let [query, startTerm, endTerm] = buildSelectQuery(
                        start,
                        end
                    );

                    emitter.emit(
                        'query',
                        query,
                        { aprop: startTerm, bprop: endTerm },
                        startTerm,
                        endTerm
                    );
                }
            }.bind(this),
            autoSelect: false,
            updater: function(item) {
                let spl = item.split(SEPARATOR);
                let index = spl[1];
                let obj = this.map[index];
                return obj;
            },
            matcher: function(item) {
                let spl = item.split(SEPARATOR);
                let name = spl[0];
                let index = spl[1];
                let obj = this.map[index];

                let searchTerm = this.query;
                if (this.query.includes(':')) {
                    searchTerm = searchTerm.split(':')[1];
                }
                if (
                    name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
                ) {
                    return true;
                } else if (
                    obj.hasOwnProperty('guid') &&
                    obj['guid']
                        .toLowerCase()
                        .indexOf(searchTerm.toLowerCase()) !== -1
                ) {
                    return true;
                } else {
                    return false;
                }
            },
            highlighter: function(item) {
                let [name, index] = item.split(SEPARATOR);
                let obj = this.map[index];
                let searchTerm = this.query;
                if (this.query.includes(':')) {
                    searchTerm = searchTerm.split(':')[1];
                }

                return ReactDOMServer.renderToString(
                    <SearchRow key={index} item={obj} search={searchTerm} />
                );
            },
        });

        jQuery(this.refs.pathbar).typeahead({
            source: function(query, process) {
                let session = driver.session();
                let [statement, term] = buildSearchQuery(query);

                session.run(statement, { name: term }).then(x => {
                    let data = [];
                    let map = {};
                    $.each(x.records, (index, record) => {
                        let props = record._fields[0].properties;
                        Object.assign(props, {
                            type: record._fields[0].labels[0],
                        });
                        map[index] = props;
                        data.push(`${props.name}${SEPARATOR}${index}`);
                        index++;
                    });

                    this.map = map;
                    session.close();
                    return process(data);
                });
            },
            afterSelect: function(_) {
                let start = jQuery(this.refs.searchbar).val();
                let end = jQuery(this.refs.pathbar).val();

                if (start === '' || end === '') {
                    return;
                }

                if (start === end) {
                    return;
                }

                let [query, startTerm, endTerm] = buildSelectQuery(start, end);

                emitter.emit(
                    'query',
                    query,
                    { aprop: startTerm, bprop: endTerm },
                    startTerm,
                    endTerm
                );
            }.bind(this),
            autoSelect: false,
            updater: function(item) {
                let spl = item.split(SEPARATOR);
                let index = spl[1];
                let obj = this.map[index];
                return obj;
            },
            matcher: function(item) {
                let spl = item.split(SEPARATOR);
                let name = spl[0];
                let index = spl[1];
                let obj = this.map[index];

                let searchTerm = this.query;
                if (this.query.includes(':')) {
                    searchTerm = searchTerm.split(':')[1];
                }
                if (
                    name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
                ) {
                    return true;
                } else if (
                    obj.hasOwnProperty('guid') &&
                    obj['guid']
                        .toLowerCase()
                        .indexOf(searchTerm.toLowerCase()) !== -1
                ) {
                    return true;
                } else {
                    return false;
                }
            },
            highlighter: function(item) {
                let [name, index] = item.split(SEPARATOR);
                let obj = this.map[index];
                let searchTerm = this.query;
                if (this.query.includes(':')) {
                    searchTerm = searchTerm.split(':')[1];
                }

                return ReactDOMServer.renderToString(
                    <SearchRow key={index} item={obj} search={searchTerm} />
                );
            },
        });
    }

    toggleDarkMode(enabled) {
        this.setState({ darkMode: enabled });
    }

    clearSection(section) {
        let current = this.state.edgeincluded;
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

        this.setState({ edgeincluded: current });
        appStore.edgeincluded = current;
        conf.set('edgeincluded', current);
    }

    setSection(section) {
        let current = this.state.edgeincluded;
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

        this.setState({ edgeincluded: current });
        appStore.edgeincluded = current;
        conf.set('edgeincluded', current);
    }

    handleChange(event) {
        let current = this.state.edgeincluded;
        let eName = event.target.getAttribute('name');
        current[eName] = !current[eName];
        this.setState({ edgeincluded: current });

        appStore.edgeincluded = current;
        conf.set('edgeincluded', current);
    }

    _onFilterClick() {
        jQuery(this.refs.edgeFilter).animate(
            {
                height: 'toggle',
                width: 'toggle',
            },
            'medium'
        );
    }

    _onPathfindClick() {
        jQuery(this.refs.pathfinding).slideToggle();
        var p = !this.state.pathfindingIsOpen;
        var t = this.state.pathfindingIsOpen
            ? 'Start typing to search for a node...'
            : 'Start Node';
        this.setState({
            pathfindingIsOpen: p,
            mainPlaceholder: t,
        });
    }

    _onPlayClick() {
        let start = jQuery(this.refs.searchbar).val();
        let end = jQuery(this.refs.pathbar).val();

        if (start === '' || end === '') {
            return;
        }

        if (start === end) {
            return;
        }

        let [query, startTerm, endTerm] = buildSelectQuery(start, end);
        emitter.emit(
            'query',
            query,
            { aprop: startTerm, bprop: endTerm },
            startTerm,
            endTerm
        );
    }

    _onExpandClick() {
        jQuery(this.refs.tabs).slideToggle();
    }

    openNodeTab() {
        var e = jQuery(this.refs.tabs);
        if (!e.is(':visible')) {
            e.slideToggle();
        }
    }

    _inputKeyPress(e) {
        let key = e.keyCode ? e.keyCode : e.which;
        let start = jQuery(this.refs.searchbar).val();
        let end = jQuery(this.refs.pathbar).val();
        let stop = false;

        if (key === 13) {
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
            if (!this.state.pathfindingIsOpen) {
                if (start !== '') {
                    if (start.includes(':')) {
                        let spl = start.split(':');
                        let type = spl[0];
                        let search = spl[1];
                        let statement = '';
                        let regex = '';

                        let labels = [
                            'OU',
                            'GPO',
                            'User',
                            'Computer',
                            'Group',
                            'Domain',
                        ];
                        $.each(labels, function(_, l) {
                            if (l.toLowerCase() === type.toLowerCase()) {
                                type = l;
                            }
                        });
                        if (type === 'OU') {
                            statement = 'MATCH (n:{}) WHERE n.name =~ {search} OR n.guid =~ {search} RETURN n'.format(
                                type
                            );
                            regex = '(?i).*' + search + '.*';
                        } else {
                            statement = 'MATCH (n:{}) WHERE n.name =~ {search} RETURN n'.format(
                                type
                            );
                            regex = '(?i).*' + search + '.*';
                        }

                        emitter.emit('searchQuery', statement, {
                            search: regex,
                        });
                    } else {
                        var statement =
                            'MATCH (n) WHERE n.name =~ {regex} RETURN n';
                        var regex = '(?i).*' + start + '.*';
                        emitter.emit('searchQuery', statement, {
                            regex: regex,
                        });
                    }
                }
            } else {
                if (start === '' || end === '') {
                    return;
                }

                if (start === end) {
                    return;
                }

                let [query, startTerm, endTerm] = buildSelectQuery(start, end);

                emitter.emit(
                    'query',
                    query,
                    { aprop: startTerm, bprop: endTerm },
                    startTerm,
                    endTerm
                );
            }
        }
    }

    render() {
        return (
            <div
                id='searchdiv'
                className={
                    this.state.darkMode
                        ? 'searchdiv searchdiv-dark'
                        : 'searchdiv searchdiv-light'
                }
            >
                <div ref='edgeFilter' className='edgeFilter'>
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
                            onClick={x => this.setSection('default')}
                            className={'fa fa-check-double'}
                            data-toggle='tooltip'
                            data-placement='top'
                            title='Check all default edges'
                        />
                        <button
                            onClick={x => this.clearSection('default')}
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
                            checked={this.state.edgeincluded.MemberOf}
                            onChange={this.handleChange.bind(this)}
                            name='MemberOf'
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.HasSession}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.AdminTo}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
                            name='AdminTo'
                        >
                            {' '}
                            AdminTo
                        </label>
                    </div>
                    <div className={'edge-filter-heading'}>
                        <h4>ACL Edges</h4>
                        <button
                            onClick={x => this.setSection('acl')}
                            className={'fa fa-check-double'}
                            data-toggle='tooltip'
                            data-placement='top'
                            title='Check all ACL edges'
                        />
                        <button
                            onClick={x => this.clearSection('acl')}
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
                            checked={this.state.edgeincluded.AllExtendedRights}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.AddMember}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                                this.state.edgeincluded.ForceChangePassword
                            }
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.GenericAll}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.GenericWrite}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.Owns}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.WriteDacl}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.WriteOwner}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.ReadLAPSPassword}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
                            name='ReadLAPSPassword'
                        >
                            {' '}
                            ReadLAPSPassword
                        </label>
                    </div>
                    <div className={'edge-filter-heading'}>
                        <h4>Containers</h4>
                        <button
                            onClick={x => this.setSection('containers')}
                            className={'fa fa-check-double'}
                            data-toggle='tooltip'
                            data-placement='top'
                            title='Check all Containers edges'
                        />
                        <button
                            onClick={x => this.clearSection('containers')}
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
                            checked={this.state.edgeincluded.Contains}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.GpLink}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
                            name='GpLink'
                        >
                            {' '}
                            GpLink
                        </label>
                    </div>
                    <div className={'edge-filter-heading'}>
                        <h4>Special</h4>
                        <button
                            onClick={x => this.setSection('special')}
                            className={'fa fa-check-double'}
                            data-toggle='tooltip'
                            data-placement='top'
                            title='Check all special edges'
                        />
                        <button
                            onClick={x => this.clearSection('special')}
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
                            checked={this.state.edgeincluded.CanRDP}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.ExecuteDCOM}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.AllowedToDelegate}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.AddAllowedToAct}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.AllowedToAct}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                            checked={this.state.edgeincluded.SQLAdmin}
                            onChange={this.handleChange.bind(this)}
                        />
                        <label
                            onClick={this.handleChange.bind(this)}
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
                        click={this._onExpandClick.bind(this)}
                    >
                        <Icon glyph='menu-hamburger' extraClass='menuglyph' />
                    </GlyphiconSpan>
                    <input
                        ref='searchbar'
                        onKeyDown={this._inputKeyPress.bind(this)}
                        type='search'
                        className='form-control searchbox'
                        autoComplete='off'
                        placeholder={this.state.mainPlaceholder}
                    />
                    <GlyphiconSpan
                        tooltip
                        tooltipDir='bottom'
                        tooltipTitle='Pathfinding'
                        classes='input-group-addon spanfix glyph-hover-style'
                        click={this._onPathfindClick.bind(this)}
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
                        click={this._onFilterClick.bind(this)}
                    >
                        <Icon glyph='filter' extraClass='menuglyph' />
                    </GlyphiconSpan>
                </div>
                <div ref='pathfinding'>
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
                        <input
                            ref='pathbar'
                            onKeyDown={this._inputKeyPress.bind(this)}
                            type='search'
                            className='form-control searchbox'
                            autoComplete='off'
                            placeholder='Target Node'
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
                            click={this._onPlayClick.bind(this)}
                        >
                            <Icon glyph='play' extraClass='menuglyph' />
                        </GlyphiconSpan>
                    </div>
                </div>

                <div id='tabcontainer' ref='tabs'>
                    <TabContainer />
                </div>
            </div>
        );
    }
}
