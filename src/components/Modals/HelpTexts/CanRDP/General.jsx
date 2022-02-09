import { groupSpecialFormat} from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} the capability to create a Remote Desktop Connection with the computer ${targetName}.
    
    Remote Desktop access allows you to enter an interactive session with the target computer. If authenticating as a low privilege user, a privilege escalation may allow you to gain high privileges on the system.
    
    Note: This edge does not guarantee privileged execution.`;
    return { __html: text };
};

export default General;
