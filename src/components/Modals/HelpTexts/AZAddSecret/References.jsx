const References = () => {
    let text = `<a href="https://attack.mitre.org/techniques/T1098/">https://attack.mitre.org/techniques/T1098/</a>
    <a href="https://posts.specterops.io/azure-privilege-escalation-via-service-principal-abuse-210ae2be2a5">https://posts.specterops.io/azure-privilege-escalation-via-service-principal-abuse-210ae2be2a5</a>
    <a href="https://docs.microsoft.com/en-us/azure/active-directory/roles/assign-roles-different-scopes">https://docs.microsoft.com/en-us/azure/active-directory/roles/assign-roles-different-scopes</a>`;
    return { __html: text };
};

export default References;
