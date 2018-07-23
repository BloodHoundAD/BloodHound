import React, { Component } from "react";

export default class LoadingContainer extends Component {
    constructor() {
        super();

        this.state = {
            text: "Loading"
        };

        emitter.on(
            "updateLoadingText",
            payload => {
                this.setState({ text: payload });
            });
        

        emitter.on(
            "showLoadingIndicator",
            payload => {
                if (payload) {
                    jQuery(this.refs.load).fadeIn();
                } else {
                    jQuery(this.refs.load).fadeOut();
                }
            }
        );
    }

    componentDidMount() {
        jQuery(this.refs.load).fadeToggle(0);
    }

    render() {
        return (
            <div className="loadingIndicator" ref="load">
                <div>{this.state.text}</div>
                <img src="src/img/loading.gif" />
            </div>
        );
    }
}
