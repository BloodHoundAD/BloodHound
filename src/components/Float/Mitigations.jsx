import React, { useEffect, useState, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    Panel,
    Button,
    FormControl,
    ControlLabel,
    FormGroup,
    Form,
    Col,
    Checkbox,
} from 'react-bootstrap';
import styles from './Settings.module.css';
import Draggable from 'react-draggable';
import clsx from 'clsx';
import { AppContext } from '../../AppContext';
import PoseContainer from '../PoseContainer';

const Mitigations = () => {
    const [nodeCollapse, setNodeCollapse] = useState(appStore.performance.edge);
    const [open, setOpen] = useState(false);
    const context = useContext(AppContext);

    const radios = useRef(null);

    const intialMitiagtions = () => {
        if (conf.get('mitigations')){
            let initial = [];
            for (let i = 1; i <= conf.get('mitigations'); i++){
                initial.push({id: i, selected: false});
            }
            return initial;
        } else {
            return [{id: 1, selected: false}];
        }

    }

    const [mitigations, setMitigations] = useState(intialMitiagtions());
    const addMitigation = () => {
        if (conf.get('mitigations')){
            conf.set('mitigations',conf.get('mitigations') + 1);
        } else {
            conf.set('mitigations', 1)
        }
        setMitigations(mitigations => mitigations.concat({
            id : mitigations.length + 1,
            selected: false
        }))
    };


    const [currentMitigation, setCurrentMitigation] = useState(null);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        emitter.on('openMitigations', handleOpen);
        return () => {
            emitter.removeListener('openMitigations', handleOpen);
        };
    }, []);

    const mitigationClicked = (mitigationNumber) => {
        if (currentMitigation) {
            mitigations[currentMitigation - 1].selected = false;
        }
        mitigations[mitigationNumber - 1].selected = true;
        setCurrentMitigation(mitigationNumber);
        emitter.emit('changeCurrentMitigation', "mit" + mitigationNumber);
    }

    const deselectMitigation = () => {
        if (currentMitigation){
            mitigations[currentMitigation - 1].selected = false;
            setCurrentMitigation(null)
        }
        emitter.emit('changeCurrentMitigation', null);
    }

    return (
        <Draggable handle={'.panel-heading'}>
            <PoseContainer
                visible={open}
                className={clsx(
                    styles.container,
                    context.darkMode ? styles.dark : null
                )}
            >
            <Panel>
                    <Panel.Heading>
                        Mitigations
                        <Button
                            onClick={handleClose}
                            className='close'
                            aria-label='close'
                        >
                            <span aria-hidden='true'>&times;</span>
                        </Button>
                    </Panel.Heading>
                    <Panel.Body>
                    <div >{mitigations.map(mit => (
                        <span key={mit.id}><MitigationComponent click={mitigationClicked} key={mit.id} mitigationNumber={mit.id} selected={mit.selected} /> <br /></span>
                    ))}</div><br />
                    <button
                       type='button'
                       size="lg"
                       className={clsx(styles.button, context.darkMode ? styles.dark : null)}
                       onClick={ () => addMitigation()}
                       aria-label='Add Mitigation'
                       >
                       Add mitigation
                    </button>&nbsp; 
                    <button
                        type='button'
                        className='deselectMitigation'
                        size="lg"
                        onClick={ () => deselectMitigation()}
                        aria-label='Deselect Mitigation'
                        >
                        Deselect mitigation
                    </button> 
                    </Panel.Body>
            </Panel>
            </PoseContainer>
        </Draggable>
    )
}

Mitigations.propTypes = {};
export default Mitigations;

const MitigationComponent = ({click, mitigationNumber, selected}) => { 
    return (
        <label><input 
                type="radio" 
                value={"mit" + mitigationNumber} 
                key={"mit" + mitigationNumber}
                checked={selected}
                onChange={() => {click(mitigationNumber)}}/>
        &nbsp;Mitigation {mitigationNumber} </label>
    );
}