import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} the ability to modify the owner of the ${typeFormat(
        targetType
    )} ${targetName}. 
    
    Object owners retain the ability to modify object security descriptors, regardless of permissions on the object's DACL.`;
    return { __html: text };
};

export default General;
