import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} the capability to
                create a Remote Desktop Connection with the computer{' '}
                {targetName}.
            </p>

            <p>
                Remote Desktop access allows you to enter an interactive session
                with the target computer. If authenticating as a low privilege
                user, a privilege escalation may allow you to gain high
                privileges on the system.
            </p>
            <p>Note: This edge does not guarantee privileged execution.</p>
        </>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
};

export default General;
