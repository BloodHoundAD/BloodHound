import React, { Component } from 'react';
import DatabaseDataDisplay from './Tabs/DatabaseDataDisplay'
import PrebuiltQueriesDisplay from './Tabs/PrebuiltQueriesDisplay'
import NoNodeData from './Tabs/NoNodeData'
import UserNodeData from './Tabs/UserNodeData'
import GroupNodeData from './Tabs/GroupNodeData';
import ComputerNodeData from './Tabs/ComputerNodeData';
import { Tabs, Tab } from 'react-bootstrap';

export default class TabContainer extends Component {
	constructor(props){
		super(props);

		this.state = {
			userVisible: false,
			computerVisible: false,
			groupVisible: false,
			selected: 1
		}
	}

	_userNodeClicked(){
		this.setState({
			userVisible: true,
			computerVisible: false,
			groupVisible: false
		})
		this.setState({selected: 2})
	}

	_groupNodeClicked(){
		this.setState({
			userVisible: false,
			computerVisible: false,
			groupVisible: true
		})
		this.setState({selected: 2})
	}

	_computerNodeClicked(){
		this.setState({
			userVisible: false,
			computerVisible: true,
			groupVisible: false
		})
		this.setState({selected: 2})
	}

	componentDidMount() {
		emitter.on('userNodeClicked', this._userNodeClicked.bind(this))
		emitter.on('groupNodeClicked', this._groupNodeClicked.bind(this))
		emitter.on('computerNodeClicked', this._computerNodeClicked.bind(this))
	}

	_handleSelect(index, last){
		this.setState({selected: index})
	}

	render() {
		return (
			<div>
				<Tabs id="tab-style" bsStyle="pills" activeKey={this.state.selected} onSelect={this._handleSelect.bind(this)}>
					<Tab eventKey={1} title="Database Info">
						<DatabaseDataDisplay />
					</Tab>

					<Tab eventKey={2} title="Node Info">
						<NoNodeData visible={!this.state.userVisible && !this.state.computerVisible && !this.state.groupVisible}/>
						<UserNodeData visible={this.state.userVisible}/>
						<GroupNodeData visible={this.state.groupVisible}/>
						<ComputerNodeData visible={this.state.computerVisible}/>
					</Tab>

					<Tab eventKey={3} title="Queries">
						<PrebuiltQueriesDisplay />
					</Tab>
				</Tabs>
			</div>
		);
	}
}
