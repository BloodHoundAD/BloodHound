import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import clsx from 'clsx';
import { AppContext } from '../../AppContext';

const BaseModal = ({ show, onHide, label, className, children }) => {
    var context = useContext(AppContext);
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
