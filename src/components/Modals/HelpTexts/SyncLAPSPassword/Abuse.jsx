const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `To abuse this privilege with DirSync, first import DirSync into your agent session or into a PowerShell instance at the console. You must authenticate to the Domain Controller as ${
        sourceType === 'User'
            ? `${sourceName} if you are not running a process as that user`
            : `a member of ${sourceName} if you are not running a process as a member`
    }. Then, execute the <code>Sync-LAPS</code> function:

    <code>Sync-LAPS -LDAPFilter '(samaccountname=TargetComputer$)</code>

    You can target a specific domain controller using the <code>-Server</code> parameter.
    `;
    return { __html: text };
};

export default Abuse;
