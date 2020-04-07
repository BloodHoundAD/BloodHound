const Opsec = () => {
    let text = `Prior to executing operating system commands through SQL Server, review the audit configuration and choose a command execution method that is not being monitored.
            
    View audits:
    <code>SELECT * FROM sys.dm_server_audit_status</code>
    
    View server specifications:
    <code>
    SELECT audit_id, 
    a.name as audit_name, 
    s.name as server_specification_name, 
    d.audit_action_name, 
    s.is_state_enabled, 
    d.is_group, 
    d.audit_action_id, 
    s.create_date, 
    s.modify_date 
    FROM sys.server_audits AS a 
    JOIN sys.server_audit_specifications AS s 
    ON a.audit_guid = s.audit_guid 
    JOIN sys.server_audit_specification_details AS d 
    ON s.server_specification_id = d.server_specification_id
    </code>
    
    View database specifications:
    <code>
    SELECT a.audit_id, 
    a.name as audit_name, 
    s.name as database_specification_name, 
    d.audit_action_name, 
    d.major_id,
    OBJECT_NAME(d.major_id) as object,
    s.is_state_enabled, 
    d.is_group, s.create_date, 
    s.modify_date, 
    d.audited_result 
    FROM sys.server_audits AS a 
    JOIN sys.database_audit_specifications AS s 
    ON a.audit_guid = s.audit_guid 
    JOIN sys.database_audit_specification_details AS d 
    ON s.database_specification_id = d.database_specification_id
    </code>
    
    If server audit specifications are configured on the SQL Server, event ID 15457 logs may be created in the Windows Application log when SQL Server level configurations are changed to facilitate OS command execution.
    
    If database audit specifications are configured on the SQL Server, event ID 33205 logs may be created in the Windows Application log when Agent and database level configuration changes are made.
    
    A summary of the what will show up in the logs, along with the TSQL queries for viewing and configuring audit configurations can be found at 
    <a>https://github.com/NetSPI/PowerUpSQL/blob/master/templates/tsql/Audit%20Command%20Execution%20Template.sql</a>.
    
    Author: Scott Sutherland`;
    return { __html: text };
};

export default Opsec;
