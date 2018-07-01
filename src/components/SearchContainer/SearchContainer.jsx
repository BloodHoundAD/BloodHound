import React, { Component } from 'react';
<<<<<<< HEAD
import GlyphiconSpan from '../GlyphiconSpan'
import Icon from '../Icon'
import TabContainer from './TabContainer'
=======
import GlyphiconSpan from '../GlyphiconSpan';
import Icon from '../Icon';
import TabContainer from './TabContainer';
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a

export default class SearchContainer extends Component {
    constructor(props){
        super(props);

        this.state = {
            mainPlaceholder:"Start typing to search for a node...",
            pathfindingIsOpen: false,
            mainValue: "",
            pathfindValue: ""
<<<<<<< HEAD
        }
    }

=======
        };
    }

    componentDidMount() {
        jQuery(this.refs.pathfinding).slideToggle(0);
        jQuery(this.refs.tabs).slideToggle(0);
        emitter.on('userNodeClicked', this.openNodeTab.bind(this));
        emitter.on('groupNodeClicked', this.openNodeTab.bind(this));
        emitter.on('computerNodeClicked', this.openNodeTab.bind(this));
        emitter.on('domainNodeClicked', this.openNodeTab.bind(this));
        emitter.on('gpoNodeClicked', this.openNodeTab.bind(this));
        emitter.on('ouNodeClicked', this.openNodeTab.bind(this));
        emitter.on('setStart', function (payload) {
            jQuery(this.refs.searchbar).val(payload);
        }.bind(this));

        emitter.on('setEnd', function (payload) {
            jQuery(this.refs.pathbar).val(payload);
            var e = jQuery(this.refs.pathfinding);
            if (! e.is(":visible")) {
                this.setState({pathfindingIsOpen: true});
                e.slideToggle();
            }
        }.bind(this));

        jQuery(this.refs.searchbar).typeahead({
            source: function (query, process) {
                let session = driver.session();
                if (query.includes(':')){
                    let sp = query.split(':');
                    let type = sp[0];
                    let term = sp[1];
                    let t = '(?i).*' + term + '.*';
                    
                    let labels = ["OU","GPO","User","Computer","Group","Domain"];
                    $.each(labels, function(_, l){
                        if (l.toLowerCase() === type.toLowerCase()){
                            type = l;
                        }
                    });

                    let data = [];
                    session.run("MATCH (n:{}) WHERE n.name =~ {name} OR n.guid =~ {name} RETURN n LIMIT 10".format(type), { name: t })
                        .then(function (results) {
                            let data = [];
                            let map = {};
                            let index = 0;

                            $.each(results.records, function (index, record) {
                                let props = {};
                                props = record._fields[0].properties;
                                Object.assign(props, {
                                    type:record._fields[0].labels[0]
                                });
                                map[index] = props;
                                data.push("{}#{}".format(props.name, index));
                                index++;
                            });
                            this.map = map;
                            session.close();
                            return process(data);
                        }.bind(this));
                    
                }else{
                    let t = '(?i).*' + query + '.*';
                    let data = [];
                    session.run("MATCH (n) WHERE n.name =~ {name} OR n.guid =~ {name} RETURN n LIMIT 10", { name: t })
                        .then(function (results) {
                            let data = [];
                            let map = {};
                            let index = 0;

                            $.each(results.records, function (index, record) {
                                let props = {};
                                props = record._fields[0].properties;
                                Object.assign(props, {
                                    type: record._fields[0].labels[0]
                                });
                                map[index] = props;
                                data.push("{}#{}".format(props.name, index));
                                index++;
                            });
                            this.map = map;
                            session.close();
                            return process(data);
                        }.bind(this));
                }
                
            },
            afterSelect: function (selected) {
                if (!this.state.pathfindingIsOpen) {
                    let props = {};
                    let statement = "";
                    if (selected.type === 'OU'){
                        statement =  "MATCH (n:{}) WHERE n.guid = {guid} RETURN n".format(selected.type);
                        props = {guid: selected.guid};
                    }else{
                        statement = "MATCH (n:{}) WHERE n.name = {name} RETURN n".format(selected.type);
                        props = { name: selected.name };
                    }
                    
                    emitter.emit('searchQuery', statement, props);
                } else {
                    let start = jQuery(this.refs.searchbar).val();
                    let end = jQuery(this.refs.pathbar).val();

                    if (start === "" || end === "") {
                        return;
                    }

                    if (start === end) {
                        return;
                    }

                    let query = "";

                    let labels = ["OU", "GPO", "User", "Computer", "Group", "Domain"];
                    if (start.includes(":")) {
                        let spl = start.split(':');
                        let type = spl[0];
                        let search = spl[1];
                        start = search;

                        $.each(labels, function (_, l) {
                            if (l.toLowerCase() === type.toLowerCase()) {
                                type = l;
                            }
                        });

                        if (type === 'OU') {
                            query += "MATCH (n:{}) WHERE n.name =~ {aprop} OR n.guid =~ {aprop}".format(type);
                        } else {
                            query += "MATCH (n:{}) WHERE n.name =~ {aprop}".format(type);
                        }
                    } else {
                        query += "MATCH (n) WHERE n.name =~ {aprop}";
                    }

                    query += " WITH n ";

                    if (end.includes(":")) {
                        let spl = end.split(':');
                        let type = spl[0];
                        let search = spl[1];
                        end = search;

                        $.each(labels, function (_, l) {
                            if (l.toLowerCase() === type.toLowerCase()) {
                                type = l;
                            }
                        });

                        if (type === 'OU') {
                            query += "MATCH (m:{}) WHERE m.name =~ {bprop} OR m.guid =~ {bprop}".format(type);
                        } else {
                            query += "MATCH (m:{}) WHERE m.name =~ {bprop}".format(type);
                        }
                    } else {
                        query += "MATCH (m) WHERE m.name =~ {bprop}";
                    }

                    query += " WITH m,n MATCH p=allShortestPaths((n)-[r:MemberOf|AdminTo|HasSession|Contains|GpLink|Owns|DCSync|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(m)) RETURN p";

                    emitter.emit('query', query, { aprop: start, bprop: end });
                }
            }.bind(this),
            autoSelect: false,
            updater: function (item) {
                let spl = item.split("#");
                let name = spl[0];
                let index = spl[1];
                let obj = this.map[index];
                return obj;
            },
            matcher: function(item){
                let spl = item.split("#");
                let name = spl[0];
                let index = spl[1];
                let obj = this.map[index];

                let searchTerm = this.query;
                if (this.query.includes(":")){
                    searchTerm = searchTerm.split(":")[1];
                }
                if (name.toLowerCase().indexOf(searchTerm.toLowerCase()) !==-1){
                    return true;
                }else if (obj.hasOwnProperty("guid") && obj['guid'].toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1){
                    return true;
                }else{
                    return false;
                }
            },
            highlighter: function (item) {
                let spl = item.split("#");
                let name = spl[0];
                let index = spl[1];
                let obj = this.map[index];

                let searchTerm = this.query;
                if (this.query.includes(":")) {
                    searchTerm = searchTerm.split(":")[1];
                }

                let type = obj.type;
                let icon = "";

                switch (type){
                    case "Group":
                         icon = "<i style=\"float:right\" class=\"fa fa-users\"></i>";
                         break;
                     case "User":
                         icon = "<i style=\"float:right\" class=\"fa fa-user\"></i>";
                         break;
                     case "Computer":
                         icon = "<i style=\"float:right\" class=\"fa fa-desktop\"></i>";
                         break;
                     case "Domain":
                         icon = "<i style=\"float:right\" class=\"fa fa-globe\"></i>";
                         break;
                     case "GPO":
                         icon = "<i style=\"float:right\" class=\"fa fa-list\"></i>";
                         break;
                     case "OU":
                         icon = "<i style=\"float:right\" class=\"fa fa-sitemap\"></i>";
                         break;
                }

                let html = '<div>{}'.format(name);

                if (searchTerm !== ""){
                    let reQuery = new RegExp('(' + searchTerm + ')', "gi");

                    html = html.replace(reQuery, "<strong>$1</strong>");
                }
                html += icon + "</div>";
                let jElem = $(html);

                return jElem.html();
            }
        });

        jQuery(this.refs.pathbar).typeahead({
            source: function (query, process) {
                let session = driver.session();
                if (query.includes(':')) {
                    let sp = query.split(':');
                    let type = sp[0];
                    let term = sp[1];
                    let t = '(?i).*' + term + '.*';

                    let labels = ["OU", "GPO", "User", "Computer", "Group", "Domain"];
                    $.each(labels, function (_, l) {
                        if (l.toLowerCase() === type.toLowerCase()) {
                            type = l;
                        }
                    });

                    let data = [];
                    session.run("MATCH (n:{}) WHERE n.name =~ {name} OR n.guid =~ {name} RETURN n LIMIT 10".format(type), { name: t })
                        .then(function (results) {
                            let data = [];
                            let map = {};
                            let index = 0;

                            $.each(results.records, function (index, record) {
                                let props = {};
                                props = record._fields[0].properties;
                                Object.assign(props, {
                                    type: record._fields[0].labels[0]
                                });
                                map[index] = props;
                                data.push("{}#{}".format(props.name, index));
                                index++;
                            });
                            this.map = map;
                            session.close();
                            return process(data);
                        }.bind(this));

                } else {
                    let t = '(?i).*' + query + '.*';
                    let data = [];
                    session.run("MATCH (n) WHERE n.name =~ {name} OR n.guid =~ {name} RETURN n LIMIT 10", { name: t })
                        .then(function (results) {
                            let data = [];
                            let map = {};
                            let index = 0;

                            $.each(results.records, function (index, record) {
                                let props = {};
                                props = record._fields[0].properties;
                                Object.assign(props, {
                                    type: record._fields[0].labels[0]
                                });
                                map[index] = props;
                                data.push("{}#{}".format(props.name, index));
                                index++;
                            });
                            this.map = map;
                            session.close();
                            return process(data);
                        }.bind(this));
                }

            },
            afterSelect: function (selected) {
                let start = jQuery(this.refs.searchbar).val();
                let end = jQuery(this.refs.pathbar).val();

                if (start === "" || end === "") {
                    return;
                }

                if (start === end) {
                    return;
                }

                let query = "";

                let labels = ["OU", "GPO", "User", "Computer", "Group", "Domain"];
                if (start.includes(":")) {
                    let spl = start.split(':');
                    let type = spl[0];
                    let search = spl[1];
                    start = search;

                    $.each(labels, function (_, l) {
                        if (l.toLowerCase() === type.toLowerCase()) {
                            type = l;
                        }
                    });

                    if (type === 'OU') {
                        query += "MATCH (n:{}) WHERE n.name =~ {aprop} OR n.guid =~ {aprop}".format(type);
                    } else {
                        query += "MATCH (n:{}) WHERE n.name =~ {aprop}".format(type);
                    }
                } else {
                    query += "MATCH (n) WHERE n.name =~ {aprop}";
                }

                query += " WITH n ";

                if (end.includes(":")) {
                    let spl = end.split(':');
                    let type = spl[0];
                    let search = spl[1];
                    end = search;

                    $.each(labels, function (_, l) {
                        if (l.toLowerCase() === type.toLowerCase()) {
                            type = l;
                        }
                    });

                    if (type === 'OU') {
                        query += "MATCH (m:{}) WHERE m.name =~ {bprop} OR m.guid =~ {bprop}".format(type);
                    } else {
                        query += "MATCH (m:{}) WHERE m.name =~ {bprop}".format(type);
                    }
                } else {
                    query += "MATCH (m) WHERE m.name =~ {bprop}";
                }

                query += " WITH m,n MATCH p=allShortestPaths((n)-[r:MemberOf|AdminTo|HasSession|Contains|GpLink|Owns|DCSync|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(m)) RETURN p";

                emitter.emit('query', query, { aprop: start, bprop: end });
            }.bind(this),
            autoSelect: false,
            updater: function (item) {
                let spl = item.split("#");
                let index = spl[1];
                let obj = this.map[index];
                return obj;
            },
            matcher: function (item) {
                let spl = item.split("#");
                let name = spl[0];
                let index = spl[1];
                let obj = this.map[index];

                let searchTerm = this.query;
                if (this.query.includes(":")) {
                    searchTerm = searchTerm.split(":")[1];
                }
                if (name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                    return true;
                } else if (obj.hasOwnProperty("guid") && obj['guid'].toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                    return true;
                } else {
                    return false;
                }
            },
            highlighter: function (item) {
                let spl = item.split("#");
                let name = spl[0];
                let index = spl[1];
                let obj = this.map[index];

                let searchTerm = this.query;
                if (this.query.includes(":")) {
                    searchTerm = searchTerm.split(":")[1];
                }

                let type = obj.type;
                let icon = "";

                switch (type) {
                    case "Group":
                        icon = "<i style=\"float:right\" class=\"fa fa-users\"></i>";
                        break;
                    case "User":
                        icon = "<i style=\"float:right\" class=\"fa fa-user\"></i>";
                        break;
                    case "Computer":
                        icon = "<i style=\"float:right\" class=\"fa fa-desktop\"></i>";
                        break;
                    case "Domain":
                        icon = "<i style=\"float:right\" class=\"fa fa-globe\"></i>";
                        break;
                    case "GPO":
                        icon = "<i style=\"float:right\" class=\"fa fa-list\"></i>";
                        break;
                    case "OU":
                        icon = "<i style=\"float:right\" class=\"fa fa-sitemap\"></i>";
                        break;
                }

                let html = '<div>{}'.format(name);

                if (searchTerm !== "") {
                    let reQuery = new RegExp('(' + searchTerm + ')', "gi");

                    html = html.replace(reQuery, "<strong>$1</strong>");
                }
                html += icon + "</div>";
                let jElem = $(html);

                return jElem.html();
            }
        });
    }

