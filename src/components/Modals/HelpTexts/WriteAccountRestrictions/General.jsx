import React from 'react';
import { groupSpecialFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                {groupSpecialFormat(sourceType, sourceName)} has write rights on
                all properties in the User Account Restrictions property set.
                Having write access to this property set translates to the
                ability to modify several attributes on computer {targetName},
                among which the msDS-AllowedToActOnBehalfOfOtherIdentity
                attribute is the most interesting. The other attributes in this
                set are listed in Dirk-jan's blog on this topic (see
                references).
            </p>

            <p>
                The ability to modify the
                msDS-AllowedToActOnBehalfOfOtherIdentity property allows an
                attacker to abuse resource-based constrained delegation to
                compromise the remote computer system. This property is a binary
                DACL that controls what security principals can pretend to be
                any domain user to the particular computer object.
            </p>

            <p>
                If the msDS-AllowedToActOnBehalfOfOtherIdentity DACL is set to
                allow an attack-controller account, the attacker can use said
                account to execute a modified S4U2self/S4U2proxy abuse chain to
                impersonate any domain user to the target computer system and
                receive a valid service ticket "as" this user.
            </p>

            <p>
                One caveat is that impersonated users can not be in the
                "Protected Users" security group or otherwise have delegation
                privileges revoked. Another caveat is that the principal added
                to the msDS-AllowedToActOnBehalfOfOtherIdentity DACL *must* have
                a service principal name (SPN) set in order to successfully
                abuse the S4U2self/S4U2proxy process. If an attacker does not
                currently control an account with a SPN set, an attacker can
                abuse the default domain MachineAccountQuota settings to add a
                computer account that the attacker controls via the Powermad
                project.
            </p>
        </>
    );
};

export default General;
