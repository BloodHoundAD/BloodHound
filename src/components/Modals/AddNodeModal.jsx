import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';

export default class AddNodeModal extends Component {
    constructor() {
        super();
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        emitter.on('addNode', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    validate() {
        let name = jQuery(this.refs.name).val();
        let type = jQuery(this.refs.type).val();
        let validate = jQuery(this.refs.validate);
        let error = jQuery(this.refs.error);
        let complete = jQuery(this.refs.complete);

        if (name === '') {
            validate.addClass('has-error');
            error.html('Name cannot be blank!');
            error.show();
            return;
        }

        if (type === 'Computer') {
            if (!name.includes('.') || name.split('.').length < 3) {
                validate.addClass('has-error');
                error.html(
                    'Computer name must be similar to COMPUTER.DOMAIN.COM'
                );
                error.show();
                return;
            }
        } else {
            if (!name.includes('@') || name.split('@').length > 2) {
                validate.addClass('has-error');
                error.html('Name must be similar to NAME@DOMAIN.COM');
                error.show();
                return;
            }

            let dpart = name.split('@')[1];
            if (!dpart.includes('.')) {
                validate.addClass('has-error');
                error.html('Name must be similar to NAME@DOMAIN.COM');
                error.show();
                return;
            }
        }

        //initial validation done, check for duplicate
        name = name.toUpperCase();
        if (type !== 'OU') {
            let q = driver.session();
            let statement = 'MATCH (n:{} {name:{name}}) RETURN n'.format(type);
            q.run(statement, { name: name }).then(x => {
                q.close();
                if (x.records.length > 0) {
                    validate.addClass('has-error');
                    error.html('Node with name already exists!');
                    error.show();
                    return;
                }

                emitter.emit('addNodeFinal', name, type);
                complete.show();
                setTimeout(x => {
                    this.closeModal();
                }, 500);
            });
        } else {
            complete.show();
            emitter.emit('addNodeFinal', name, type);
            setTimeout(x => {
                this.closeModal();
            }, 500);
        }

        //this.closeModal();
    }

    openModal() {
        closeTooltip();
        this.setState({ open: true });
        jQuery(this.refs.name).focus();
        jQuery(this.refs.error).hide();
        jQuery(this.refs.complete).hide();
    }

    clearFocus() {
        let validate = jQuery(this.refs.validate);
        let error = jQuery(this.refs.error);

        validate.removeClass('has-error');
        error.hide();
    }

    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby='AddNodeModalHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='AddNodeModalHeader'>Add Node</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <form
                        onSubmit={x => {
                            x.preventDefault();
                            this.validate();
                        }}
                        className='needs-validation'
                        noValidate
                    >
                        <div ref='validate' className={'form-group'}>
                            <label htmlFor='addNodeName' required>
                                Node Name
                            </label>
                            <input
                                onFocus={this.clearFocus.bind(this)}
                                ref='name'
                                type='text'
                                className={'form-control'}
                                id='addNodeName'
                            />
                            <span className='help-block' ref='error'>
                                Looks good!
                            </span>
                        </div>
                        <div className={'form-group'}>
                            <label htmlFor='addNodeType'>Node Type</label>
                            <select
                                onFocus={this.clearFocus.bind(this)}
                                ref='type'
                                className={'form-control'}
                                id='addNodeType'
                            >
                                <option>User</option>
                                <option>Group</option>
                                <option>Computer</option>
                                <option>Domain</option>
                                <option>OU</option>
                                <option>GPO</option>
                            </select>
                        </div>
                    </form>
                </Modal.Body>

                <Modal.Footer>
                    <i
                        ref='complete'
                        className='fa fa-check-circle green-icon-color add-modal-check-style'
                    />
                    <button
                        type='button'
                        className='btn btn-primary'
                        onClick={this.validate.bind(this)}
                    >
                        Confirm
                    </button>
                    <button
                        type='button'
                        className='btn btn-danger'
                        onClick={this.closeModal.bind(this)}
                    >
                        Cancel
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
