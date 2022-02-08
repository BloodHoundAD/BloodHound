import { typeFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${targetName} is a Group Managed Service Account. The ${typeFormat(
        sourceType
    )} ${sourceName} can retrieve the password for the GMSA ${targetName}.
    
    Group Managed Service Accounts are a special type of Active Directory object, where the password for that object is mananaged by and automatically changed by Domain Controllers on a set interval (check the MSDS-ManagedPasswordInterval attribute). 
    
    The intended use of a GMSA is to allow certain computer accounts to retrieve the password for the GMSA, then run local services as the GMSA. An attacker with control of an authorized principal may abuse that privilege to impersonate the GMSA.`;
    return { __html: text };
};

export default General;
