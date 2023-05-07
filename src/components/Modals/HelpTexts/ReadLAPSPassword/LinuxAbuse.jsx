import React from 'react';
import PropTypes from 'prop-types';

const LinuxAbuse = ({ sourceName, sourceType }) => {
    return (
        <>
            <p>
                Sufficient control on a computer object is abusable when
                the computer's local admin account credential is
                controlled with LAPS. The clear-text password for
                the local administrator account is stored in an
                extended attribute on the computer object called
                ms-Mcs-AdmPwd.
            </p>

            <p>
                <a href='https://github.com/p0dalirius/pyLAPS'>pyLAPS</a> can be used
                 to retrieve LAPS passwords:
            </p>

            <pre>
                <code>
                    {
                        'pyLAPS.py --action get -d "DOMAIN" -u "ControlledUser" -p "ItsPassword"'
                    }
                </code>
            </pre>
        </>
    );
};

LinuxAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
};

export default LinuxAbuse;
