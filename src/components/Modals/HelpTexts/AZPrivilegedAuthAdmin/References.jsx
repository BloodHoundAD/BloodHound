import React from 'react';

const References = () => {
    return (
        <>
            <a href='https://attack.mitre.org/techniques/T1098/'>
                ATT&amp;CK T1098: Account Manipulation
            </a>
            <br />
            <a href='https://posts.specterops.io/azure-privilege-escalation-via-service-principal-abuse-210ae2be2a5'>
                Andy Robbins - Azure Privilege Escalation via Service Principal
                Abuse
            </a>
            <br />
            <a href='https://powerzure.readthedocs.io/en/latest/Functions/operational.html#set-azureuserpassword'>
                PowerZure Set-AzureUserPassword
            </a>
            <br />
            <a href='https://learn.microsoft.com/en-us/azure/active-directory/roles/permissions-reference#privileged-authentication-administrator'>
                Microsoft Azure AD roles
            </a>
            <br />
            <a href='https://docs.microsoft.com/en-us/azure/active-directory/roles/assign-roles-different-scopes'>
                Assign Azure AD roles at different scopes
            </a>
        </>
    );
};

export default References;
