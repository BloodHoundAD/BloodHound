import React, { Component} from 'react';
import PropTypes from 'prop-types';

export default class NodeCypherNoNumberLink extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let c = function () {
            emitter.emit(
                'query',
                this.props.query,
                { objectid: this.props.target },
                this.props.start,
                this.props.end
            );
        }.bind(this);

        return (
            <tr style={{ cursor: 'pointer' }} onClick={c}>
                <td align='left'>{this.props.property}</td>
                <td align='right'></td>
            </tr>
        );
    }
}

NodeCypherNoNumberLink.propTypes = {
    target: PropTypes.string.isRequired,
    property: PropTypes.string.isRequired,
    query: PropTypes.string.isRequired,
    start: PropTypes.string,
    end: PropTypes.string,
};
