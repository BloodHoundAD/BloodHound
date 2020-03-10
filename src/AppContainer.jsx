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
import { AppContext } from './AppContext';
import GraphErrorModal from './components/Modals/GraphErrorModal';

export default class AppContainer extends Component {
    constructor(props) {
        super(props);

        this.toggleDarkMode = () => {
            let { darkMode } = this.state;

            this.setState({
                darkMode: !darkMode,
            });

            appStore.performance.darkMode = !darkMode;
            conf.set('performance', appStore.performance);
            emitter.emit('toggleDarkMode', !darkMode);
        };

        this.toggleDebugMode = () => {
            let { debugMode } = this.state;

            this.setState({
                debugMode: !debugMode,
            });

            appStore.performance.debug = !debugMode;
            conf.set('performance', appStore.performance);
        };

        this.toggleLowDetailMode = () => {
            let { lowDetail } = this.state;

            this.setState({
                lowDetail: !lowDetail,
            });

            appStore.performance.lowGraphics = !lowDetail;
            conf.set('performance', appStore.performance);
            emitter.emit('changeGraphicsMode', !lowDetail);
        };

        this.setNodeLabels = val => {
            this.setState({
                nodeLabels: val,
            });
            appStore.performance.nodeLabels = val;
            emitter.emit('changeNodeLabels');
        };

        this.setEdgeLabels = val => {
            this.setState({ edgeLabels: val });
            appStore.performance.edgeLabels = val;
            emitter.emit('changeEdgeLabels');
        };

        this.state = {
            darkMode: appStore.performance.darkMode,
            toggleDarkMode: this.toggleDarkMode,
            debugMode: appStore.performance.debug,
            toggleDebugMode: this.toggleDebugMode,
            lowDetail: appStore.performance.lowGraphics,
            toggleLowDetailMode: this.toggleLowDetailMode,
            nodeLabels: appStore.performance.nodeLabels,
            setNodeLabels: this.setNodeLabels,
            edgeLabels: appStore.performance.edgeLabels,
            setEdgeLabels: this.setEdgeLabels,
        };
    }

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
        const context = this.state;
        return (
            <TransitionGroup className='max'>
                <CSSTransition classNames='mainfade' appear timeout={1000}>
                    <AppContext.Provider value={context}>
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
                            <GraphErrorModal />
                        </div>
                    </AppContext.Provider>
                </CSSTransition>
            </TransitionGroup>
        );
    }
}
