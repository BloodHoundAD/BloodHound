import { groupSpecialFormat} from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} the DS-Replication-Get-Changes and the DS-Replication-Get-Changes-All privilege on the domain ${targetName}.
    
    These two privileges allow a principal to perform a DCSync attack.`;
    return { __html: text };
};

export default General;
