const Opsec = () => {
    let text = `When using the PowerView functions, keep in mind that PowerShell v5 introduced several security mechanisms that make it much easier for defenders to see what's going on with PowerShell in their network, such as script block logging and AMSI. You can bypass those security mechanisms by downgrading to PowerShell v2, which all PowerView functions support.

            Modifying permissions on an object will generate 4670 and 4662 events on the domain controller that handled the request.
            
            Additional opsec considerations depend on the target object and how to take advantage of this privilege. Opsec considerations for each abuse primitive are documented on the specific abuse edges and on the BloodHound wiki.`;
    return { __html: text };
};

export default Opsec;