>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
    _onPathfindClick(){
        jQuery(this.refs.pathfinding).slideToggle();
        var p = !this.state.pathfindingIsOpen;
        var t = this.state.pathfindingIsOpen ? "Start typing to search for a node..." : "Start Node"; 
        this.setState({
            pathfindingIsOpen: p,
            mainPlaceholder: t
        });
    }

    _onPlayClick(){
<<<<<<< HEAD
        var start = jQuery(this.refs.searchbar).val()
        var end = jQuery(this.refs.pathbar).val()
        if (start !== "" && end !== ""){
            emitter.emit('pathQuery', start, end)
        }
=======
        let start = jQuery(this.refs.searchbar).val();
        let end = jQuery(this.refs.pathbar).val();

        if (start === "" || end === "") {
            return;
        }

        if (start === end){
            return;
        }

        let query = "";

        let labels = ["OU", "GPO", "User", "Computer", "Group", "Domain"];
        if (start.includes(":")) {
            let spl = start.split(':');
            let type = spl[0];
            let search = spl[1];
            start = search;

            $.each(labels, function (_, l) {
                if (l.toLowerCase() === type.toLowerCase()) {
                    type = l;
                }
            });

            if (type === 'OU') {
                query += "MATCH (n:{}) WHERE n.name =~ {aprop} OR n.guid =~ {aprop}".format(type);
            } else {
                query += "MATCH (n:{}) WHERE n.name =~ {aprop}".format(type);
            }
        } else {
            query += "MATCH (n) WHERE n.name =~ {aprop}";
        }

        query += " WITH n ";

        if (end.includes(":")) {
            let spl = end.split(':');
            let type = spl[0];
            let search = spl[1];
            end = search;

            $.each(labels, function (_, l) {
                if (l.toLowerCase() === type.toLowerCase()) {
                    type = l;
                }
            });

            if (type === 'OU') {
                query += "MATCH (m:{}) WHERE m.name =~ {bprop} OR m.guid =~ {bprop}".format(type);
            } else {
                query += "MATCH (m:{}) WHERE m.name =~ {bprop}".format(type);
            }
        } else {
            query += "MATCH (m) WHERE m.name =~ {bprop}";
        }

        query += " WITH m,n MATCH p=allShortestPaths((n)-[r:MemberOf|AdminTo|HasSession|Contains|GpLink|Owns|DCSync|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(m)) RETURN p";

        emitter.emit('query', query, { aprop: start, bprop: end });
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
    }

    _onExpandClick(){
        jQuery(this.refs.tabs).slideToggle();
    }

    openNodeTab(){
        var e = jQuery(this.refs.tabs);
        if (!(e.is(":visible"))){
            e.slideToggle();
        }
    }

