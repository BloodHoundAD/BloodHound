import React from 'react';
import {groupSpecialFormat} from "../Formatter";

const Abuse = ({sourceName, sourceType, targetName, targetType}) => {
    return (
        <>
            <p>
                To abuse this privilege with DirSync, first import DirSync into your agent session or into a PowerShell instance at the console. You must authenticate to the Domain Controller as {groupSpecialFormat(sourceType, sourceName)}. Then, execute the <code>Sync-LAPS</code> function:
            </p>

            <pre>
                <code>
                    Sync-LAPS -LDAPFilter &quot;(samaccountname={targetName})&quot;
                </code>
            </pre>

            <p>
                You can target a specific domain controller using the <code>-Server</code> parameter.
            </p>
        </>
    )
};

export default Abuse;
