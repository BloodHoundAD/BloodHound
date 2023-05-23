import React from 'react';

const General = () => {
    return (
        <p>
            This edge indicates the principal has the Privileged Authentication Administrator 
            role active against the target tenant. Principals with this role can update
            sensitive properties for all users. Privileged Authentication Administrator can 
            set or reset any authentication method (including passwords) for any user,
            including Global Administrators.
        </p>
    );
};

export default General;
