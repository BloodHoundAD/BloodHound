import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from 'react-bootstrap';
import General from './General';
import Abuse from './Abuse';
import Opsec from './Opsec';
import References from './References';

const AZAKSContributor = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <Tabs defaultActiveKey={1} id='tab-style' bsStyle='pills' justified>
            <Tab eventKey={1} title='INFO'>
                <General />
            </Tab>
            <Tab eventKey={2} title='ABUSE'>
                <Abuse />
            </Tab>
            <Tab eventKey={3} title='OPSEC'>
                <Opsec />
            </Tab>
            <Tab eventKey={4} title='REFERENCES'>
                <References />
            </Tab>
        </Tabs>
    );
};

AZAKSContributor.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
};
export default AZAKSContributor;
