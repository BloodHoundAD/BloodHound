import React, { Component } from "react";
const { clipboard } = require("electron");

export default class SelectedImage extends Component {
    constructor() {
        super();
    }

    componentDidMount() {}

    click(e, del) {
        let o = {
            index: this.props.index,
            photo: this.props.photo
        };

        if (del) {
            emitter.emit("deletePhoto", o);
        } else {
            emitter.emit("clickPhoto", o);
        }
    }

    render() {
        let style = {
            margin: this.props.margin,
            cursor: "pointer",
            height: this.props.photo.height,
            width: this.props.photo.width,
            position: "relative"
        };

        return (
            <div style={style} className="gallery-img">
                <i
                    className="fa fa-copy"
                    onClick={x => {
                        emitter.emit("showAlert", {
                            text: "Copied file path to clipboard",
                            type: "info"
                        });
                        clipboard.writeText(this.props.photo.src);
                    }}
                />
                <i className="fa fa-trash-alt" onClick={e => this.click(e, true)} />
                <img
                    className={"gallery-img"}
                    onClick={e => this.click(e, false)}
                    {...this.props.photo}
                    style={style}
                />
            </div>
        );
    }
}
