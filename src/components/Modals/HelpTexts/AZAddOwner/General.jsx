import React from 'react';

const General = () => {
    return (
        <>
            <p>
                This edge is created during post-processing. It is created against 
                all App Registrations and Service Principals within the same tenant
                when an Azure principal has one of the following Azure Active
                Directory roles:
            </p>

            <p>
                <ul>
                    <li>Hybrid Identity Administrator</li>
                    <li>Partner Tier1 Support</li>
                    <li>Partner Tier2 Support</li>
                    <li>Directory Synchronization Accounts</li>
                </ul>
            </p>

            <p>
                You will not see these privileges when auditing permissions against 
                any of the mentioned objects when you use Microsoft tooling, including 
                the Azure portal or any API.
            </p>
        </>
    );
};

export default General;
