import React, { Component } from "react";
import NodeEditorRow from "./NodeEditorRow.jsx";

export default class NodeEditor extends Component {
    constructor() {
        super();

        this.state = {
            label: "DOMAIN ADMINS@TESTLAB.LOCAL",
            type: "group",
            properties: {}
        };
    }

    componentDidMount() {
        emitter.on("editnode", this.getNodeData.bind(this));
        $(this.refs.outer).draggable({
            stop: function(event, ui) {
                let target = jQuery(event.target);
                target.css("width", "auto");
                target.css("height", "auto");
            },
            handle: "#nodeEditOuter"
        });
    }

    getNodeData(name, type) {
        $(this.refs.outer).fadeIn();
        let q = driver.session();
        this.setState({ label: name, type: type });
        let statement = "MATCH (n:{} {{}:{name}}) RETURN n";
        let key;
        if (type === "ou") {
            key = "guid";
        } else {
            key = "name";
        }

        q.run(statement.format(type.toTitleCase(), key), { name: name }).then(
            function(result) {
                let props = result.records[0]._fields[0].properties;
                let label = props.name;
                delete props.name;
                this.setState({ properties: props, label: label });
            }.bind(this)
        );
    }

    closeEditor() {
        $(this.refs.outer).fadeToggle(false);
    }

    updateHandler(attrName, newVal) {
        console.log(attrName, newVal)
    }

    deletePropHandler(attrName) {
        let key;
        if (this.state.type === "ou") {
            key = "guid";
        } else {
            key = "name";
        }
        let statement = "MATCH (n:{} {{}:{name}}) REMOVE n.{} RETURN n".format(
            this.state.type.toTitleCase(),
            key,
            attrName
        );
        let q = driver.session();
        q.run(statement, { name: this.state.label }).then(
            function(result) {
                let props = result.records[0]._fields[0].properties;
                let label = props.name;
                delete props.name;
                this.setState({ properties: props, label: label });
            }.bind(this)
        );
    }

    render() {
        return (
            <div ref="outer" className="nodeEditor panel panel-default">
                <div className="panel-heading" id="nodeEditOuter">
                    {this.state.label}
                    <button
                        type="button"
                        className="close"
                        onClick={this.closeEditor.bind(this)}
                        aria-label="Close"
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div className="panel-body">
                    <div className="nodeEditTableContainer">
                        <table
                            data-role="table"
                            className="table table-striped"
                        >
                            <thead align="center">
                                <tr>
                                    <td>Delete</td>
                                    <td>Edit</td>
                                    <td>Name</td>
                                    <td>Value</td>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(this.state.properties).map(
                                    function(key) {
                                        let val = this.state.properties[key];
                                        return (
                                            <NodeEditorRow
                                                key={key}
                                                attributeName={key}
                                                val={val}
                                                deleteHandler={this.deletePropHandler.bind(
                                                    this
                                                )}
                                                updateHandler = {this.updateHandler.bind(this)}
                                            />
                                        );
                                    }.bind(this)
                                )}
                            </tbody>
                        </table>
                    </div>
                    <form className="form-inline pull-right">
                        <input
                            type="text"
                            className="form-control form-override"
                            ref="newAttrName"
                        />
                        <select className="form-control" ref="newAttrType">
                            <option>Boolean</option>
                            <option>String</option>
                            <option>Number</option>
                            <option>Array</option>
                        </select>
                        <button className="form-control">
                            <span className="fa fa-plus" /> Add
                        </button>
                    </form>
                </div>
            </div>
        );
    }
}
