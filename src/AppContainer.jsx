import React, { Component } from 'react';
import GraphContainer from './components/graph'
import SearchContainer from './components/SearchContainer/searchcontainer'
import SpotlightContainer from './components/Spotlight/spotlightcontainer'
import LogoutModal from './components/Modals/logoutmodal'
import LoadingContainer from './components/loadingcontainer'
import GenericAlert from './components/alert'

export default class AppContainer extends Component {
	constructor(){
		super();
	}

	render() {
		return (
			<div className="max">
				<GenericAlert />
				<LoadingContainer />
				<SpotlightContainer/>
				<GraphContainer />
				<SearchContainer />
				<LogoutModal/>
			</div>
		);
	};
}