import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                Executing the attack will generate a 5136 (A directory object
                was modified) event at the domain controller if an appropriate
                SACL is in place on the target object.
            </p>

            <p>
                If PKINIT is not common in the environment, a 4768 (Kerberos
                authentication ticket (TGT) was requested) ticket can also
                expose the attacker.
            </p>
        </>
    );
};

export default Opsec;
