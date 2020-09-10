import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from 'react-bootstrap';
import General from './General';
import Abuse from './Abuse';
import Opsec from './Opsec';
import References from './References';

const AddSelf = ({ sourceName, sourceType, targetName, targetType }) => {
    return (
        <Tabs defaultActiveKey={1} id='help-tab-container' justified>
            <Tab
                eventKey={1}
                title='Info'
                dangerouslySetInnerHTML={General(
                    sourceName,
                    sourceType,
                    targetName,
                    targetType
                )}
            />
            <Tab
                eventKey={2}
                title='Abuse Info'
                dangerouslySetInnerHTML={Abuse(
                    sourceName,
                    sourceType,
                    targetName,
                    targetType
                )}
            />
            <Tab
                eventKey={3}
                title='Opsec Considerations'
                dangerouslySetInnerHTML={Opsec()}
            />
            <Tab
                eventKey={4}
                title='References'
                dangerouslySetInnerHTML={References()}
            />
        </Tabs>
    );
};

AddSelf.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
};
export default AddSelf;
