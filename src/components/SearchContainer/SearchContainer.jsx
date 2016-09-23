import React, { Component } from 'react';
import GlyphiconSpan from '../GlyphiconSpan'
import Icon from '../Icon'
import { escapeRegExp, fullAjax } from 'utils';
import TabContainer from './TabContainer'

export default class SearchContainer extends Component {
    constructor(props){
        super(props)

        this.state = {
            mainPlaceholder:"Start typing to search for a node...",
            pathfindingIsOpen: false,
            mainValue: "",
            pathfindValue: ""
        }
    }

    _onPathfindClick(){
        jQuery(this.refs.pathfinding).slideToggle()
        var p = !this.state.pathfindingIsOpen
        var t = this.state.pathfindingIsOpen ? "Start typing to search for a node..." : "Start Node" 
        this.setState({
            pathfindingIsOpen: p,
            mainPlaceholder: t
        })
    }

    _onPlayClick(){
        var start = jQuery(this.refs.searchbar).val()
        var end = jQuery(this.refs.pathbar).val()
        if (start !== "" && end !== ""){
            emitter.emit('pathQuery', start, end)
        }
    }

    _onExpandClick(){
        jQuery(this.refs.tabs).slideToggle()
    }

    openNodeTab(){
        var e = jQuery(this.refs.tabs)
        if (!(e.is(":visible"))){
            e.slideToggle()
        }
    }

    componentDidMount() {
        jQuery(this.refs.pathfinding).slideToggle(0);
        jQuery(this.refs.tabs).slideToggle(0);
        emitter.on('userNodeClicked', this.openNodeTab.bind(this))
        emitter.on('groupNodeClicked', this.openNodeTab.bind(this))
        emitter.on('computerNodeClicked', this.openNodeTab.bind(this))
        emitter.on('domainNodeClicked', this.openNodeTab.bind(this))
        emitter.on('setStart', function(payload){
            jQuery(this.refs.searchbar).val(payload);
        }.bind(this))

        emitter.on('setEnd', function(payload){
            jQuery(this.refs.pathbar).val(payload);
            var e = jQuery(this.refs.pathfinding)
            if (!(e.is(":visible"))){
                e.slideToggle()
            }
        }.bind(this))

        jQuery(this.refs.searchbar).typeahead({
            source: function(query, process) {
                var session = driver.session()
                var t = '(?i).*' + query + '.*'
                var data = []
                session.run("MATCH (n) WHERE n.name =~ {name} RETURN n.name LIMIT 10", {name:t})
                    .then(function(results){
                        $.each(results.records, function(index, record){
                            data.push(record._fields[0])
                        })
                        session.close()
                        return process(data)
                    })
            },
            afterSelect: function(selected) {
                if (!this.state.pathfindingIsOpen) {
                    var statement = "MATCH (n) WHERE n.name = {name} RETURN n"
                    emitter.emit('searchQuery', statement, {name: selected})
                } else {
                    var start = jQuery(this.refs.searchbar).val();
                    var end = jQuery(this.refs.pathbar).val();
                    if (start !== "" && end !== "") {
                        emitter.emit('pathQuery', start, end);
                    }
                }
            }.bind(this),
            autoSelect: false
            }
        )

        jQuery(this.refs.pathbar).typeahead({
            source: function(query, process) {
                var session = driver.session()
                var t = '(?i).*' + query + '.*'
                var data = []
                session.run("MATCH (n) WHERE n.name =~ {name} RETURN n.name LIMIT 10", {name:t})
                    .then(function(results){
                        $.each(results.records, function(index, record){
                            data.push(record._fields[0])
                        })
                        session.close()
                        return process(data)
                    })
            },
            afterSelect: function(selected) {
                var start = jQuery(this.refs.searchbar).val();
                var end = jQuery(this.refs.pathbar).val();
                if (start !== "" && end !== "") {
                    emitter.emit('pathQuery', start, end);
                }
            }.bind(this),
            autoSelect: false
            }
        )
    }

    _inputKeyPress(e){
        var key = e.keyCode ? e.keyCode : e.which
        var start = jQuery(this.refs.searchbar).val();
        var end = jQuery(this.refs.pathbar).val();
        var stop = false;

        if (key === 13){
            if (!$('.searchSelectorS > ul').is(':hidden')){
                $('.searchSelectorS > ul li').each(function(i){
                    if($(this).hasClass('active')){
                        stop = true
                    }
                })    
            }

            if (!$('.searchSelectorP > ul').is(':hidden')){
                $('.searchSelectorP > ul li').each(function(i){
                    if($(this).hasClass('active')){
                        stop = true
                    }
                })
            }
            if (stop){
                return;
            }
            if (!this.state.pathfindingIsOpen) {
                if (start !== ""){
                    var statement = "MATCH (n) WHERE n.name =~ '(?i).*{}.*' RETURN n".format(escapeRegExp(start));
                    emitter.emit('searchQuery', statement)    
                }
            } else {
                var start = jQuery(this.refs.searchbar).val();
                var end = jQuery(this.refs.pathbar).val();
                if (start !== "" && end !== "") {
                    emitter.emit('pathQuery', start, end);
                }
            }
        }
    }

    render(){
        return (
            <div className="searchdiv">
                <div className="input-group input-group-unstyled searchSelectorS">
                    <GlyphiconSpan 
                        tooltip={true} 
                        tooltipDir="bottom" 
                        tooltipTitle="More Info" 
                        classes="input-group-addon spanfix"
                        click={this._onExpandClick.bind(this)}>
                        <Icon glyph="menu-hamburger" extraClass="menuglyph" />
                    </GlyphiconSpan>
                    <input ref="searchbar" onKeyDown={this._inputKeyPress.bind(this)} type="search" className="form-control searchbox" autoComplete="off" placeholder={this.state.mainPlaceholder} />
                    <GlyphiconSpan tooltip={true} tooltipDir="bottom"
                    tooltipTitle="Pathfinding"
                    classes="input-group-addon spanfix"
                    click={this._onPathfindClick.bind(this)}>
                        <Icon glyph="road" extraClass="menuglyph" />
                    </GlyphiconSpan>
                    <GlyphiconSpan 
                        tooltip={true} 
                        tooltipDir="bottom" 
                        tooltipTitle="Back" 
                        classes="input-group-addon spanfix"
                        click={function(){
                            emitter.emit('graphBack')
                        }}>
                        <Icon glyph="step-backward" extraClass="menuglyph" />
                    </GlyphiconSpan>
                </div>
                <div ref="pathfinding">
                    <div className="input-group input-group-unstyled searchSelectorP">
                        <GlyphiconSpan 
                            tooltip={false} 
                            classes="input-group-addon spanfix invisible">
                            <Icon glyph="menu-hamburger" extraClass="menuglyph" />
                        </GlyphiconSpan>
                        <input ref="pathbar" onKeyDown={this._inputKeyPress.bind(this)} type="search" className="form-control searchbox" autoComplete="off" placeholder="Target Node" />
                        <GlyphiconSpan tooltip={false} 
                            classes="input-group-addon spanfix invisible">
                            <Icon glyph="road" extraClass="menuglyph" />
                        </GlyphiconSpan>
                        <GlyphiconSpan 
                            tooltip={true} 
                            tooltipDir="bottom" 
                            tooltipTitle="Find Path" 
                            classes="input-group-addon spanfix" 
                            click={this._onPlayClick.bind(this)}>
                            <Icon glyph="play" extraClass="menuglyph" />
                        </GlyphiconSpan>
                    </div>
                </div>

                <div ref="tabs">
                    <TabContainer />
                </div>
            </div>
        )
    }
}