import { groupSpecialFormat} from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `Any principal granted the Avere Contributor role, scoped to the affected VM, can reset the built-in administrator password on the VM. Only those principals granted the AzureAD admin roles of "Global Admin", "Privileged Auth Admin", and "Privileged Role Admin", plus other Tier Zero principals, should be granted the VMAL role scoped to a Tier Zero VM.`;
    return { __html: text };
};

export default General;
