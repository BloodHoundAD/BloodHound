import React, { Component } from 'react';
import GraphContainer from './components/Graph';
import SearchContainer from './components/SearchContainer/SearchContainer';
import SpotlightContainer from './components/Spotlight/SpotlightContainer';
import LogoutModal from './components/Modals/LogoutModal';
import DeleteEdgeModal from './components/Modals/DeleteEdgeModal';
import DeleteNodeModal from './components/Modals/DeleteNodeModal';
import AddNodeModal from './components/Modals/AddNodeModal';
import AddEdgeModal from './components/Modals/AddEdgeModal';
import CancelUploadModal from './components/Modals/CancelUploadModal';
import ClearWarnModal from './components/Modals/ClearWarnModal';
import ClearConfirmModal from './components/Modals/ClearConfirmModal';
import ClearingModal from './components/Modals/ClearingModal';
import LoadingContainer from './components/Float/LoadingContainer';
import RawQuery from './components/RawQuery';
import MenuContainer from './components/Menu/MenuContainer';
import ExportContainer from './components/Float/ExportContainer';
import Settings from './components/Float/Settings';
import ZoomContainer from './components/Zoom/ZoomContainer';
import QueryNodeSelect from './components/Float/QueryNodeSelect';
import SessionClearModal from './components/Modals/SessionClearModal';
import About from './components/Modals/About.jsx';
import HelpModal from './components/Modals/HelpModal.jsx';
import NodeEditor from './components/Float/NodeEditor';
import WarmupModal from './components/Modals/WarmupModal.jsx';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

export default class AppContainer extends Component {
    componentDidMount() {
        document.addEventListener(
            'dragover',
            function(event) {
                event.preventDefault();
                return false;
            },
            false
        );

        document.addEventListener(
            'drop',
            function(event) {
                event.preventDefault();
                if (
                    jQuery('#tabcontainer').has(jQuery(event.target)).length ===
                    1
                ) {
                    emitter.emit('imageupload', event);
                } else {
                    emitter.emit('filedrop', event);
                }

                return false;
            },
            false
        );
    }

    render() {
        return (
            <TransitionGroup className='max'>
                <CSSTransition classNames='mainfade' appear timeout={1000}>
                    <div className='max'>
                        <ExportContainer />
                        <LoadingContainer />
                        <SpotlightContainer />
                        <GraphContainer />
                        <SearchContainer />
                        <LogoutModal />
                        <DeleteEdgeModal />
                        <DeleteNodeModal />
                        <AddNodeModal />
                        <AddEdgeModal />
                        <ClearWarnModal />
                        <ClearConfirmModal />
                        <ClearingModal />
                        <CancelUploadModal />
                        <SessionClearModal />
                        <WarmupModal />
                        <RawQuery />
                        <MenuContainer />
                        <Settings />
                        <ZoomContainer />
                        <QueryNodeSelect />
                        <About />
                        <NodeEditor />
                        <HelpModal />
                    </div>
                </CSSTransition>
            </TransitionGroup>
        );
    }
}
