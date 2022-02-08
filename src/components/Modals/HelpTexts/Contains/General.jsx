import { typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `The ${typeFormat(
        sourceType
    )} ${sourceName} contains the ${typeFormat(targetType)} ${targetName}. 
    
    GPOs linked to a container apply to all objects that are contained by the container.`;
    return { __html: text };
};

export default General;
