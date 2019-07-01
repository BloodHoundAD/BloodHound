import React, { Component } from 'react';
import DatabaseDataDisplay from './Tabs/DatabaseDataDisplay';
import PrebuiltQueriesDisplay from './Tabs/PrebuiltQueriesDisplay';
import NoNodeData from './Tabs/NoNodeData';
import UserNodeData from './Tabs/UserNodeData';
import GroupNodeData from './Tabs/GroupNodeData';
import ComputerNodeData from './Tabs/ComputerNodeData';
import DomainNodeData from './Tabs/DomainNodeData';
import GpoNodeData from './Tabs/GpoNodeData';
import OuNodeData from './Tabs/OuNodeData';
import { Tabs, Tab } from 'react-bootstrap';
import { openSync, readSync, closeSync } from 'fs';
import imageType from 'image-type';
import { withAlert } from 'react-alert';

class TabContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            selected: 1,
        };
    }

    componentDidMount() {
        emitter.on('userNodeClicked', this._userNodeClicked.bind(this));
        emitter.on('groupNodeClicked', this._groupNodeClicked.bind(this));
        emitter.on('computerNodeClicked', this._computerNodeClicked.bind(this));
        emitter.on('domainNodeClicked', this._domainNodeClicked.bind(this));
        emitter.on('gpoNodeClicked', this._gpoNodeClicked.bind(this));
        emitter.on('ouNodeClicked', this._ouNodeClicked.bind(this));
        emitter.on('imageupload', this.uploadImage.bind(this));
    }

    uploadImage(event) {
        let files = [];
        $.each(event.dataTransfer.files, (_, f) => {
            let buf = Buffer.alloc(12);
            let file = openSync(f.path, 'r');
            readSync(file, buf, 0, 12, 0);
            closeSync(file);
            let type = imageType(buf);
            if (type !== null && type.mime.includes('image')) {
                files.push({ path: f.path, name: f.name });
            } else {
                this.props.alert.info('{} is not an image'.format(f.name));
            }
        });
        emitter.emit('imageUploadFinal', files);
    }

    _userNodeClicked() {
        this.setState({
            userVisible: true,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _groupNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: true,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _computerNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: true,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _domainNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: true,
            gpoVisible: false,
            ouVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _gpoNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: true,
            ouVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _ouNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: true,
        });
        this.setState({ selected: 2 });
    }

    _handleSelect(index, last) {
        this.setState({ selected: index });
    }

    render() {
        return (
            <div>
                <Tabs
                    id='tab-style'
                    bsStyle='pills'
                    activeKey={this.state.selected}
                    onSelect={this._handleSelect.bind(this)}
                >
                    <Tab eventKey={1} title='Database Info'>
                        <DatabaseDataDisplay />
                    </Tab>

                    <Tab eventKey={2} title='Node Info'>
                        <NoNodeData
                            visible={
                                !this.state.userVisible &&
                                !this.state.computerVisible &&
                                !this.state.groupVisible &&
                                !this.state.domainVisible &&
                                !this.state.gpoVisible &&
                                !this.state.ouVisible
                            }
                        />
                        <UserNodeData visible={this.state.userVisible} />
                        <GroupNodeData visible={this.state.groupVisible} />
                        <ComputerNodeData
                            visible={this.state.computerVisible}
                        />
                        <DomainNodeData visible={this.state.domainVisible} />
                        <GpoNodeData visible={this.state.gpoVisible} />
                        <OuNodeData visible={this.state.ouVisible} />
                    </Tab>

                    <Tab eventKey={3} title='Queries'>
                        <PrebuiltQueriesDisplay />
                    </Tab>
                </Tabs>
            </div>
        );
    }
}

export default withAlert()(TabContainer);
