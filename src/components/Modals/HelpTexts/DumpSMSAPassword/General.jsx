import React from 'react';
import PropTypes from 'prop-types';

import { groupSpecialFormat } from '../Formatter';

const General = ({sourceName, sourceType, targetName, targetType}) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} the
                Standalone Managed Service Account (sMSA) {targetName} installed on it.
            </p>

            <p>
                With administrative privileges on {sourceName}, it is
                possible to dump {targetName}'s password stored in LSA
                secrets.
            </p>
        </>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
};

export default General;
