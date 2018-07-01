import React, { Component } from 'react';
<<<<<<< HEAD
import PropTypes from 'prop-types'

export default class SpotlightRow extends Component {
	_handleClick(){
		emitter.emit('spotlightClick', this.props.nodeId, this.props.parentNodeId)
	}

	render() {
		var nodeIcon = "";
		var parentIcon = "";
		switch (this.props.nodeType){
			case "Group":
				nodeIcon = "fa fa-users"
				break;
			case "User":
				nodeIcon = "fa fa-user"
				break;
			case "Computer":
				nodeIcon = "fa fa-desktop"
				break;
			case "Domain":
				nodeIcon = "fa fa-globe"
				break
			default:
				nodeIcon = ""
				break;
		}

		switch (this.props.parentNodeType){
			case "Group":
				parentIcon = "fa fa-users"
				break;
			case "User":
				parentIcon = "fa fa-user"
				break;
			case "Computer":
				parentIcon = "fa fa-desktop"
				break;
			case "Domain":
				parentIcon = "fa fa-globe"
				break
			default:
				parentIcon = ""
				break;
		}
		return (
			<tr style={{cursor: 'pointer'}} onClick={this._handleClick.bind(this)} data-id={this.props.nodeId} data-parent-id={this.props.parentNodeId}>
				<td>{this.props.nodeLabel} <i className={nodeIcon}></i></td>
				<td>{this.props.parentNodeLabel} <i className={parentIcon}></i></td>
			</tr>
		);
	}
}

SpotlightRow.propTypes = {
	nodeId : React.PropTypes.number.isRequired,
	parentNodeId : React.PropTypes.number.isRequired,
	nodeLabel : React.PropTypes.string.isRequired,
	parentNodeLabel : React.PropTypes.string.isRequired,
	nodeType: React.PropTypes.string.isRequired,
	parentNodeType: React.PropTypes.string.isRequired
}
=======
import PropTypes from 'prop-types';

export default class SpotlightRow extends Component {
    _handleClick(){
        emitter.emit('spotlightClick', this.props.nodeId, this.props.parentNodeId);
    }

    render() {
        var nodeIcon = "";
        var parentIcon = "";
        switch (this.props.nodeType){
            case "Group":
                nodeIcon = "fa fa-users";
                break;
            case "User":
                nodeIcon = "fa fa-user";
                break;
            case "Computer":
                nodeIcon = "fa fa-desktop";
                break;
            case "Domain":
                nodeIcon = "fa fa-globe";
                break;
            case "OU":
                nodeIcon = "fa fa-sitemap";
                break;
            case "GPO":
                nodeIcon = "fa fa-list";
                break;
            default:
                nodeIcon = "";
                break;
        }

        switch (this.props.parentNodeType){
            case "Group":
                parentIcon = "fa fa-users";
                break;
            case "User":
                parentIcon = "fa fa-user";
                break;
            case "Computer":
                parentIcon = "fa fa-desktop";
                break;
            case "Domain":
                parentIcon = "fa fa-globe";
                break;
            case "OU":
                nodeIcon = "fa fa-sitemap";
                break;
            case "GPO":
                nodeIcon = "fa fa-list";
                break;
            default:
                parentIcon = "";
                break;
        }
        return (
            <tr style={{cursor: 'pointer'}} onClick={this._handleClick.bind(this)} data-id={this.props.nodeId} data-parent-id={this.props.parentNodeId}>
                <td>{this.props.nodeLabel} <i className={nodeIcon}></i></td>
                <td>{this.props.parentNodeLabel} <i className={parentIcon}></i></td>
            </tr>
        );
    }
}

SpotlightRow.propTypes = {
    nodeId : PropTypes.number.isRequired,
    parentNodeId : PropTypes.number.isRequired,
    nodeLabel : PropTypes.string.isRequired,
    parentNodeLabel : PropTypes.string.isRequired,
    nodeType: PropTypes.string.isRequired,
    parentNodeType: PropTypes.string.isRequired
};
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
