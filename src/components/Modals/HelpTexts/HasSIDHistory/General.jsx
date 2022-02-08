import { typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `The ${typeFormat(
        sourceType
    )} ${sourceName} has, in its SIDHistory attribute, the SID for the ${typeFormat(
        targetType
    )} ${targetName}. 
    
    When a kerberos ticket is created for ${sourceName}, it will include the SID for ${targetName}, and therefore grant ${sourceName} the same privileges and permissions as ${targetName}.`;
    return { __html: text };
};

export default General;
