import React, { Component } from 'react';

export default class ZoomContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            darkMode: false,
        };
    }

    componentDidMount() {
        emitter.on('toggleDarkMode', this.toggleDarkMode.bind(this));
        this.toggleDarkMode(appStore.performance.darkMode);
    }

    toggleDarkMode(enabled) {
        this.setState({ darkMode: enabled });
    }

    render() {
        return (
            <div className='zoomBox'>
                <div>
                    <button
                        onClick={function() {
                            emitter.emit('zoomIn');
                        }}
                        className={
                            this.state.darkMode
                                ? 'btn zoomIn menu-button-dark'
                                : 'btn zoomIn menu-button-light'
                        }
                    >
                        <span className='fa fa-plus' />
                    </button>
                </div>
                <div>
                    <button
                        onClick={function() {
                            emitter.emit('resetZoom');
                        }}
                        className={
                            this.state.darkMode
                                ? 'btn menu-button-dark'
                                : 'btn menu-button-light'
                        }
                    >
                        <span className='fa fa-home' style={{ width: 13 }} />
                    </button>
                </div>
                <div>
                    <button
                        onClick={function() {
                            emitter.emit('zoomOut');
                        }}
                        className={
                            this.state.darkMode
                                ? 'btn zoomOut menu-button-dark'
                                : 'btn zoomOut menu-button-light'
                        }
                    >
                        <span className='fa fa-minus' />
                    </button>
                </div>
            </div>
        );
    }
}
