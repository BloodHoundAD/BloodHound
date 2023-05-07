import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import GenericAll from './HelpTexts/GenericAll/GenericAll';
import { Button, Modal } from 'react-bootstrap';
import { encode } from 'he';
import MemberOf from './HelpTexts/MemberOf/MemberOf';
import AllExtendedRights from './HelpTexts/AllExtendedRights/AllExtendedRights';
import AdminTo from './HelpTexts/AdminTo/AdminTo';
import HasSession from './HelpTexts/HasSession/HasSession';
import AddMember from './HelpTexts/AddMember/AddMember';
import ForceChangePassword from './HelpTexts/ForceChangePassword/ForceChangePassword';
import GenericWrite from './HelpTexts/GenericWrite/GenericWrite';
import Owns from './HelpTexts/Owns/Owns';
import WriteDacl from './HelpTexts/WriteDacl/WriteDacl';
import WriteOwner from './HelpTexts/WriteOwner/WriteOwner';
import CanRDP from './HelpTexts/CanRDP/CanRDP';
import ExecuteDCOM from './HelpTexts/ExecuteDCOM/ExecuteDCOM';
import AllowedToDelegate from './HelpTexts/AllowedToDelegate/AllowedToDelegate';
import GetChanges from './HelpTexts/GetChanges/GetChanges';
import GetChangesAll from './HelpTexts/GetChangesAll/GetChangesAll';
import ReadLAPSPassword from './HelpTexts/ReadLAPSPassword/ReadLAPSPassword';
import Contains from './HelpTexts/Contains/Contains';
import GpLink from './HelpTexts/GpLink/GpLink';
import AddAllowedToAct from './HelpTexts/AddAllowedToAct/AddAllowedToAct';
import AllowedToAct from './HelpTexts/AllowedToAct/AllowedToAct';
import SQLAdmin from './HelpTexts/SQLAdmin/SQLAdmin';
import ReadGMSAPassword from './HelpTexts/ReadGMSAPassword/ReadGMSAPassword';
import HasSIDHistory from './HelpTexts/HasSIDHistory/HasSIDHistory';
import TrustedBy from './HelpTexts/TrustedBy/TrustedBy';
import CanPSRemote from './HelpTexts/CanPSRemote/CanPSRemote';
import AZAddMembers from './HelpTexts/AZAddMembers/AZAddMembers';
import AZAddSecret from './HelpTexts/AZAddSecret/AZAddSecret';
import AZAvereContributor from './HelpTexts/AZAvereContributor/AZAvereContributor';
import AZContains from './HelpTexts/AZContains/AZContains';
import AZContributor from './HelpTexts/AZContributor/AZContributor';
import AZExecuteCommand from './HelpTexts/AZExecuteCommand/AZExecuteCommand';
import AZGetCertificates from './HelpTexts/AZGetCertificates/AZGetCertificates';
import AZGetKeys from './HelpTexts/AZGetKeys/AZGetKeys';
import AZGetSecrets from './HelpTexts/AZGetSecrets/AZGetSecrets';
import AZHasRole from './HelpTexts/AZHasRole/AZHasRole';
import AZManagedIdentity from './HelpTexts/AZManagedIdentity/AZManagedIdentity';
import AZMemberOf from './HelpTexts/AZMemberOf/AZMemberOf';
import AZOwns from './HelpTexts/AZOwns/AZOwns';
import AZPrivilegedAuthAdmin from './HelpTexts/AZPrivilegedAuthAdmin/AZPrivilegedAuthAdmin';
import AZPrivilegedRoleAdmin from './HelpTexts/AZPrivilegedRoleAdmin/AZPrivilegedRoleAdmin';
import AZResetPassword from './HelpTexts/AZResetPassword/AZResetPassword';
import AZUserAccessAdministrator from './HelpTexts/AZUserAccessAdministrator/AZUserAccessAdministrator';
import AZGlobalAdmin from './HelpTexts/AZGlobalAdmin/AZGlobalAdmin';
import AZAppAdmin from './HelpTexts/AZAppAdmin/AZAppAdmin';
import AZCloudAppAdmin from './HelpTexts/AZCloudAppAdmin/AZCloudAppAdmin';
import AZRunsAs from './HelpTexts/AZRunsAs/AZRunsAs';
import AZVMAdminLogin from './HelpTexts/AZVMAdminLogin/AZVMAdminLogin';
import AZVMContributor from './HelpTexts/AZVMContributor/AZVMContributor';
import Default from './HelpTexts/Default/Default';
import WriteSPN from './HelpTexts/WriteSPN/WriteSPN';
import AddSelf from './HelpTexts/AddSelf/AddSelf';
import AddKeyCredentialLink from './HelpTexts/AddKeyCredentialLink/AddKeyCredentialLink';
import DCSync from './HelpTexts/DCSync/DCSync';
import SyncLAPSPassword from './HelpTexts/SyncLAPSPassword/SyncLAPSPassword';
import WriteAccountRestrictions from './HelpTexts/WriteAccountRestrictions/WriteAccountRestrictions';
import DumpSMSAPassword from './HelpTexts/DumpSMSAPassword/DumpSMSAPassword';
import AZMGAddMember from './HelpTexts/AZMGAddMember/AZMGAddMember';
import AZMGAddOwner from './HelpTexts/AZMGAddOwner/AZMGAddOwner';
import AZMGAddSecret from './HelpTexts/AZMGAddSecret/AZMGAddSecret';
import AZMGGrantAppRoles from './HelpTexts/AZMGGrantAppRoles/AZMGGrantAppRoles';
import AZMGGrantRole from './HelpTexts/AZMGGrantRole/AZMGGrantRole';
import AZMGAppRoleAssignment_ReadWrite_All from './HelpTexts/AZMGAppRoleAssignment_ReadWrite_All/AZMGAppRoleAssignment_ReadWrite_All';
import AZMGApplication_ReadWrite_All from './HelpTexts/AZMGApplication_ReadWrite_All/AZMGApplication_ReadWrite_All';
import AZMGDirectory_ReadWrite_All from './HelpTexts/AZMGDirectory_ReadWrite_All/AZMGDirectory_ReadWrite_All';
import AZMGGroupMember_ReadWrite_All from './HelpTexts/AZMGGroupMember_ReadWrite_All/AZMGGroupMember_ReadWrite_All';
import AZMGGroup_ReadWrite_All from './HelpTexts/AZMGGroup_ReadWrite_All/AZMGGroup_ReadWrite_All';
import AZMGRoleManagement_ReadWrite_Directory from './HelpTexts/AZMGRoleManagement_ReadWrite_Directory/AZMGRoleManagement_ReadWrite_Directory';
import AZMGServicePrincipalEndpoint_ReadWrite_All from './HelpTexts/AZMGServicePrincipalEndpoint_ReadWrite_All/AZMGServicePrincipalEndpoint_ReadWrite_All';
import AZWebsiteContributor from './HelpTexts/AZWebsiteContributor/AZWebsiteContributor';
import AZAutomationContributor from './HelpTexts/AZAutomationContributor/AZAutomationContributor';
import AZAddOwner from './HelpTexts/AZAddOwner/AZAddOwner';
import AZAKSContributor from './HelpTexts/AZAKSContributor/AZAKSContributor';
import AZKeyVaultKVContributor from './HelpTexts/AZKeyVaultKVContributor/AZKeyVaultKVContributor';
import AZLogicAppContributor from './HelpTexts/AZLogicAppContributor/AZLogicAppContributor';
import AZNodeResourceGroup from './HelpTexts/AZNodeResourceGroup/AZNodeResourceGroup';

