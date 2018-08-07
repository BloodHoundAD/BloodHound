import React, { Component } from "react";
import { Alert } from "react-bootstrap";


export default class GenericAlert extends Component {
    constructor() {
        super();
        this.state = {
            visible: false,
            text: "No data returned from query",
            timeout: null
        };

        emitter.on("showAlert", this._show.bind(this));
        emitter.on("hideAlert", this._dismiss.bind(this));
    }

    _dismiss() {
        this.setState({ visible: false });
    }

    _show(val) {
        clearTimeout(this.state.timeout);
        var t = setTimeout(
            _ => {
                this._dismiss();
            },
            2500
        );

        this.setState({
            visible: true,
            text: val,
            timeout: t
        });
    }

    render() {
        if (this.state.visible) {
            return (
                <Alert
                    className="alertdiv"
                    bsStyle="danger"
                    onDismiss={x => this._dismiss}
                >
                    {this.state.text}
                </Alert>
            );
        } else {
            return null;
        }
    }
}
