import { groupSpecialFormat} from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `When a virtual machine is configured to allow logon with Azure AD credentials, the VM automatically has certain principals added to its local administrators group, including any principal granted the Virtual Machine Administrator Login (or "VMAL") admin role.

    Any principal granted this role, scoped to the affected VM, can connect to the VM via RDP and will be granted local admin rights on the VM. Only those principals granted the AzureAD admin roles of "Global Admin", "Privileged Auth Admin", and "Privileged Role Admin", plus other Tier Zero principals, should be granted the VMAL role scoped to a Tier Zero VM.
    `;
    return { __html: text };
};

export default General;
