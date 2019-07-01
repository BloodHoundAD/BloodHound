import React, { Component } from 'react';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

export default class Settings extends Component {
    constructor() {
        super();

        this.state = {
            nodeLabelVal: appStore.performance.nodeLabels,
            edgeLabelVal: appStore.performance.edgeLabels,
        };
    }

    componentDidMount() {
        emitter.on(
            'openSettings',
            function() {
                this.openSettings();
            }.bind(this)
        );

        $(this.refs.edge).simpleSlider({
            range: [0, 20],
            step: 1,
            theme: 'volume slideinline',
        });

        $(this.refs.sibling).simpleSlider({
            range: [0, 20],
            step: 1,
            theme: 'volume slideinline',
        });

        $(this.refs.edge).bind('slider:changed', this.edgeChange.bind(this));
        $(this.refs.sibling).bind(
            'slider:changed',
            this.siblingChange.bind(this)
        );

        $(this.refs.edge).simpleSlider('setValue', appStore.performance.edge);
        $(this.refs.sibling).simpleSlider(
            'setValue',
            appStore.performance.sibling
        );

        $(this.refs.check).prop('checked', appStore.performance.lowGraphics);
        $(this.refs.debug).prop('checked', appStore.performance.debug);
        $(this.refs.dark).prop('checked', appStore.performance.darkMode);

        $(this.refs.outer).fadeToggle(0);
        $(this.refs.outer).draggable();
    }

    edgeChange(event, data) {
        appStore.performance.edge = data.value;
        $(this.refs.edgeinput).val(data.value);
        conf.set('performance', appStore.performance);
    }

    siblingChange(event, data) {
        appStore.performance.sibling = data.value;
        $(this.refs.siblinginput).val(data.value);
        conf.set('performance', appStore.performance);
    }

    onGfxChange(event) {
        $(this.refs.check).prop('checked', event.target.checked);
        appStore.performance.lowGraphics = event.target.checked;
        conf.set('performance', appStore.performance);
        emitter.emit('changeGraphicsMode');
    }

    onDebugChange(event) {
        $(this.refs.debug).prop('checked', event.target.checked);
        appStore.performance.debug = event.target.checked;
        conf.set('performance', appStore.performance);
    }

    toggleDarkMode(event) {
        $(this.refs.dark).prop('checked', event.target.checked);
        appStore.performance.darkMode = event.target.checked;
        conf.set('performance', appStore.performance);
        emitter.emit('toggleDarkMode', event.target.checked);
    }

    closeSettings() {
        $(this.refs.outer).fadeToggle(false);
    }

    openSettings() {
        $(this.refs.outer).fadeToggle(false);
    }

    updateSibling(event) {
        $(this.refs.sibling).simpleSlider('setValue', event.target.value);
    }

    updateEdge(event) {
        $(this.refs.edge).simpleSlider('setValue', event.target.value);
    }

    onNodeLabelChange(event) {
        let newVal = parseInt(event.target.value);
        this.setState({
            nodeLabelVal: newVal,
        });
        appStore.performance.nodeLabels = newVal;
        conf.set('performance', appStore.performance);
        emitter.emit('changeNodeLabels');
    }

    onEdgeLabelChange(event) {
        let newVal = parseInt(event.target.value);
        this.setState({
            edgeLabelVal: newVal,
        });
        appStore.performance.edgeLabels = newVal;
        conf.set('performance', appStore.performance);
        emitter.emit('changeEdgeLabels');
    }

