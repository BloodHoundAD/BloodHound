import React, { Component } from 'react';

export default class RawQuery extends Component {
    constructor() {
        super();
        this.state = {
            val: '',
            open: false,
            darkMode: false,
        };
    }

    componentWillMount() {
        emitter.on('setRawQuery', this._setQueryFromEvent.bind(this));
        emitter.on('toggleDarkMode', this.toggleDarkMode.bind(this));
    }

    componentDidMount() {
        $(this.refs.input).slideToggle(0);
        this.toggleDarkMode(appStore.performance.darkMode);
    }

    toggleDarkMode(enabled) {
        this.setState({ darkMode: enabled });
    }

    _onChange(event) {
        this.setState({
            val: event.target.value,
        });
    }

    _onKeyUp(e) {
        var key = e.keyCode ? e.keyCode : e.which;

        if (key === 13) {
            emitter.emit('query', this.state.val);
        }
    }

    _toggle() {
        $(this.refs.input).slideToggle();
        this.setState({
            open: !this.state.open,
        });
    }

    _setQueryFromEvent(query) {
        this.setState({ val: query });
    }

    render() {
        return (
            <div
                className={
                    this.state.darkMode
                        ? 'bottomdiv bottomdiv-dark'
                        : 'bottomdiv'
                }
            >
                <button
                    onClick={this._toggle.bind(this)}
                    className='slideupbutton'
                >
                    <span
                        className={
                            this.state.open
                                ? 'glyphicon glyphicon-chevron-down'
                                : 'glyphicon glyphicon-chevron-up'
                        }
                    />
                    Raw Query
                    <span
                        className={
                            this.state.open
                                ? 'glyphicon glyphicon-chevron-down'
                                : 'glyphicon glyphicon-chevron-up'
                        }
                    />
                </button>
                <input
                    ref='input'
                    type='text'
                    onChange={this._onChange.bind(this)}
                    value={this.state.val}
                    onKeyUp={this._onKeyUp.bind(this)}
                    className='form-control queryInput'
                    autoComplete='off'
                    placeholder='Enter a raw query...'
                />
            </div>
        );
    }
}
