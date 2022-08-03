import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                When abusing a GMSA that is already logged onto a system, you
                will have the same opsec considerations as when abusing a
                standard user logon. For more information about that, see the
                "HasSession" modal's opsec considerations tab.
            </p>
            <p>
                When retrieving the GMSA password from Active Directory, you may
                generate a 4662 event on the Domain Controller; however, that
                event will likely perfectly resemble a legitimate event if you
                request the password from the same context as a computer account
                that is already authorized to read the GMSA password.
            </p>
        </>
    );
};

export default Opsec;