    render() {
        return (
            <div ref='outer' className='settingsDiv panel panel-default'>
                <div className='panel-heading'>
                    Settings
                    <button
                        type='button'
                        className='close'
                        onClick={this.closeSettings.bind(this)}
                        aria-label='Close'
                    >
                        <span aria-hidden='true'>&times;</span>
                    </button>
                </div>

                <div className='panel-body sliderfix'>
                    {/* <div>
                        <strong>Sibling Collapse Threshold</strong>
                        <i
                            data-toggle="tooltip"
                            data-placement="right"
                            title="Merge nodes that have the same parent. 0 to Disable, Default 10"
                            className="glyphicon glyphicon-question-sign"
                        />
                        <br />
                        <input type="text" ref="sibling" />
                        <span>
                            <input
                                onChange={this.updateSibling.bind(this)}
                                type="number"
                                min="0"
                                max="20"
                                className="sliderinput"
                                ref="siblinginput"
                            />
                        </span>
                    </div> */}

                    <div>
                        <strong>Node Collapse Threshold</strong>
                        <i
                            data-toggle='tooltip'
                            data-placement='right'
                            title='Collapse nodes at the end of paths that only have one relationship. 0 to Disable, Default 5'
                            className='glyphicon glyphicon-question-sign'
                        />
                        <br />
                        <input type='text' ref='edge' />
                        <span>
                            <input
                                type='number'
                                min='0'
                                max='20'
                                className='sliderinput'
                                ref='edgeinput'
                            />
                        </span>
                    </div>
                    <br />
                    <div>
                        <form>
                            <FormGroup controlId='formControlEdge'>
                                <ControlLabel>Edge Label Display</ControlLabel>
                                <i
                                    data-toggle='tooltip'
                                    data-placement='right'
                                    title='When to display edge labels'
                                    className='glyphicon glyphicon-question-sign'
                                />
                                <FormControl
                                    onChange={this.onEdgeLabelChange.bind(this)}
                                    componentClass='select'
                                    value={this.state.edgeLabelVal}
                                >
                                    <option value='0'>Threshold Display</option>
                                    <option value='1'>Always Display</option>
                                    <option value='2'>Never Display</option>
                                </FormControl>
                            </FormGroup>
                            <FormGroup controlId='formControlNode'>
                                <ControlLabel>Node Label Display</ControlLabel>
                                <i
                                    data-toggle='tooltip'
                                    data-placement='right'
                                    title='When to display node labels'
                                    className='glyphicon glyphicon-question-sign'
                                />
                                <FormControl
                                    ref='nodeLabelControl'
                                    onChange={this.onNodeLabelChange.bind(this)}
                                    componentClass='select'
                                    value={this.state.nodeLabelVal}
                                >
                                    <option value='0'>Threshold Display</option>
                                    <option value='1'>Always Display</option>
                                    <option value='2'>Never Display</option>
                                </FormControl>
                            </FormGroup>
                        </form>
                    </div>
                    <div className='checkbox-inline'>
                        <label>
                            <input
                                ref='debug'
                                type='checkbox'
                                onChange={this.onDebugChange.bind(this)}
                            />{' '}
                            Query Debug Mode
                        </label>
                    </div>
                    <i
                        data-toggle='tooltip'
                        data-placement='right'
                        title='Dump queries run into the Raw Query Box'
                        className='glyphicon glyphicon-question-sign'
                    />
                    <br />
                    <div className='checkbox-inline'>
                        <label>
                            <input
                                ref='check'
                                type='checkbox'
                                onChange={this.onGfxChange.bind(this)}
                            />{' '}
                            Low Detail Mode
                        </label>
                    </div>
                    <i
                        data-toggle='tooltip'
                        data-placement='right'
                        title='Lower detail of graph to improve performance'
                        className='glyphicon glyphicon-question-sign'
                    />
                    <br />
                    <div className='checkbox-inline'>
                        <label>
                            <input
                                ref='dark'
                                type='checkbox'
                                onChange={this.toggleDarkMode.bind(this)}
                            />{' '}
                            Dark Mode
                        </label>
                    </div>
                    <i
                        data-toggle='tooltip'
                        data-placement='right'
                        title='Toggle Dark Mode for the Interface'
                        className='glyphicon glyphicon-question-sign'
                    />
                </div>
            </div>
        );
    }
}
