import { typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `The GPO ${sourceName} is linked to the ${typeFormat(
        targetType
    )} ${targetName}. 
    
    A linked GPO applies its settings to objects in the linked container.`;
    return { __html: text };
};

export default General;