<<<<<<< HEAD
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
                session.run("MATCH (n) WHERE n.name =~ {name} RETURN n LIMIT 10", {name:t})
                    .then(function(results){
                        $.each(results.records, function(index, record){
                            data.push(record._fields[0].properties.name + "#" + record._fields[0].labels[0])
                        })
                        session.close()
                        return process(data)
                    })
            },
            afterSelect: function(selected) {
                if (!this.state.pathfindingIsOpen) {
                    var statement = "MATCH (n) WHERE n.name = {name} RETURN n"
                    emitter.emit('searchQuery', statement, {name: selected.split("#")[0]})
                } else {
                    var start = jQuery(this.refs.searchbar).val();
                    var end = jQuery(this.refs.pathbar).val();
                    if (start !== "" && end !== "") {
                        emitter.emit('pathQuery', start, end);
=======
    _inputKeyPress(e){
        let key = e.keyCode ? e.keyCode : e.which;
        let start = jQuery(this.refs.searchbar).val();
        let end = jQuery(this.refs.pathbar).val();
        let stop = false;

        if (key === 13){
            if (!$('.searchSelectorS > ul').is(':hidden')){
                $('.searchSelectorS > ul li').each(function(i){
                    if($(this).hasClass('active')){
                        stop = true;
                    }
                });    
            }

            if (!$('.searchSelectorP > ul').is(':hidden')){
                $('.searchSelectorP > ul li').each(function(i){
                    if($(this).hasClass('active')){
                        stop = true;
                    }
                });
            }
            if (stop){
                return;
            }
            if (!this.state.pathfindingIsOpen) {
                if (start !== ""){
                    if (start.includes(':')){
                        let spl = start.split(':');
                        let type = spl[0];
                        let search = spl[1];
                        let statement = "";
                        let regex = "";

                        let labels = ["OU", "GPO", "User", "Computer", "Group", "Domain"];
                        $.each(labels, function (_, l) {
                            if (l.toLowerCase() === type.toLowerCase()) {
                                type = l;
                            }
                        });
                        if (type === 'OU'){
                            statement = "MATCH (n:{}) WHERE n.name =~ {search} OR n.guid =~ {search} RETURN n".format(type);
                            regex = '(?i).*' + search + '.*';
                        }else{
                            statement = "MATCH (n:{}) WHERE n.name =~ {search} RETURN n".format(type);
                            regex = '(?i).*' + search + '.*';
                        }

                        emitter.emit('searchQuery', statement, { search: regex });
                        
                    }else{
                        var statement = "MATCH (n) WHERE n.name =~ {regex} RETURN n";
                        var regex = '(?i).*' + start + '.*';
                        emitter.emit('searchQuery', statement, { regex: regex });
                    }
                }
            } else {
                let start = jQuery(this.refs.searchbar).val();
                let end = jQuery(this.refs.pathbar).val();

                if (start === "" || end === "") {
                    return;
                }

                if (start === end) {
                    return;
                }

                let query = "";

                let labels = ["OU", "GPO", "User", "Computer", "Group", "Domain"];
                if (start.includes(":")) {
                    let spl = start.split(':');
                    let type = spl[0];
                    let search = spl[1];
                    start = search;

                    $.each(labels, function (_, l) {
                        if (l.toLowerCase() === type.toLowerCase()) {
                            type = l;
                        }
                    });

                    if (type === 'OU') {
                        query += "MATCH (n:{}) WHERE n.name =~ {aprop} OR n.guid =~ {aprop}".format(type);
                    } else {
                        query += "MATCH (n:{}) WHERE n.name =~ {aprop}".format(type);
                    }
                } else {
                    query += "MATCH (n) WHERE n.name =~ {aprop}";
                }

                query += " WITH n ";

                if (end.includes(":")) {
                    let spl = end.split(':');
                    let type = spl[0];
                    let search = spl[1];
                    end = search;

                    $.each(labels, function (_, l) {
                        if (l.toLowerCase() === type.toLowerCase()) {
                            type = l;
                        }
                    });

                    if (type === 'OU') {
                        query += "MATCH (m:{}) WHERE m.name =~ {bprop} OR m.guid =~ {bprop}".format(type);
                    } else {
                        query += "MATCH (m:{}) WHERE m.name =~ {bprop}".format(type);
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
                    }
                } else {
                    query += "MATCH (m) WHERE m.name =~ {bprop}";
                }
<<<<<<< HEAD
            }.bind(this),
            autoSelect: false,
            updater: function(item){
                return item.split("#")[0]
            },
            highlighter: function(item) {
                var parts = item.split("#")
                var query = this.query;
                var icon = "";
                var html = ""
                switch (parts[1]){
                    case "Group":
                        icon = "<i style=\"float:right\" class=\"fa fa-users\"></i>"
                        break;
                    case "User":
                        icon = "<i style=\"float:right\" class=\"fa fa-user\"></i>"
                        break;
                    case "Computer":
                        icon = "<i style=\"float:right\" class=\"fa fa-desktop\"></i>"
                        break;
                    case "Domain":
                        icon = "<i style=\"float:right\" class=\"fa fa-globe\"></i>"
                        break
                }

                html = '<div>' + parts[0] + ' ' + icon + '</div>'

                var reEscQuery = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                var reQuery = new RegExp('(' + reEscQuery + ')', "gi");

                var jElem = $(html)
                var textNodes = $(jElem.find('*')).add(jElem).contents().filter(function () { return this.nodeType === 3; });
                textNodes.replaceWith(function() {
                    return $(this).text().replace(reQuery, '<strong>$1</strong>')
                });

                return jElem.html();
            }
            }
        )

        jQuery(this.refs.pathbar).typeahead({
            source: function(query, process) {
                var session = driver.session()
                var t = '(?i).*' + query + '.*'
                var data = []
                session.run("MATCH (n) WHERE n.name =~ {name} RETURN n LIMIT 10", {name:t})
                    .then(function(results){
                        $.each(results.records, function(index, record){
                            data.push(record._fields[0].properties.name + "#" + record._fields[0].labels[0])
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
            autoSelect: false,
            updater: function(item){
                return item.split("#")[0]
            },
            highlighter: function(item) {
                var parts = item.split("#")
                var query = this.query;
                var icon = "";
                var html = ""
                switch (parts[1]){
                    case "Group":
                        icon = "<i style=\"float:right\" class=\"fa fa-users\"></i>"
                        break;
                    case "User":
                        icon = "<i style=\"float:right\" class=\"fa fa-user\"></i>"
                        break;
                    case "Computer":
                        icon = "<i style=\"float:right\" class=\"fa fa-desktop\"></i>"
                        break;
                    case "Domain":
                        icon = "<i style=\"float:right\" class=\"fa fa-globe\"></i>"
                        break
                }

                html = '<div>' + parts[0] + ' ' + icon + '</div>'

                var reEscQuery = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                var reQuery = new RegExp('(' + reEscQuery + ')', "gi");

                var jElem = $(html)
                var textNodes = $(jElem.find('*')).add(jElem).contents().filter(function () { return this.nodeType === 3; });
                textNodes.replaceWith(function() {
                    return $(this).text().replace(reQuery, '<strong>$1</strong>')
                });

                return jElem.html();
            }
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
                    var statement = "MATCH (n) WHERE n.name =~ {regex} RETURN n";
                    var regex = '(?i).*' + start + '.*'
                    emitter.emit('searchQuery', statement, {regex:regex})
                }
            } else {
                var start = jQuery(this.refs.searchbar).val();
                var end = jQuery(this.refs.pathbar).val();
                if (start !== "" && end !== "") {
                    emitter.emit('pathQuery', start, end);
                }
=======

                query += " WITH m,n MATCH p=allShortestPaths((n)-[r:MemberOf|AdminTo|HasSession|Contains|GpLink|Owns|DCSync|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(m)) RETURN p";

                emitter.emit('query', query, { aprop: start, bprop: end });
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
            }
        }
    }

    render(){
        return (
            <div className="searchdiv">
                <div className="input-group input-group-unstyled searchSelectorS">
                    <GlyphiconSpan 
                        tooltip 
                        tooltipDir="bottom" 
                        tooltipTitle="More Info" 
                        classes="input-group-addon spanfix"
                        click={this._onExpandClick.bind(this)}>
                        <Icon glyph="menu-hamburger" extraClass="menuglyph" />
                    </GlyphiconSpan>
                    <input ref="searchbar" onKeyDown={this._inputKeyPress.bind(this)} type="search" className="form-control searchbox" autoComplete="off" placeholder={this.state.mainPlaceholder} />
<<<<<<< HEAD
                    <GlyphiconSpan tooltip={true} tooltipDir="bottom"
                    tooltipTitle="Pathfinding"
                    classes="input-group-addon spanfix"
                    click={this._onPathfindClick.bind(this)}>
=======
                    <GlyphiconSpan tooltip tooltipDir="bottom"
                        tooltipTitle="Pathfinding"
                        classes="input-group-addon spanfix"
                        click={this._onPathfindClick.bind(this)}>
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
                        <Icon glyph="road" extraClass="menuglyph" />
                    </GlyphiconSpan>
                    <GlyphiconSpan 
                        tooltip
                        tooltipDir="bottom" 
                        tooltipTitle="Back" 
                        classes="input-group-addon spanfix"
                        click={function(){
<<<<<<< HEAD
                            emitter.emit('graphBack')
=======
                            emitter.emit('graphBack');
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
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
                            tooltip 
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
        );
    }
}