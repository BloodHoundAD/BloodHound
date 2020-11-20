import { groupSpecialFormat, typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `General text goes here.`;
    return { __html: text };
};

export default General;