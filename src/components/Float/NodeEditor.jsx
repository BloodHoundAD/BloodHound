import React, { Component } from 'react';
import NodeEditorRow from './NodeEditorRow.jsx';
import { withAlert } from 'react-alert';

class NodeEditor extends Component {
    constructor() {
        super();

        this.state = {
            label: '',
            type: '',
            properties: {},
        };
    }

    componentDidMount() {
        emitter.on('editnode', this.getNodeData.bind(this));
        $(this.refs.outer).draggable({
            stop: (event, _) => {
                let target = jQuery(event.target);
                target.css('width', 'auto');
                target.css('height', 'auto');
            },
            handle: '#nodeEditOuter',
        });
        $(this.refs.outer).fadeToggle(false);
    }

    getNodeData(name, type) {
        closeTooltip();
        $(this.refs.outer).fadeIn();
        $(this.refs.newAttrName).val('');
        let q = driver.session();
        this.setState({ label: name, type: type, dname: name });
        let statement = 'MATCH (n:{} {{}:{name}}) RETURN n';
        let key;
        if (type === 'OU') {
            key = 'guid';
        } else {
            key = 'name';
        }

        q.run(statement.format(type, key), { name: name }).then(
            function(result) {
                let props = result.records[0]._fields[0].properties;
                let label = props.name;
                delete props.name;
                this.setState({ properties: props, dname: label });
                q.close();
            }.bind(this)
        );
    }

    closeEditor() {
        $(this.refs.outer).fadeToggle(false);
    }

    addAttrib() {
        let input = $(this.refs.newAttrName);
        let typeinput = $(this.refs.newAttrType);
        let val = input.val();
        let type = typeinput.val();
        if (val === '') {
            input.css('border', '3px solid red');
            return;
        }

        let newval;
        if (type === 'boolean') {
            newval = false;
        } else if (type === 'number') {
            newval = 0;
        } else if (type === 'string') {
            newval = 'placeholder';
        } else {
            newval = [];
        }

        let key;
        if (this.state.type === 'OU') {
            key = 'guid';
        } else {
            key = 'name';
        }

        if (Object.keys(this.state.properties).includes(val)) {
            input.css('border', '3px solid red');
            this.props.alert.error('No data returned from query');
            return;
        }

        let q = driver.session();
        let statement = 'MATCH (n:{} {{}:{name}}) SET n.{}={newprop} RETURN n'.format(
            this.state.type,
            key,
            val
        );

        q.run(statement, { name: this.state.label, newprop: newval }).then(
            result => {
                let props = result.records[0]._fields[0].properties;
                let label = props.name;
                delete props.name;
                this.setState({ properties: props, label: label });
            }
        );
    }

    updateHandler(attrName, newVal) {
        let key;
        if (this.state.type === 'OU') {
            key = 'guid';
        } else {
            key = 'name';
        }
        let statement;
        if (
            attrName === 'serviceprincipalnames' &&
            this.state.type === 'user'
        ) {
            if (newVal[0] === '' && newVal.length === 1) {
                newVal = [];
            }

            if (newVal.length > 0) {
                statement = 'MATCH (n:{} {{}:{name}}) SET n.{}={newprop}, n.hasspn=true RETURN n'.format(
                    this.state.type,
                    key,
                    attrName
                );
            } else {
                statement = 'MATCH (n:{} {{}:{name}}) SET n.{}={newprop}, n.hasspn=false RETURN n'.format(
                    this.state.type,
                    key,
                    attrName
                );
            }
        } else {
            statement = 'MATCH (n:{} {{}:{name}}) SET n.{}={newprop} RETURN n'.format(
                this.state.type,
                key,
                attrName
            );
        }

        let q = driver.session();
        q.run(statement, { name: this.state.label, newprop: newVal }).then(
            result => {
                let props = result.records[0]._fields[0].properties;
                let label = props.name;
                delete props.name;
                this.setState({ properties: props, label: label });
            }
        );
    }

    deletePropHandler(attrName) {
        let key;
        if (this.state.type === 'OU') {
            key = 'guid';
        } else {
            key = 'name';
        }
        let statement = 'MATCH (n:{} {{}:{name}}) REMOVE n.{} RETURN n'.format(
            this.state.type,
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
                q.close();
            }.bind(this)
        );
    }

    removeValidation() {
        let input = $(this.refs.newAttrName);
        input.css('border', '');
    }

    render() {
        return (
            <div ref='outer' className='nodeEditor panel panel-default'>
                <div className='panel-heading' id='nodeEditOuter'>
                    {this.state.dname}
                    <button
                        type='button'
                        className='close'
                        onClick={this.closeEditor.bind(this)}
                        aria-label='Close'
                    >
                        <span aria-hidden='true'>&times;</span>
                    </button>
                </div>

                <div className='panel-body'>
                    <div className='nodeEditTableContainer'>
                        <table
                            data-role='table'
                            className='table table-striped'
                        >
                            <thead align='center'>
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
                                                updateHandler={this.updateHandler.bind(
                                                    this
                                                )}
                                            />
                                        );
                                    }.bind(this)
                                )}
                            </tbody>
                        </table>
                    </div>
                    <form
                        onSubmit={x => x.preventDefault()}
                        className='form-inline pull-right'
                    >
                        <div
                            onFocus={this.removeValidation.bind(this)}
                            className='form-group'
                        >
                            {/* <input
                                type="text"
                                className="form-control form-override"
                                ref="newAttrDisplay"
                                placeholder="Display Name"
                            /> */}
                            <input
                                type='text'
                                className='form-control form-override'
                                ref='newAttrName'
                                placeholder='Internal Name'
                            />
                            <select className='form-control' ref='newAttrType'>
                                <option>boolean</option>
                                <option>string</option>
                                <option>number</option>
                                <option>array</option>
                            </select>
                            <button
                                className='form-control formButtonFix'
                                onClick={this.addAttrib.bind(this)}
                            >
                                <span className='fa fa-plus' /> Add
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

export default withAlert()(NodeEditor);
