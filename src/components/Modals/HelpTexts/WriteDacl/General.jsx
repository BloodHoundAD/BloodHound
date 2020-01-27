import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} permissions to modify the DACL (Discretionary Access Control List) on the ${typeFormat(
        targetType
    )} ${targetName}. 
    
    With write access to the target object's DACL, you can grant yourself any privilege you want on the object.`;
    return { __html: text };
};

export default General;
