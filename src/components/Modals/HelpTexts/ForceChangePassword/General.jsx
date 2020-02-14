import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} the capability to change the ${typeFormat(
        targetType
    )} ${targetName}'s password without knowing that user's current password.`;
    return { __html: text };
};

export default General;
