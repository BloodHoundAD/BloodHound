import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from 'react-bootstrap';
import General from './General';
import WindowsAbuse from './WindowsAbuse';
import LinuxAbuse from './LinuxAbuse';
import Opsec from './Opsec';
import References from './References';

const ReadGMSAPassword = ({
    sourceName,
    sourceType,
    targetName,
    targetType,
}) => {
    return (
        <Tabs defaultActiveKey={1} id='help-tab-container' justified>
            <Tab eventKey={1} title='Info'>
                <General
                    sourceName={sourceName}
                    sourceType={sourceType}
                    targetName={targetName}
                />
            </Tab>
            <Tab eventKey={2} title='Windows Abuse'>
                <WindowsAbuse />
            </Tab>
            <Tab eventKey={3} title='Linux Abuse'>
                <LinuxAbuse />
            </Tab>
            <Tab eventKey={4} title='Opsec'>
                <Opsec />
            </Tab>
            <Tab eventKey={5} title='Refs'>
                <References />
            </Tab>
        </Tabs>
    );
};

ReadGMSAPassword.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
};
export default ReadGMSAPassword;
