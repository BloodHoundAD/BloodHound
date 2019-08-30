import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import { buildSearchQuery } from 'utils';
import SearchRow from '../SearchContainer/SearchRow';
import ReactDOMServer from 'react-dom/server';

const SEPARATOR = '#BLOODHOUNDSEPARATOR#';

export default class AddEdgeModal extends Component {
    constructor() {
        super();
        this.state = {
            open: false,
            source: null,
            target: null,
        };
    }

    componentDidMount() {
        emitter.on('addEdge', this.openModal.bind(this));
    }

    closeModal() {
        this.setState({ open: false });
    }

    openModal() {
        closeTooltip();
        this.setState({ open: true }, () => {
            setTimeout(() => {
                this.bindSearchBars(jQuery(this.refs.source), 'source');
                this.bindSearchBars(jQuery(this.refs.target), 'target');
            }, 500);
        });
        jQuery(this.refs.errora).hide();
        jQuery(this.refs.errorb).hide();
        jQuery(this.refs.edgeError).hide();
        jQuery(this.refs.complete).hide();
    }

    bindSearchBars(element, which) {
        element.typeahead({
            autoSelect: false,
            source: function(query, process) {
                let session = driver.session();
                let [statement, searchterm] = buildSearchQuery(query);

                session.run(statement, { name: searchterm }).then(x => {
                    let data = [];
                    let map = {};
                    $.each(x.records, (index, record) => {
                        let props = record._fields[0].properties;
                        Object.assign(props, {
                            type: record._fields[0].labels[0],
                        });
                        map[index] = props;
                        data.push(`${props.name}${SEPARATOR}${index}`);
                    });

                    this.map = map;
                    session.close();
                    return process(data);
                });
            },
            updater: function(item) {
                let [_, index] = item.split(SEPARATOR);
                return this.map[index];
            },
            matcher: function(item) {
                let [name, index] = item.split(SEPARATOR);
                let obj = this.map[index];
                let searchTerm = this.query.includes(':')
                    ? this.query.split(':')[1]
                    : this.query;

                if (
                    name.toLowerCase().indexOf(searchTerm.toLowerCase() !== -1)
                ) {
                    return true;
                } else if (
                    obj.guid &&
                    obj.guid.toLowerCase().indexOf(searchTerm.toLowerCase()) !==
                        -1
                ) {
                    return true;
                } else {
                    return false;
                }
            },
            highlighter: function(item) {
                let [name, index] = item.split(SEPARATOR);
                let obj = this.map[index];
                let searchTerm = this.query.includes(':')
                    ? this.query.split(':')[1]
                    : this.query;

                return ReactDOMServer.renderToString(
                    <SearchRow key={index} item={obj} search={searchTerm} />
                );
            },
            afterSelect: item => {
                let p = {};
                p[which] = item;
                this.setState(p);
                if (which === 'source') {
                    this.sourceFocus();
                    this.sourceBlur();
                } else {
                    this.targetFocus();
                    this.targetBlur();
                }
            },
        });
    }

    validate() {
        let source = this.state.source;
        let target = this.state.target;
        let edge = jQuery(this.refs.type).val();
        let edgeError = jQuery(this.refs.edgeError);
        let edgeValid = jQuery(this.refs.validateedge);
        let sourceValid = jQuery(this.refs.validatea);
        let targetValid = jQuery(this.refs.validateb);
        let sourceError = jQuery(this.refs.errora);
        let targetError = jQuery(this.refs.errorb);
        let complete = jQuery(this.refs.complete);

        edgeValid.removeClass('has-error');
        edgeError.hide();

        if (source === null) {
            sourceValid.addClass('has-error');
            sourceError.html('Source node not validated!');
            sourceError.show();
            return;
        }

        if (target === null) {
            targetValid.addClass('has-error');
            targetError.html('Target node not validated!');
            targetError.show();
            return;
        }

        if (source.name === target.name) {
            targetValid.addClass('has-error');
            targetError.html('Source and target cannot be identical!');
            targetError.show();
            sourceValid.addClass('has-error');
            sourceError.html('Source and target cannot be identical');
            sourceError.show();
            return;
        }

        let q = driver.session();
        let statement = `MATCH (n:${source.type} {name: {source}}) MATCH (m:${target.type} {name:{target}}) MATCH (n)-[r:${edge}]->(m) RETURN r`;
        q.run(statement, { source: source.name, target: target.name }).then(
            x => {
                q.close();
                if (x.records.length > 0) {
                    edgeValid.addClass('has-error');
                    edgeError.html('Edge already exists');
                    edgeError.show();
                } else {
                    let edgepart;
                    if (
                        edge === 'GenericAll' ||
                        edge === 'GenericWrite' ||
                        edge === 'AllExtendedRights' ||
                        edge === 'AddMember' ||
                        edge === 'ForceChangePassword' ||
                        edge === 'Owns' ||
                        edge === 'WriteDacl' ||
                        edge === 'WriteOwner' ||
                        edge === 'ReadLAPSPassword'
                    ) {
                        edgepart = `[r:${edge} {isacl:true}]`;
                    } else {
                        edgepart = `[r:${edge} {isacl:false}]`;
                    }
                    let s = driver.session();
                    let statement = `MATCH (n:${source.type} {name: {source}}) MATCH (m:${target.type} {name:{target}}) MERGE (n)-${edgepart}->(m) RETURN r`;
                    s.run(statement, {
                        source: source.name,
                        target: target.name,
                    }).then(x => {
                        s.close();
                        complete.show();
                        setTimeout(x => {
                            this.closeModal();
                        }, 500);
                    });
                }
            }
        );
    }

