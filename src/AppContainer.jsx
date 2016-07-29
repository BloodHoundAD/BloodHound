import React, { Component } from 'react';
import GraphContainer from './components/graph';
import SearchContainer from './components/SearchContainer/searchcontainer';
import SpotlightContainer from './components/Spotlight/spotlightcontainer';
import LogoutModal from './components/Modals/logoutmodal';
import ClearWarnModal from './components/Modals/clearwarnmodal'
import ClearConfirmModal from './components/Modals/clearconfirmmodal'
import LoadingContainer from './components/loadingcontainer';
import GenericAlert from './components/alert';
import RawQuery from './components/rawquery';
import MenuContainer from './components/Menu/menucontainer';
import ExportContainer from './components/Float/exportcontainer';

export default class AppContainer extends Component {
	constructor(){
		super();
	}

	render() {
		return (
			<div className="max">
				<GenericAlert />
				<ExportContainer />
				<LoadingContainer />
				<SpotlightContainer />
				<GraphContainer />
				<SearchContainer />
				<LogoutModal />
				<ClearWarnModal />
				<ClearConfirmModal />
				<RawQuery />
				<MenuContainer />
			</div>
		);
	};
}