import React, { Component } from 'react';
import GlyphiconSpan from '../glyphiconspan'
import Icon from '../icon'
import { escapeRegExp } from '../../js/utils.js';
import TabContainer from './tabcontainer'

export default class SearchContainer extends Component {
    constructor(props){
        super(props)

        this.state = {
            mainPlaceholder:"Start typing to search for a node...",
            pathfindingIsOpen: false
        }
    }

    _getSearchOptions(e, callback){
        var x = []
        var promise = $.ajax({
            url: localStorage.getItem("dbpath") + "/db/data/transaction/commit",
            type: 'POST',
            accepts: { json: "application/json" },
            dataType: "json",
            contentType: "application/json",
            headers: {
                "Authorization": localStorage.getItem("auth")
            },
            data: JSON.stringify({
                "statements": [{
                    "statement" : "MATCH (n) WHERE n.name =~ '(?i).*" + escapeRegExp(e) + ".*' RETURN n.name LIMIT 10"
                }]
            }),
            success: function(json) {
                $.each(json.results[0].data, function(index, d){
                    x.push({id:index, label:d.row[0]})
                })
                callback(null, {
                    options: x,
                    complete: false
                })
            }.bind(this)
        })
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
        
    }

    _onExpandClick(){
        jQuery(this.refs.tabs).slideToggle()
    }

    render(){
        return (
            <div className="searchdiv">
                <div className="input-group input-group-unstyled">
                    <GlyphiconSpan 
                        tooltip={true} 
                        tooltipDir="bottom" 
                        tooltipTitle="More Info" 
                        classes="input-group-addon spanfix"
                        click={this._onExpandClick.bind(this)}>
                        <Icon glyph="menu-hamburger" extraClass="menuglyph" />
                    </GlyphiconSpan>
                    <input ref="searchbar" type="search" className="form-control searchbox" autoComplete="off" placeholder={this.state.mainPlaceholder} />
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
                        classes="input-group-addon spanfix">
                        <Icon glyph="step-backward" extraClass="menuglyph" />
                    </GlyphiconSpan>
                </div>
                <div ref="pathfinding">
                    <div className="input-group input-group-unstyled">
                        <GlyphiconSpan 
                            tooltip={false} 
                            classes="input-group-addon spanfix invisible">
                            <Icon glyph="menu-hamburger" extraClass="menuglyph" />
                        </GlyphiconSpan>
                        <input ref="pathbar" type="search" className="form-control searchbox" autoComplete="off" placeholder="Target Node" />
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

        jQuery(this.refs.searchbar).typeahead({
            source: function(query, process) {
                return $.ajax({
                    url: localStorage.getItem("dbpath") + "/db/data/cypher",
                    type: 'POST',
                    accepts: { json: "application/json" },
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "Authorization": "Basic bmVvNGo6bmVvNGpq"
                    },
                    data: JSON.stringify({ "query": "MATCH (n) WHERE n.name =~ '(?i).*" + escapeRegExp(query) + ".*' RETURN n.name LIMIT 10" }),
                    success: function(json) {
                        var d = json.data;
                        var l = d.length;
                        for (var i = 0; i < l; i++) {
                            d[i] = d[i].toString();
                        }
                        return process(json.data);
                    }
                });
            },
            afterSelect: function(selected) {
                if (!this.state.pathfindingIsOpen) {
                    doQuery("MATCH (n) WHERE n.name =~ '(?i).*" + escapeRegExp(selected) + ".*' RETURN n");
                } else {
                    var start = $('#searchBar').val();
                    var end = $('#endNode').val();
                    if (start !== "" && end !== "") {
                        doQuery("MATCH (source {name:'" + start + "'}), (target {name:'" + end + "'}), p=allShortestPaths((source)-[*]->(target)) RETURN p", start, end);
                    }
                }
            }.bind(this),
            autoSelect: false,
            minLength: 3
            })
    }
}