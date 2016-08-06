import React, { Component } from 'react';
import GraphContainer from './components/graph';
import SearchContainer from './components/SearchContainer/searchcontainer';
import SpotlightContainer from './components/Spotlight/spotlightcontainer';
import LogoutModal from './components/Modals/logoutmodal';
import ClearWarnModal from './components/Modals/clearwarnmodal'
import ClearConfirmModal from './components/Modals/clearconfirmmodal'
import ClearingModal from './components/Modals/clearingmodal'
import LoadingContainer from './components/Float/loadingcontainer';
import GenericAlert from './components/Float/alert';
import RawQuery from './components/rawquery';
import MenuContainer from './components/Menu/menucontainer';
import ExportContainer from './components/Float/exportcontainer';
import Settings from './components/Float/settings'
import ZoomContainer from './components/Zoom/zoomcontainer'
import QueryNodeSelect from './components/Float/querynodeselect'

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
				<ClearingModal />
				<RawQuery />
				<MenuContainer />
				<Settings />
				<ZoomContainer />
				<QueryNodeSelect />
			</div>
		);
	};
}