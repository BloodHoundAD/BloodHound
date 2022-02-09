import { typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `The ${typeFormat(
        sourceType
    )} ${sourceName} is a member of the group ${targetName}.
            
    Groups in active directory grant their members any privileges the group itself has. If a group has rights to another principal, users/computers in the group, as well as other groups inside the group inherit those permissions.`;
    return { __html: text };
};

export default General;
