import React from 'react';

const General = () => {
    return (
        <>
            <p>
                When a virtual machine is configured to allow logon with Azure
                AD credentials, the VM automatically has certain principals
                added to its local administrators group, including any principal
                granted the Virtual Machine Administrator Login (or "VMAL")
                admin role.
            </p>
            <p>
                Any principal granted this role, scoped to the affected VM, can
                connect to the VM via RDP and will be granted local admin rights
                on the VM.
            </p>
        </>
    );
};

export default General;
