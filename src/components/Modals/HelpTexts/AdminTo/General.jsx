import { groupSpecialFormat } from '../Formatter';

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(
        sourceType,
        sourceName
    )} admin rights to the computer ${targetName}.

    By default, administrators have several ways to perform remote code execution on Windows systems, including via RDP, WMI, WinRM, the Service Control Manager, and remote DCOM execution.

    Further, administrators have several options for impersonating other users logged onto the system, including plaintext password extraction, token impersonation, and injecting into processes running as another user.

    Finally, administrators can often disable host-based security controls that would otherwise prevent the aforementioned techniques.`;
    return { __html: text };
};

export default General;
