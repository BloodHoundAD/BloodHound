import React, { Component } from 'react';

export default class LoadingContainer extends Component {
    constructor() {
        super();

        this.state = {
            text: 'Loading',
            darkMode: false,
        };

        emitter.on('updateLoadingText', payload => {
            this.setState({ text: payload });
        });

        emitter.on('showLoadingIndicator', payload => {
            if (payload) {
                jQuery(this.refs.load).fadeIn();
            } else {
                jQuery(this.refs.load).fadeOut();
            }
        });
    }

    componentDidMount() {
        jQuery(this.refs.load).fadeToggle(0);

        emitter.on('toggleDarkMode', this.toggleDarkMode.bind(this));
        this.toggleDarkMode(appStore.performance.darkMode);
    }

    toggleDarkMode(enabled) {
        this.setState({ darkMode: enabled });
    }

    render() {
        return (
            <div
                className={
                    this.state.darkMode
                        ? 'loadingIndicator loading-indicator-dark'
                        : 'loadingIndicator loading-indicator-light'
                }
                ref='load'
            >
                <div>{this.state.text}</div>
                <img src='src/img/loading_new.gif' />
            </div>
        );
    }
}
