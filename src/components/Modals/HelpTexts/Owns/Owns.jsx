import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from 'react-bootstrap';
import General from './General';
import WindowsAbuse from './WindowsAbuse';
import LinuxAbuse from './LinuxAbuse';
import Opsec from './Opsec';
import References from './References';

const Owns = ({ sourceName, sourceType, targetName, targetType, targetId }) => {
    return (
        <Tabs defaultActiveKey={1} id='help-tab-container' justified>
            <Tab eventKey={1} title='Info'>
                <General
                    sourceName={sourceName}
                    sourceType={sourceType}
                    targetName={targetName}
                    targetType={targetType}
                />
            </Tab>
            <Tab eventKey={2} title='Windows Abuse'>
                <WindowsAbuse
                    sourceName={sourceName}
                    sourceType={sourceType}
                    targetName={targetName}
                    targetType={targetType}
                    targetId={targetId}
                />
            </Tab>
            <Tab eventKey={3} title='Linux Abuse'>
                <LinuxAbuse
                    sourceName={sourceName}
                    sourceType={sourceType}
                    targetName={targetName}
                    targetType={targetType}
                    targetId={targetId}
                />
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

Owns.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
    targetId: PropTypes.string,
};
export default Owns;
