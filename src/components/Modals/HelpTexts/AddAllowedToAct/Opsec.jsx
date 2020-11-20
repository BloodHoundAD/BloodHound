const Opsec = () => {
    let text = `To execute this attack, the Rubeus C# assembly needs to be executed on some system with the ability to send/receive traffic in the domain. Modification of the *msDS-AllowedToActOnBehalfOfOtherIdentity* property against the target also must occur, whether through PowerShell or another method. The property should be cleared (or reset to its original value) after attack execution in order to prevent easy detection.`;
    return { __html: text };
};

export default Opsec;
