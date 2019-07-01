import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class MenuButton extends Component {
    constructor() {
        super();

        this.state = {
            darkMode: false,
        };
    }

    componentDidMount() {
        $(this.refs.btn).html(
            '<span class="{}"></span>'.format(this.props.glyphicon)
        );

        emitter.on('toggleDarkMode', this.toggleDarkMode.bind(this));
        this.toggleDarkMode(appStore.performance.darkMode);
    }

    toggleDarkMode(enabled) {
        this.setState({ darkMode: enabled });
    }

    _leave(e) {
        var target = $(e.target);
        target.css('width', 'auto');
        var oldWidth = target.width();
        target.html('<span class="{}"></span>'.format(this.props.glyphicon));
        var newWidth = target.outerWidth();
        target.width(oldWidth);
        target.animate(
            {
                width: newWidth + 'px',
            },
            100
        );
    }

    _enter(e) {
        var target = $(e.target);
        target.css('width', 'auto');
        var oldWidth = target.width();
        target.html(
            '{} <span class="{}"> </span>'.format(
                this.props.hoverVal,
                this.props.glyphicon
            )
        );
        var newWidth = target.outerWidth();
        target.width(oldWidth);
        target.animate(
            {
                width: newWidth + 'px',
            },
            100
        );
    }

    render() {
        var c = 'glyphicon glyphicon-' + this.props.glyphicon;
        return (
            <button
                ref='btn'
                onClick={this.props.click}
                onMouseLeave={this._leave.bind(this)}
                onMouseEnter={this._enter.bind(this)}
                className={
                    this.state.darkMode
                        ? 'btn menu-button-dark'
                        : 'btn menu-button-light'
                }
            >
                <span className={c} />
            </button>
        );
    }
}

MenuButton.propTypes = {
    hoverVal: PropTypes.string.isRequired,
    glyphicon: PropTypes.string.isRequired,
    click: PropTypes.func.isRequired,
};
