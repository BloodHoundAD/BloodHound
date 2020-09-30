import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from 'react-bootstrap';
import General from './General';
import Abuse from './Abuse';
import Opsec from './Opsec';
import References from './References';

const MemberOf = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <Tabs defaultActiveKey={1} id='tab-style' bsStyle='pills' justified>
            <Tab
                eventKey={1}
                title='GENERAL'
                dangerouslySetInnerHTML={General(
                    sourceName,
                    sourceType,
                    targetName,
                    targetType
                )}
            />
            <Tab eventKey={2} title='ABUSE' dangerouslySetInnerHTML={Abuse()} />
            <Tab eventKey={3} title='OPSEC' dangerouslySetInnerHTML={Opsec()} />
            <Tab
                eventKey={4}
                title='REFERENCES'
                dangerouslySetInnerHTML={References()}
            />
        </Tabs>
    );
};

MemberOf.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
};
export default MemberOf;
