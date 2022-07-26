import React from 'react';
import PropTypes from 'prop-types';

const General = ({ sourceName, targetName }) => {
    return (
        <>
            <p>
                The domain {sourceName} is trusted by the domain {targetName}.
            </p>
            <p>
                This edge is informational and does not indicate any attacks,
                only that a trust exists.
            </p>
        </>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    targetName: PropTypes.string,
};

export default General;
