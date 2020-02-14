export const groupSpecialFormat = (sourceType, sourceName) => {
    if (sourceType === 'Group') {
        return `The members of the ${typeFormat(
            sourceType
        )} ${sourceName} have`;
    } else {
        return `The ${typeFormat(sourceType)} ${sourceName} has`;
    }
};

export const typeFormat = type => {
    if (type === 'GPO' || type === 'OU') {
        return type;
    } else {
        return type.toLowerCase();
    }
};
