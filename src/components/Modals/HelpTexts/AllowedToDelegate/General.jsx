import React from 'react';
import PropTypes from 'prop-types';
import { typeFormat } from '../Formatter';

const General = ({ sourceName, sourceType, targetName }) => {
    return (
        <>
            <p>
                The {typeFormat(sourceType)} {sourceName} has the constrained
                delegation privilege to the computer {targetName}.
            </p>

            <p>
                The constrained delegation primitive allows a principal to
                authenticate as any user to specific services (found in the
                msds-AllowedToDelegateTo LDAP property in the source node tab)
                on the target computer. That is, a node with this privilege can
                impersonate any domain principal (including Domain Admins) to
                the specific service on the target host. One caveat-
                impersonated users can not be in the "Protected Users" security
                group or otherwise have delegation privileges revoked.
            </p>

            <p>
                An issue exists in the constrained delegation where the service
                name (sname) of the resulting ticket is not a part of the
                protected ticket information, meaning that an attacker can
                modify the target service name to any service of their choice.
                For example, if msds-AllowedToDelegateTo is
                "HTTP/host.domain.com", tickets can be modified for
                LDAP/HOST/etc. service names, resulting in complete server
                compromise, regardless of the specific service listed.
            </p>
        </>
    );
};

General.propTypes = {
    sourceName: PropTypes.string,
    sourceType: PropTypes.string,
    targetName: PropTypes.string,
};

export default General;
