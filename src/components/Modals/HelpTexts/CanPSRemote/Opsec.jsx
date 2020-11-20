const Opsec = () => {
    let text = `When using the PowerShell functions, keep in mind that PowerShell v5 introduced several security mechanisms that make it much easier for defenders to see what's going on with PowerShell in their network, such as script block logging and AMSI.

            Entering a PSSession will generate a logon event on the target computer.`;
    return { __html: text };
};

export default Opsec;
