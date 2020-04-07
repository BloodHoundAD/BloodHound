import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
        setSourceType(source.type);
        setTargetName(encode(target.label));
        setTargetType(target.type);
        settargetId(target.objectid);
        setHaslaps(target.haslaps);
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
        GpLink: GpLink,
        AddAllowedToAct: AddAllowedToAct,
        AllowedToAct: AllowedToAct,
        SQLAdmin: SQLAdmin,
        ReadGMSAPassword: ReadGMSAPassword,
        HasSIDHistory: HasSIDHistory,
        TrustedBy: TrustedBy,
        CanPSRemote: CanPSRemote,
    };

    const Component = components[edge];

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
