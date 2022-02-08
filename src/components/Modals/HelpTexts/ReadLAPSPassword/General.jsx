import { groupSpecialFormat} from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} the ability to read the password set by Local Administrator Password Solution (LAPS) on the computer ${targetName}. 
    
    The local administrator password for a computer managed by LAPS is stored in the confidential LDAP attribute,  "ms-mcs-AdmPwd". `;
    return { __html: text };
};

export default General;
