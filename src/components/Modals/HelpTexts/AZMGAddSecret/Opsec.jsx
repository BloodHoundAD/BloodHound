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
        </>
    );
};

export default Opsec;
