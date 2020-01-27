import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} the AllExtendedRights privilege to the ${typeFormat(
        targetType
    )} ${targetName}. 
    
    Extended rights are special rights granted on objects which allow reading of privileged attributes, as well as performing special actions. `;
    return { __html: text };
};

export default General;
