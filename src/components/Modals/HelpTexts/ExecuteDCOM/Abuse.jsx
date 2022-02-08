const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `The PowerShell script Invoke-DCOM implements lateral movement using a variety of different COM objects (ProgIds: MMC20.Application, ShellWindows, ShellBrowserWindow, ShellBrowserWindow, and ExcelDDE).  LethalHTA implements lateral movement using the HTA COM object (ProgId: htafile).  

            One can manually instantiate and manipulate COM objects on a remote machine using the following PowerShell code.  If specifying a COM object by its CLSID:
            
            $ComputerName = ${targetName}  # Remote computer
            $clsid = “{fbae34e8-bf95-4da8-bf98-6c6e580aa348}”      # GUID of the COM object
            $Type = [Type]::GetTypeFromCLSID($clsid, $ComputerName)
            $ComObject = [Activator]::CreateInstance($Type)
            
            If specifying a COM object by its ProgID:
            
            $ComputerName = ${targetName}  # Remote computer
            $ProgId = “<NAME>”      # GUID of the COM object
            $Type = [Type]::GetTypeFromProgID($ProgId, $ComputerName)
            $ComObject = [Activator]::CreateInstance($Type)
            `;
    return { __html: text };
};

export default Abuse;
