import React from 'react';

const General = () => {
    return (
        <>
            <p>
                Azure provides several systems and mechanisms for granting
                control of securable objects within Azure Active Directory,
                including tenant-scoped admin roles, object-scoped admin roles,
                explicit object ownership, and API permissions.
            </p>
            <p>
                When a principal has been granted "Cloud App Admin" or "App
                Admin" against the tenant, that principal gains the ability to
                add new secrets to all Service Principals and App Registrations.
                Additionally, a principal that has been granted "Cloud App
                Admin" or "App Admin" against, or explicit ownership of a
                Service Principal or App Registration gains the ability to add
                secrets to that particular object.
            </p>
        </>
    );
};

export default General;
