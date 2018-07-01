import React, { Component } from 'react';

export default class PrebuiltQueryNode extends Component {
<<<<<<< HEAD
	render() {
		var c;
		if (this.props.info.requireNodeSelect){
			c = function(){
				emitter.emit('nodeSelectQuery', this.props.info.nodeSelectQuery)
			}.bind(this)
		}else{
			c = function(){
				emitter.emit('query', this.props.info.query, this.props.info.props, "", "", this.props.info.allowCollapse)
			}.bind(this)
		}
		return (
			<div>
				<a href="#" onClick={c}>{this.props.info.name}</a>
				<br />
			</div>
		);
	}
=======
    render() {
        var c;
        
        c = function(){
            if (appStore.prebuiltQuery.length === 0){
                appStore.prebuiltQuery = JSON.parse(JSON.stringify(this.props.info.queryList));
                emitter.emit('prebuiltQueryStart');
            }
        }.bind(this);

        return (
            <div>
                <a href="#" onClick={c}>{this.props.info.name}</a>
                <br />
            </div>
        );
    }
>>>>>>> 4f3aa29e672caec387091d0747c8dded0431f77a
}
