import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} GenericAll privileges to the ${typeFormat(targetType)} ${targetName}. 
    
    This is also known as full control. This privilege allows the trustee to manipulate the target object however they wish.`;
    return { __html: text };
};

export default General;
