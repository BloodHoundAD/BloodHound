import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                When you create a new secret for an App or Service Principal,
                Azure creates an event called “Update application – Certificates
                and secrets management”. This event describes who added the secret
                to which application or service principal.
            </p>
            <p>
                When resetting a user’s password and letting Azure
                set a new random password, Azure will log two events:
            </p>

            <p>
                “Reset user password” and “Reset password (by admin)”.
                These logs describe who performed the password reset,
                against which user, and at what time.
            </p>

            <p>
                When setting a specified new password for the user,
                Azure will log two events:
            </p>

            <p>
                “Reset user password” and “Update user”. The first log
                will describe who changed the target’s password and when.
            </p>
        </>
    );
};

export default Opsec;
