import React, { Component } from 'react';
import DatabaseDataDisplay from './Tabs/databasedatadisplay'
import PrebuiltQueriesDisplay from './Tabs/prebuiltqueriesdisplay'
import NoNodeData from './Tabs/nonodedata'
import UserNodeData from './Tabs/usernodedata'
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

	componentDidMount() {
		emitter.on('userNodeClicked', this._userNodeClicked.bind(this))
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
					</Tab>

					<Tab eventKey={3} title="Queries">
						<PrebuiltQueriesDisplay />
					</Tab>
				</Tabs>
			</div>
		);
	}
}
