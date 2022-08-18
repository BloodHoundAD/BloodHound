import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                No abuse is necessary. This edge only indicates
                that the service principal exposes a particular
                AzureAD application role.
            </p>
            <p>
               Some roles exposed by specific applications like the Microsoft Graph can be exploited like:
            </p>
            <ul>
                <li>AppRoleAssignment.ReadWrite.All</li>
                <li>RoleManagement.ReadWrite.Directory</li>
                <li>Mail.Read</li>
                <li>Directory.Read.All</li>
                <li>...</li>
            </ul>
        </>
    );
};

export default Abuse;
