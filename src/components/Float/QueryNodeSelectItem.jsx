import React, { Component } from 'react';
import { ListGroupItem } from 'react-bootstrap'

export default class QueryNodeSelectItem extends Component {
<<<<<<< HEAD

	render() {
		return (
			<ListGroupItem href="#" onClick={this.props.click}>{this.props.label}</ListGroupItem>
		);
	}
=======
    convertToDisplayProp() {
        var str = "";
        $.each(Object.keys(this.props.extraProps), function(index, prop){
            if (prop === "name"){
                return;
            }
            
            let obj = this.props.extraProps[prop];
            var type = typeof obj;
            let val = null;
            if (type === 'undefined') {
                val =  null;
            } else if (obj.hasOwnProperty('low')) {
                var t = obj.low;
                if (t === 0) {
                    val = "Never";
                } else {
                    val = new Date(obj.low * 1000).toUTCString();
                }
            } else if (type === 'boolean') {
                val = obj.toString().toTitleCase();
            } else if (obj === "") {
                val = null;
            } else {
                val = obj;
            }
            if (val !== null){
                str += prop + ": " + val + "\n";
            }
            
        }.bind(this));
        return str;
    }

    render() {
        let c = function () {
            emitter.emit("prebuiltQueryStep", this.props.label);
        }.bind(this);
        let str = this.convertToDisplayProp();
        if (this.props.extraProps.hasOwnProperty("PwdLastSet")){
            var pwd = new Date(this.props.extraProps.PwdLastSet.low * 1000).toUTCString();
        }
        return (
            <ListGroupItem className="queryNodeItemPreWrap" href="#" onClick={c} header={this.props.label}>
                {str}
            </ListGroupItem>
        );
    }
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
}