    clearFocus() {
        let validate = jQuery(this.refs.validate);
        let error = jQuery(this.refs.error);

        validate.removeClass('has-error');
        error.hide();
    }

    targetBlur() {
        if (this.state.target === null) {
            let source = jQuery(this.refs.source).val();
            let q = driver.session();
            q.run('MATCH (n) WHERE n.name = {name} RETURN n', {
                name: source,
            }).then(x => {
                if (x.records.length === 0) {
                    let validate = jQuery(this.refs.validateb);
                    let error = jQuery(this.refs.errorb);
                    validate.addClass('has-error');
                    error.html('Node not found');
                    error.show();
                } else if (x.records.length > 1) {
                    let validate = jQuery(this.refs.validateb);
                    let error = jQuery(this.refs.errorb);
                    validate.addClass('has-error');
                    error.html(
                        'Multiple possible nodes found. Click on item from dropdown to set type'
                    );
                    error.show();
                } else {
                    let props = x.records[0]._fields[0].properties;
                    Object.assign(props, {
                        type: x.records[0]._fields[0].labels[0],
                    });
                    this.setState({ source: props });
                }
                q.close();
            });
        }
    }

    targetChanged() {
        let target = jQuery(this.refs.target).val();
        if (this.state.target && target !== this.state.target.name) {
            this.setState({ target: null });
        }
    }

    targetFocus() {
        let validate = jQuery(this.refs.validateb);
        let error = jQuery(this.refs.errorb);
        validate.removeClass('has-error');
        error.hide();

        if (this.state.source !== null) {
            validate = jQuery(this.refs.validatea);
            error = jQuery(this.refs.errora);
            validate.removeClass('has-error');
            error.hide();
        }
    }

    sourceBlur() {
        if (this.state.source === null) {
            let source = jQuery(this.refs.source).val();
            let q = driver.session();
            q.run('MATCH (n) WHERE n.name = {name} RETURN n', {
                name: source,
            }).then(x => {
                if (x.records.length === 0) {
                    let validate = jQuery(this.refs.validatea);
                    let error = jQuery(this.refs.errora);
                    validate.addClass('has-error');
                    error.html('Node not found');
                    error.show();
                } else if (x.records.length > 1) {
                    let validate = jQuery(this.refs.validatea);
                    let error = jQuery(this.refs.errora);
                    validate.addClass('has-error');
                    error.html(
                        'Multiple possible nodes found. Click on item from dropdown to set type'
                    );
                    error.show();
                } else {
                    let props = x.records[0]._fields[0].properties;
                    Object.assign(props, {
                        type: x.records[0]._fields[0].labels[0],
                    });
                    this.setState({ source: props });
                }
                q.close();
            });
        }
    }

    sourceChanged() {
        let source = jQuery(this.refs.source).val();
        if (this.state.source && source !== this.state.source.name) {
            this.setState({ source: null });
        }
    }

    sourceFocus() {
        let validate = jQuery(this.refs.validatea);
        let error = jQuery(this.refs.errora);
        validate.removeClass('has-error');
        error.hide();

        if (this.state.target !== null) {
            validate = jQuery(this.refs.validateb);
            error = jQuery(this.refs.errorb);
            validate.removeClass('has-error');
            error.hide();
        }
    }

    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby='AddEdgeModalHeader'
            >
                <Modal.Header closeButton>
                    <Modal.Title id='AddEdgeModalHeader'>Add Edge</Modal.Title>
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
                        <div ref='validatea' className={'form-group'}>
                            <label htmlFor='sourceNode' required>
                                Source Node
                            </label>
                            <input
                                onFocus={this.sourceFocus.bind(this)}
                                onInput={this.sourceChanged.bind(this)}
                                onBlur={this.sourceBlur.bind(this)}
                                type='search'
                                autoComplete='off'
                                placeholder='Source Node'
                                ref='source'
                                className={'form-control'}
                                id='sourceNode'
                            />
                            <span className='help-block' ref='errora'>
                                Looks good!
                            </span>
                        </div>
                        <div className={'form-group'} ref='validateedge'>
                            <label htmlFor='addEdgeType'>Edge Type</label>
                            <select
                                ref='type'
                                className={'form-control'}
                                id='addEdgeType'
                            >
                                <option>MemberOf</option>
                                <option>HasSession</option>
                                <option>AdminTo</option>
                                <option>AllExtendedRights</option>
                                <option>AddMember</option>
                                <option>ForceChangePassword</option>
                                <option>GenericAll</option>
                                <option>GenericWrite</option>
                                <option>Owns</option>
                                <option>WriteDacl</option>
                                <option>WriteOwner</option>
                                <option>ReadLAPSPassword</option>
                                <option>Contains</option>
                                <option>GpLink</option>
                                <option>CanRDP</option>
                                <option>ExecuteDCOM</option>
                                <option>AllowedToDelegate</option>
                            </select>
                            <span className='help-block' ref='edgeError'>
                                Looks good!
                            </span>
                        </div>
                        <div ref='validateb' className={'form-group'}>
                            <label htmlFor='targetNode' required>
                                Target Node
                            </label>
                            <input
                                onFocus={this.targetFocus.bind(this)}
                                onInput={this.targetChanged.bind(this)}
                                onBlur={this.targetBlur.bind(this)}
                                type='search'
                                autoComplete='off'
                                placeholder='Target Node'
                                ref='target'
                                className={'form-control'}
                                id='targetNode'
                            />
                            <span className='help-block' ref='errorb'>
                                Looks good!
                            </span>
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
