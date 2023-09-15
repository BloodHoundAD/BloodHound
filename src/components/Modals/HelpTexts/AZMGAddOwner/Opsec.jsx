import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                Any time you add an owner to any Azure object, the AzureAD audit 
                logs will create an event logging who added an owner to what object, 
                as well as what the new owner added to the object was.
            </p>
        </>
    );
};

export default Opsec;
