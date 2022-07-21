const References = () => {
    let text = `<a href="https://attack.mitre.org/techniques/T1098/">ATT&CK T1098: Account Manipulation</a>
    <a href="https://posts.specterops.io/azure-privilege-escalation-via-service-principal-abuse-210ae2be2a5">Andy Robbins - Azure Privilege Escalation via Service Principal Abuse</a>
    <a href="https://docs.microsoft.com/en-us/azure/active-directory/roles/assign-roles-different-scopes">Assign Azure AD roles at different scopes</a>`;
    return { __html: text };
};

export default References;
