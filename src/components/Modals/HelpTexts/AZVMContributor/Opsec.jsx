const Opsec = () => {
    let text = `Because you'll be running a command as the SYSTEM user on the Virtual Machine, the same opsec considerations for running malicious commands on any system should be taken into account: command line logging, PowerShell script block logging, EDR, etc.`;
    return { __html: text };
};

export default Opsec;
