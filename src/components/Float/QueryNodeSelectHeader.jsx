import React, { Component } from 'react';

class QueryNodeSelectHeader extends Component {
    render() {
        var title = this.props.length > 0 ? this.props.title : "Loading...";
        return (
            <div>
                {title}
                <button type="button" className="close" onClick={this.props.dismiss} aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        );
    }
}