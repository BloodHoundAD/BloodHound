import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from 'react-bootstrap';
import General from './General';
import Abuse from './Abuse';
import Opsec from './Opsec';
import References from './References';

const HasSession = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <Tabs defaultActiveKey={1} id='tab-style' bsStyle='pills' justified>
            <Tab eventKey={1} title='GENERAL' className='helptab'>
                <General sourceName={sourceName} targetName={targetName} />
            </Tab>
            <Tab eventKey={2} title='ABUSE' className='helptab'>
                <Abuse />
            </Tab>
            <Tab eventKey={3} title='OPSEC' className='helptab'>
                <Opsec />
            </Tab>
            <Tab eventKey={4} title='REFERENCES' className='helptab'>
                <References />
            </Tab>
        </Tabs>
    );
};

HasSession.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
};
export default HasSession;
