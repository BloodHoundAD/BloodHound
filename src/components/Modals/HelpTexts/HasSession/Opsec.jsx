const Opsec = () => {
    let text = `An EDR product may detect your attempt to inject into lsass and alert a SOC analyst. There are many more opsec considerations to keep in mind when stealing credentials or tokens. For more information, see the References tab.`;
    return { __html: text };
};

export default Opsec;
