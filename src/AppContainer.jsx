import React, { Component } from "react";
import GraphContainer from "./components/Graph";
import SearchContainer from "./components/SearchContainer/SearchContainer";
import SpotlightContainer from "./components/Spotlight/SpotlightContainer";
import LogoutModal from "./components/Modals/LogoutModal";
import DeleteEdgeModal from "./components/Modals/DeleteEdgeModal";
import DeleteNodeModal from "./components/Modals/DeleteNodeModal";
import CancelUploadModal from "./components/Modals/CancelUploadModal";
import ClearWarnModal from "./components/Modals/ClearWarnModal";
import ClearConfirmModal from "./components/Modals/ClearConfirmModal";
import ClearingModal from "./components/Modals/ClearingModal";
import LoadingContainer from "./components/Float/LoadingContainer";
import GenericAlert from "./components/Float/Alert";
import RawQuery from "./components/RawQuery";
import MenuContainer from "./components/Menu/MenuContainer";
import ExportContainer from "./components/Float/ExportContainer";
import Settings from "./components/Float/Settings";
import ZoomContainer from "./components/Zoom/ZoomContainer";
import QueryNodeSelect from "./components/Float/QueryNodeSelect";
import SessionClearModal from "./components/Modals/SessionClearModal";
import About from "./components/Modals/About.jsx";
import NodeEditor from "./components/Float/NodeEditor";
import { CSSTransition, TransitionGroup } from "react-transition-group";

export default class AppContainer extends Component {
    componentDidMount(){
        document.addEventListener('dragover', function(event){
            event.preventDefault();
            return false;
        }, false)

        document.addEventListener('drop', function(event){
            emitter.emit("filedrop", event)
            event.preventDefault();
            return false;
        }, false)
    }

    render() {
        return (
            <TransitionGroup className="max">
                <CSSTransition classNames="mainfade" appear timeout={1000}>
                    <div className="max">
                        <GenericAlert />
                        <ExportContainer />
                        <LoadingContainer />
                        <SpotlightContainer />
                        <GraphContainer />
                        <SearchContainer />
                        <LogoutModal />
                        <DeleteEdgeModal />
                        <DeleteNodeModal />
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
                        <NodeEditor />
                    </div>
                </CSSTransition>
            </TransitionGroup>
        );
    }
}
