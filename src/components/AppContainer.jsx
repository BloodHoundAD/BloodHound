import React, { Component } from 'react';
import GraphContainer from './graph'
import SearchContainer from './SearchContainer/searchcontainer'
import SpotlightContainer from './Spotlight/spotlightcontainer'
import LogoutModal from './Modals/logoutmodal'
import LoadingContainer from './loadingcontainer'

export default class AppContainer extends Component {
	constructor(){
		super();
	}

	render() {
		return (
			<div className="max">
				<LoadingContainer />
				<SpotlightContainer/>
				<GraphContainer />
				<SearchContainer />
				<LogoutModal/>
			</div>
		);
	};
}