const HelpModal = () => {
    const [sourceName, setSourceName] = useState('');
    const [sourceType, setSourceType] = useState('');
    const [targetName, setTargetName] = useState('');
    const [targetType, setTargetType] = useState('');
    const [haslaps, setHaslaps] = useState(false);
    const [targetId, settargetId] = useState('');
    const [edge, setEdge] = useState('MemberOf');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        emitter.on('displayHelp', openModal);
        return () => {
            emitter.removeListener('displayHelp', openModal);
        };
    }, []);

    const closeModal = () => {
        setOpen(false);
    };

    const openModal = (edge, source, target) => {
        setSourceName(encode(source.label));
        setSourceType(encode(source.type));
        setTargetName(encode(target.label));
        setTargetType(encode(target.type));
        settargetId(encode(target.objectid));
        if (!typeof target.haslaps === 'boolean') {
            setHaslaps(false);
        } else {
            setHaslaps(target.haslaps);
        }
        setEdge(edge.etype);
        setOpen(true);
    };

    const components = {
        GenericAll: GenericAll,
        MemberOf: MemberOf,
        AllExtendedRights: AllExtendedRights,
        AdminTo: AdminTo,
        HasSession: HasSession,
        AddMember: AddMember,
        ForceChangePassword: ForceChangePassword,
        GenericWrite: GenericWrite,
        Owns: Owns,
        WriteDacl: WriteDacl,
        WriteOwner: WriteOwner,
        CanRDP: CanRDP,
        ExecuteDCOM: ExecuteDCOM,
        AllowedToDelegate: AllowedToDelegate,
        GetChanges: GetChanges,
        GetChangesAll: GetChangesAll,
        ReadLAPSPassword: ReadLAPSPassword,
        Contains: Contains,
        GPLink: GpLink,
        AddAllowedToAct: AddAllowedToAct,
        AllowedToAct: AllowedToAct,
        SQLAdmin: SQLAdmin,
        ReadGMSAPassword: ReadGMSAPassword,
        HasSIDHistory: HasSIDHistory,
        TrustedBy: TrustedBy,
        CanPSRemote: CanPSRemote,
        AZAddMembers: AZAddMembers,
        AZAddSecret: AZAddSecret,
        AZAvereContributor: AZAvereContributor,
        AZContains: AZContains,
        AZContributor: AZContributor,
        AZExecuteCommand: AZExecuteCommand,
        AZGetCertificates: AZGetCertificates,
        AZGetKeys: AZGetKeys,
        AZGetSecrets: AZGetSecrets,
        AZHasRole: AZHasRole,
        AZManagedIdentity: AZManagedIdentity,
        AZMemberOf: AZMemberOf,
        AZOwns: AZOwns,
        AZPrivilegedAuthAdmin: AZPrivilegedAuthAdmin,
        AZPrivilegedRoleAdmin: AZPrivilegedRoleAdmin,
        AZResetPassword: AZResetPassword,
        AZUserAccessAdministrator: AZUserAccessAdministrator,
        AZGlobalAdmin: AZGlobalAdmin,
        AZAppAdmin: AZAppAdmin,
        AZCloudAppAdmin: AZCloudAppAdmin,
        AZRunsAs: AZRunsAs,
        AZVMAdminLogin: AZVMAdminLogin,
        AZVMContributor: AZVMContributor,
        WriteSPN: WriteSPN,
        AddSelf: AddSelf,
        AddKeyCredentialLink: AddKeyCredentialLink,
        DCSync: DCSync,
        SyncLAPSPassword: SyncLAPSPassword,
        WriteAccountRestrictions: WriteAccountRestrictions,
        DumpSMSAPassword: DumpSMSAPassword,
        AZMGAddMember: AZMGAddMember,
        AZMGAddOwner: AZMGAddOwner,
        AZMGAddSecret: AZMGAddSecret,
        AZMGGrantAppRoles: AZMGGrantAppRoles,
        AZMGGrantRole: AZMGGrantRole,
        AZMGAppRoleAssignment_ReadWrite_All: AZMGAppRoleAssignment_ReadWrite_All,
        AZMGApplication_ReadWrite_All: AZMGApplication_ReadWrite_All,
        AZMGDirectory_ReadWrite_All: AZMGDirectory_ReadWrite_All,
        AZMGGroupMember_ReadWrite_All: AZMGGroupMember_ReadWrite_All,
        AZMGGroup_ReadWrite_All: AZMGGroup_ReadWrite_All,
        AZMGRoleManagement_ReadWrite_Directory: AZMGRoleManagement_ReadWrite_Directory,
        AZMGServicePrincipalEndpoint_ReadWrite_All: AZMGServicePrincipalEndpoint_ReadWrite_All,
        AZWebsiteContributor: AZWebsiteContributor,
        AZAddOwner: AZAddOwner,
        AZAKSContributor: AZAKSContributor,
        AZAutomationContributor: AZAutomationContributor,
        AZKeyVaultKVContributor: AZKeyVaultKVContributor,
        AZLogicAppContributor: AZLogicAppContributor,
        AZNodeResourceGroup: AZNodeResourceGroup,
    };

    const Component = edge in components ? components[edge] : Default;

    return (
        <BaseModal
            show={open}
            onHide={closeModal}
            label='HelpHeader'
            className='help-modal-width'
        >
            <Modal.Header closeButton>
                <Modal.Title id='HelpHeader'>Help: {edge}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Component
                    sourceName={sourceName}
                    sourceType={sourceType}
                    targetName={targetName}
                    targetType={targetType}
                    targetId={targetId}
                    haslaps={haslaps}
                />
            </Modal.Body>

            <Modal.Footer>
                <Button onClick={closeModal}>Close</Button>
            </Modal.Footer>
        </BaseModal>
    );
};

HelpModal.propTypes = {};
export default HelpModal;
