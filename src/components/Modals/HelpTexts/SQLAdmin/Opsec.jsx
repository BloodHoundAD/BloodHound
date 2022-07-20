import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                Prior to executing operating system commands through SQL Server,
                review the audit configuration and choose a command execution
                method that is not being monitored.
            </p>
            <p>View audits:</p>
            <pre>
                <code>{'SELECT * FROM sys.dm_server_audit_status'}</code>
            </pre>
            <p>View server specifications:</p>
            <pre>
                <code>
                    {'SELECT audit_id, \n' +
                        'a.name as audit_name, \n' +
                        's.name as server_specification_name, \n' +
                        'd.audit_action_name, \n' +
                        's.is_state_enabled, \n' +
                        'd.is_group, \n' +
                        'd.audit_action_id, \n' +
                        's.create_date, \n' +
                        's.modify_date \n' +
                        'FROM sys.server_audits AS a \n' +
                        'JOIN sys.server_audit_specifications AS s \n' +
                        'ON a.audit_guid = s.audit_guid \n' +
                        'JOIN sys.server_audit_specification_details AS d \n' +
                        'ON s.server_specification_id = d.server_specification_id'}
                </code>
            </pre>
            <p>View database specifications:</p>
            <pre>
                <code>
                    {'SELECT a.audit_id, \n' +
                        'a.name as audit_name, \n' +
                        's.name as database_specification_name, \n' +
                        'd.audit_action_name, \n' +
                        'd.major_id,\n' +
                        'OBJECT_NAME(d.major_id) as object,\n' +
                        's.is_state_enabled, \n' +
                        'd.is_group, s.create_date, \n' +
                        's.modify_date, \n' +
                        'd.audited_result \n' +
                        'FROM sys.server_audits AS a \n' +
                        'JOIN sys.database_audit_specifications AS s \n' +
                        'ON a.audit_guid = s.audit_guid \n' +
                        'JOIN sys.database_audit_specification_details AS d \n' +
                        'ON s.database_specification_id = d.database_specification_id'}
                </code>
            </pre>
            <p>
                If server audit specifications are configured on the SQL Server,
                event ID 15457 logs may be created in the Windows Application
                log when SQL Server level configurations are changed to
                facilitate OS command execution.
            </p>
            <p>
                If database audit specifications are configured on the SQL
                Server, event ID 33205 logs may be created in the Windows
                Application log when Agent and database level configuration
                changes are made.
            </p>
            <p>
                A summary of the what will show up in the logs, along with the
                TSQL queries for viewing and configuring audit configurations
                can be found at
                <a>
                    https://github.com/NetSPI/PowerUpSQL/blob/master/templates/tsql/Audit%20Command%20Execution%20Template.sql
                </a>
                .
            </p>
            <p>Author: Scott Sutherland</p>
        </>
    );
};

export default Opsec;
