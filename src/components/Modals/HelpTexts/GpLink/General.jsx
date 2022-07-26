import React from 'react';
import PropTypes from 'prop-types';
import { typeFormat } from '../Formatter';

const General = ({ sourceName, targetName, targetType }) => {
    return (
        <>
            <p>
                The GPO {sourceName} is linked to the {typeFormat(targetType)}{' '}
                {targetName}.
            </p>
            <p>
                A linked GPO applies its settings to objects in the linked
                container.
            </p>
        </>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
};

export default General;
