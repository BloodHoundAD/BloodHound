import React, {useContext} from 'react';
import {Modal} from 'react-bootstrap';
import clsx from 'clsx';
import {AppContext} from '../../AppContext';

const BaseModal = ({ show, onHide, label, className, children }) => {
    let context = useContext(AppContext);
    return (
        <Modal
            show={show}
            animation={false}
            onHide={onHide}
            aria-labelledby={label}
            className={clsx(context.darkMode && 'modal-dark', className)}
        >
            {children}
        </Modal>
    );
};

BaseModal.propTypes = {};
export default BaseModal;
