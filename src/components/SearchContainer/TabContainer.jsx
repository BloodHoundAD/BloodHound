import React, { Component } from 'react';
import DatabaseDataDisplay from './Tabs/DatabaseDataDisplay';
import PrebuiltQueriesDisplay from './Tabs/PrebuiltQueriesDisplay';
import NoNodeData from './Tabs/NoNodeData';
import UserNodeData from './Tabs/UserNodeData';
import GroupNodeData from './Tabs/GroupNodeData';
import ComputerNodeData from './Tabs/ComputerNodeData';
import DomainNodeData from './Tabs/DomainNodeData';
import GpoNodeData from './Tabs/GPONodeData';
import OuNodeData from './Tabs/OUNodeData';
import AZGroupNodeData from './Tabs/AZGroupNodeData';
import AZUserNodeData from './Tabs/AZUserNodeData';
import AZKeyVaultNodeData from './Tabs/AZKeyVaultNodeData';
import AZResourceGroupNodeData from './Tabs/AZResourceGroupNodeData';
import AZDeviceNodeData from './Tabs/AZDeviceNodeData';
import AZSubscriptionNodeData from './Tabs/AZSubscriptionNodeData';
import AZTenantNodeData from './Tabs/AZTenantNodeData';
import AZVMNodeData from './Tabs/AZVMNodeData';
import AZServicePrincipalNodeData from './Tabs/AZServicePrincipal';
import AZAppNodeData from './Tabs/AZApp';
import { Tabs, Tab } from 'react-bootstrap';
import { openSync, readSync, closeSync } from 'fs';
import imageType from 'image-type';
import { withAlert } from 'react-alert';
import styles from './TabContainer.module.css';

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
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
            selected: 1,
        };
    }

    nodeClickHandler(type) {
        if (type === 'User') {
            this._userNodeClicked();
        } else if (type === 'Group') {
            this._groupNodeClicked();
        } else if (type === 'Computer') {
            this._computerNodeClicked();
        } else if (type === 'Domain') {
            this._domainNodeClicked();
        } else if (type === 'OU') {
            this._ouNodeClicked();
        } else if (type === 'GPO') {
            this._gpoNodeClicked();
        } else if (type === 'AZGroup') {
            this._azGroupNodeClicked();
        } else if (type === 'AZUser') {
            this._azUserNodeClicked();
        } else if (type === 'AZKeyVault') {
            this._azKeyVaultNodeClicked();
        } else if (type === 'AZResourceGroup') {
            this._azResourceGroupNodeClicked();
        } else if (type === 'AZDevice') {
            this._azDeviceNodeClicked();
        } else if (type === 'AZSubscription') {
            this._azSubscriptionNodeClicked();
        } else if (type === 'AZTenant') {
            this._azTenantNodeClicked();
        } else if (type === 'AZVM') {
            this._azVMNodeClicked();
        } else if (type === 'AZServicePrincipal') {
            this._azServicePrincipalNodeClicked();
        } else if (type === 'AZApp') {
            this._azAppNodeClicked();
        }
    }

    componentDidMount() {
        emitter.on('nodeClicked', this.nodeClickHandler.bind(this));
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
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
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
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
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
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
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
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
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
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
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
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azGroupNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: true,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azUserNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: true,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azKeyVaultNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: true,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azResourceGroupNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: true,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azDeviceNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: true,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azSubscriptionNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: true,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azTenantNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: true,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azVMNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: true,
            azServicePrincipalVisible: false,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azServicePrincipalNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: true,
            azAppVisible: false,
        });
        this.setState({ selected: 2 });
    }

    _azAppNodeClicked() {
        this.setState({
            userVisible: false,
            computerVisible: false,
            groupVisible: false,
            domainVisible: false,
            gpoVisible: false,
            ouVisible: false,
            azGroupVisible: false,
            azUserVisible: false,
            azKeyVaultVisible: false,
            azResourceGroupVisible: false,
            azDeviceVisible: false,
            azSubscriptionVisible: false,
            azTenantVisible: false,
            azVMVisible: false,
            azServicePrincipalVisible: false,
            azAppVisible: true,
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
                    id='tabcontainer'
                    bsStyle='pills'
                    activeKey={this.state.selected}
                    onSelect={this._handleSelect.bind(this)}
                    className={styles.tc}
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
                                !this.state.ouVisible &&
                                !this.state.azGroupVisible &&
                                !this.state.azUserVisible &&
                                !this.state.azKeyVaultVisible &&
                                !this.state.azResourceGroupVisible &&
                                !this.state.azDeviceVisible &&
                                !this.state.azSubscriptionVisible &&
                                !this.state.azTenantVisible &&
                                !this.state.azVMVisible &&
                                !this.state.azServicePrincipalVisible &&
                                !this.state.azAppVisible
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
                        <AZGroupNodeData visible={this.state.azGroupVisible} />
                        <AZUserNodeData visible={this.state.azUserVisible} />
                        <AZKeyVaultNodeData
                            visible={this.state.azKeyVaultVisible}
                        />
                        <AZResourceGroupNodeData
                            visible={this.state.azResourceGroupVisible}
                        />
                        <AZDeviceNodeData
                            visible={this.state.azDeviceVisible}
                        />
                        <AZSubscriptionNodeData
                            visible={this.state.azSubscriptionVisible}
                        />
                        <AZTenantNodeData
                            visible={this.state.azTenantVisible}
                        />
                        <AZVMNodeData visible={this.state.azVMVisible} />
                        <AZServicePrincipalNodeData
                            visible={this.state.azServicePrincipalVisible}
                        />
                        <AZAppNodeData visible={this.state.azAppVisible} />
                    </Tab>

                    <Tab eventKey={3} title='Analysis'>
                        <PrebuiltQueriesDisplay />
                    </Tab>
                </Tabs>
            </div>
        );
    }
}

export default withAlert()(TabContainer);
