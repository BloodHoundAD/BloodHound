import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} generic write access to the ${typeFormat(targetType)} ${targetName}. 
    
    Generic Write access grants you the ability to write to any non-protected attribute on the target object, including "members" for a group, and "serviceprincipalnames" for a user`;
    return { __html: text };
};

export default General;
