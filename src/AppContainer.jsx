import React, { Component } from 'react';
import GraphContainer from './components/Graph';
import SearchContainer from './components/SearchContainer/SearchContainer';
import SpotlightContainer from './components/Spotlight/SpotlightContainer';
import LogoutModal from './components/Modals/LogoutModal';
import CancelUploadModal from './components/Modals/CancelUploadModal';
import ClearWarnModal from './components/Modals/ClearWarnModal'
import ClearConfirmModal from './components/Modals/ClearConfirmModal'
import ClearingModal from './components/Modals/ClearingModal'
import LoadingContainer from './components/Float/LoadingContainer';
import GenericAlert from './components/Float/Alert';
import RawQuery from './components/RawQuery';
import MenuContainer from './components/Menu/MenuContainer';
import ExportContainer from './components/Float/ExportContainer';
import Settings from './components/Float/Settings'
import ZoomContainer from './components/Zoom/ZoomContainer'
import QueryNodeSelect from './components/Float/QueryNodeSelect'
import SessionClearModal from './components/Modals/SessionClearModal'
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'
import About from './components/Modals/About.jsx'

export default class AppContainer extends Component {
	render() {
		return (
			 <CSSTransitionGroup transitionName="mainfade" 
			 	transitionAppear={true} 
			 	transitionAppearTimeout={1000}
			 	transitionEnter={false}
			 	transitionLeave={false}>
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
					<CancelUploadModal />
					<SessionClearModal />
					<RawQuery />
					<MenuContainer />
					<Settings />
					<ZoomContainer />
					<QueryNodeSelect />
					<About />
				</div>
			</CSSTransitionGroup>
		);
	};
}