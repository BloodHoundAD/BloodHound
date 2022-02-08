import { groupSpecialFormat} from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} the ability to write to the "msds-KeyCredentialLink" property on ${targetName}. Writing to this property allows an attacker to create "Shadow Credentials" on the object and authenticate as the principal using kerberos PKINIT.`;

    return { __html: text };
};

export default General;
