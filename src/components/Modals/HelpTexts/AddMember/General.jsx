import { groupSpecialFormat} from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} the ability to add arbitrary principals, including ${
        sourceType === 'Group' ? 'themselves' : 'itself'
    }, to the group ${targetName}. Because of security group delegation, the members of a security group have the same privileges as that group. 
    
    By adding itself to the group, ${sourceName} will gain the same privileges that ${targetName} already has.`;
    return { __html: text };
};

export default General;
