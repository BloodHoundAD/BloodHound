import { groupSpecialFormat} from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} membership in the Distributed COM Users local group on the computer ${targetName}. 
    
    This can allow code execution under certain conditions by instantiating a COM object on a remote machine and invoking its methods.`;
    return { __html: text };
};

export default General;
