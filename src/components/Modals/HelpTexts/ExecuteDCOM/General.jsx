import React from 'react';
import PropTypes from 'prop-types';
import { groupSpecialFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} membership in the
                Distributed COM Users local group on the computer {targetName}.
            </p>
            <p>
                This can allow code execution under certain conditions by
                instantiating a COM object on a remote machine and invoking its
                methods.
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
