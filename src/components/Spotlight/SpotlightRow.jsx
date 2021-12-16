import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class SpotlightRow extends Component {
    _handleClick() {
        emitter.emit(
            'spotlightClick',
            this.props.nodeId,
            this.props.parentNodeId
        );
    }

    render() {
        let nodeIcon;
        let parentIcon = '';
        switch (this.props.nodeType) {
            case 'Group':
                nodeIcon = 'fa fa-users';
                break;
            case 'User':
                nodeIcon = 'fa fa-user';
                break;
            case 'Computer':
                nodeIcon = 'fa fa-desktop';
                break;
            case 'Domain':
                nodeIcon = 'fa fa-globe';
                break;
            case 'OU':
                nodeIcon = 'fa fa-sitemap';
                break;
            case 'Container':
                nodeIcon = 'fa fa-archive'
                break
            case 'GPO':
                nodeIcon = 'fa fa-list';
                break;
            default:
                nodeIcon = '';
                break;
        }

        switch (this.props.parentNodeType) {
            case 'Group':
                parentIcon = 'fa fa-users';
                break;
            case 'User':
                parentIcon = 'fa fa-user';
                break;
            case 'Computer':
                parentIcon = 'fa fa-desktop';
                break;
            case 'Domain':
                parentIcon = 'fa fa-globe';
                break;
            case 'OU':
                nodeIcon = 'fa fa-sitemap';
                break;
            case 'Container':
                nodeIcon = 'fa fa-box';
                break
            case 'GPO':
                nodeIcon = 'fa fa-list';
                break;
            default:
                parentIcon = '';
                break;
        }
        return (
            <tr
                style={{ cursor: 'pointer' }}
                onClick={this._handleClick.bind(this)}
                data-id={this.props.nodeId}
                data-parent-id={this.props.parentNodeId}
            >
                <td>
                    {this.props.nodeLabel} <i className={nodeIcon} />
                </td>
                <td>
                    {this.props.parentNodeLabel} <i className={parentIcon} />
                </td>
            </tr>
        );
    }
}

SpotlightRow.propTypes = {
    nodeId: PropTypes.number.isRequired,
    parentNodeId: PropTypes.number.isRequired,
    nodeLabel: PropTypes.string.isRequired,
    parentNodeLabel: PropTypes.string.isRequired,
    nodeType: PropTypes.string.isRequired,
    parentNodeType: PropTypes.string.isRequired,
};
