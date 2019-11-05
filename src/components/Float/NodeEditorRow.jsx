import React, { Component } from 'react';

export default class NodeEditorRow extends Component {
    constructor(props) {
        super(props);

        let type = typeof this.props.val;
        if (type === 'object') {
            type = 'array';
        }

        this.state = {
            editing: false,
            val: this.props.val,
            deleting: false,
            valtype: type,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (
            nextProps.val !== this.props.val &&
            nextProps.val !== this.state.val
        ) {
            let type = typeof nextProps.val;
            if (type === 'object') {
                type = 'array';
            }
            this.setState({
                val: nextProps.val,
                editing: false,
                deleting: false,
                valtype: type,
            });
        }
    }

    saveDelete() {
        this.setState({ deleting: false });
        this.props.deleteHandler(this.props.attributeName);
    }

    cancelDelete() {
        this.setState({ deleting: false });
    }

    enableDelete() {
        this.setState({ deleting: true });
    }

    changeVal() {
        let val = this.state.val;
        val = !val;
        this.setState({ val: val });
    }

    cancelEdit() {
        let input = jQuery(this.refs.input);
        let val = this.props.val;

        if (input.is('div')) {
            input.html(val);
            input.removeAttr('contenteditable');
        } else if (input.is('textarea')) {
            let tempval = val.join('\n');
            input.attr('disabled', '');
            input.val(tempval);
        } else {
            input.attr('disabled', '');
        }
        this.setState({ editing: false, val: val });
    }

    saveEdit() {
        let input = jQuery(this.refs.input);
        let val;
        if (input.is('div')) {
            val = input.html();
            input.removeAttr('contenteditable');
        } else if (input.is('textarea')) {
            let tempval = input.val();
            val = tempval.split('\n');
            input.attr('disabled', '');
        } else {
            val = this.state.val;
            input.attr('disabled', '');
        }
        if (this.state.valtype === 'number') {
            val = parseInt(val);
        }
        this.setState({ editing: false });
        this.props.updateHandler(this.props.attributeName, val);
    }

    enableEdit() {
        let input = jQuery(this.refs.input);

        if (input.is('div')) {
            input.attr('contenteditable', true);
        } else {
            input.removeAttr('disabled');
        }

        this.setState({ editing: true });
    }

    render() {
        let type = this.state ? this.state.valtype : typeof this.props.val;
        let valcolumn;

        if (type === 'boolean') {
            valcolumn = (
                <input
                    ref='input'
                    className='checkbox'
                    type='checkbox'
                    checked={!this.state ? false : this.state.val}
                    disabled
                    onChange={this.changeVal.bind(this)}
                />
            );
        } else if (type === 'string') {
            valcolumn = (
                <div className={'nodeEditString'} ref='input'>
                    {!this.state ? this.props.val : this.state.val}
                </div>
            );
        } else if (type === 'number') {
            valcolumn = (
                <div className={'nodeEditNumber'} ref='input'>
                    {!this.state ? this.props.val : this.state.val}
                </div>
            );
        } else if (type === 'object' || type === 'array') {
            valcolumn = (
                <textarea
                    disabled
                    className={'nodeEditArray'}
                    ref='input'
                    defaultValue={
                        !this.state
                            ? this.props.val.join('\n')
                            : this.state.val.join('\n')
                    }
                />
            );
        }

        let deletecolumn;
        if (!this.state || this.state.deleting === false) {
            deletecolumn = (
                <button type='button'>
                    <span
                        className='fa fa-trash'
                        onClick={this.enableDelete.bind(this)}
                    />
                </button>
            );
        } else if (this.state.deleting) {
            deletecolumn = (
                <div>
                    <button type='button'>
                        <span
                            className='fa fa-check'
                            onClick={this.saveDelete.bind(this)}
                        />
                    </button>
                    <button type='button'>
                        <span
                            className='fa fa-close'
                            onClick={this.cancelDelete.bind(this)}
                        />
                    </button>
                </div>
            );
        }

        let editcolumn;
        if (!this.state || this.state.editing === false) {
            editcolumn = (
                <button type='button'>
                    <span
                        className='fa fa-edit'
                        onClick={this.enableEdit.bind(this)}
                    />
                </button>
            );
        } else if (this.state.editing) {
            editcolumn = (
                <div>
                    <button type='button'>
                        <span
                            className='fa fa-check'
                            onClick={this.saveEdit.bind(this)}
                        />
                    </button>
                    <button type='button'>
                        <span
                            className='fa fa-times'
                            onClick={this.cancelEdit.bind(this)}
                        />
                    </button>
                </div>
            );
        }

        return (
            <tr className='nodeEditRow'>
                <td align='center'>{deletecolumn}</td>
                <td align='center'>{editcolumn}</td>
                <td align='center'>{this.props.attributeName}</td>
                <td align='center'>{valcolumn}</td>
            </tr>
        );
    }
}
