import React from 'react';
import PropTypes from 'prop-types';

const Abuse = ({ targetName }) => {
    return (
        <>
            <p>
                The PowerShell script Invoke-DCOM implements lateral movement
                using a variety of different COM objects (ProgIds:
                MMC20.Application, ShellWindows, ShellBrowserWindow,
                ShellBrowserWindow, and ExcelDDE). LethalHTA implements lateral
                movement using the HTA COM object (ProgId: htafile).
            </p>

            <p>
                One can manually instantiate and manipulate COM objects on a
                remote machine using the following PowerShell code. If
                specifying a COM object by its CLSID:
            </p>
            <pre>
                <code>
                    {`$ComputerName = ${targetName}  # Remote computer\n` +
                        '$clsid = "{fbae34e8-bf95-4da8-bf98-6c6e580aa348}"      # GUID of the COM object\n' +
                        '$Type = [Type]::GetTypeFromCLSID($clsid, $ComputerName)\n' +
                        '$ComObject = [Activator]::CreateInstance($Type)'}
                </code>
            </pre>
            <p>If specifying a COM object by its ProgID:</p>
            <pre>
                <code>
                    {`$ComputerName = ${targetName}  # Remote computer\n` +
                        '$ProgId = "<NAME>"      # GUID of the COM object\n' +
                        '$Type = [Type]::GetTypeFromProgID($ProgId, $ComputerName)\n' +
                        '$ComObject = [Activator]::CreateInstance($Type)'}
                </code>
            </pre>
        </>
    );
};

Abuse.propTypes = {
    targetName: PropTypes.string,
};

export default Abuse;
