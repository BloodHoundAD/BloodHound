import React, { Component } from 'react';
import GraphContainer from './graph'
import SearchContainer from './SearchContainer/searchcontainer'
import SpotlightContainer from './Spotlight/spotlightcontainer'
import LogoutModal from './Modals/logoutmodal'

export default class AppContainer extends Component {
	constructor(){
		super();
	}

	render() {
		return (
			<div className="max">
				<GraphContainer />
				<SearchContainer />
				<SpotlightContainer/>
				<LogoutModal/>
			</div>
		);
	};
}