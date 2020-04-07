// import React, { Component } from 'react';

// export default class ExportContainer extends Component {
//     constructor() {
//         super();

//         this.state = {
//             jsonActive: true,
//             imageActive: false,
//         };
//     }

//     componentDidMount() {
//         $(this.refs.outer).fadeToggle(0);
//         $(this.refs.outer).draggable();
//         emitter.on('showExport', this._show.bind(this));
//     }

//     _dismiss() {
//         $(this.refs.outer).fadeToggle(false);
//     }

//     _show() {
//         closeTooltip();
//         $(this.refs.outer).fadeToggle(true);
//     }

//     _jsonClick() {
//         this.setState({ jsonActive: true, imageActive: false });
//     }

//     _imageClick() {
//         this.setState({ jsonActive: false, imageActive: true });
//     }

//     _buttonClick() {
//         emitter.emit('export', this.state.jsonActive ? 'json' : 'image');
//     }

//     render() {
//         return (
//             <div className='floating-div' ref='outer'>
//                 <div className='panel-heading'>
//                     Export Graph
//                     <button
//                         type='button'
//                         className='close'
//                         onClick={this._dismiss.bind(this)}
//                         aria-label='Close'
//                     >
//                         <span aria-hidden='true'>&times;</span>
//                     </button>
//                 </div>

//                 <div className='panel-body'>
//                     <div className='list-group'>
//                         <a
//                             href='#'
//                             onClick={this._jsonClick.bind(this)}
//                             className={
//                                 this.state.jsonActive
//                                     ? 'list-group-item active'
//                                     : 'list-group-item'
//                             }
//                         >
//                             <h4 className='list-group-item-heading'>
//                                 Export to JSON
//                             </h4>
//                             <p className='list-group-item-text'>
//                                 Use this format to export data and re-import it
//                                 later
//                             </p>
//                         </a>

//                         <a
//                             href='#'
//                             onClick={this._imageClick.bind(this)}
//                             className={
//                                 this.state.imageActive
//                                     ? 'list-group-item active'
//                                     : 'list-group-item'
//                             }
//                         >
//                             <h4 className='list-group-item-heading'>
//                                 Export to Image
//                             </h4>
//                             <p className='list-group-item-text'>
//                                 Use this format to export data and view it as an
//                                 image
//                             </p>
//                         </a>
//                     </div>

//                     <div style={{ textAlign: 'center' }}>
//                         <button
//                             onClick={this._buttonClick.bind(this)}
//                             className='btn btn-lg'
//                         >
//                             Export Data
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
// }

import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import PoseContainer from '../PoseContainer';
import Draggable from 'react-draggable';
import styles from './ExportContainer.module.css';
import { Panel, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import { AppContext } from '../../AppContext';
import clsx from 'clsx';

const ExportContainer = () => {
    const [jsonActive, setJsonActive] = useState(true);
    const [imageActive, setImageActive] = useState(false);
    const [visible, setVisible] = useState(false);

    const context = useContext(AppContext);

    const handleShow = () => {
        closeTooltip();
        setVisible(true);
    };

    const handleClose = () => {
        setVisible(false);
    };

    const jsonClicked = () => {
        setJsonActive(true);
        setImageActive(false);
    };

    const imageClicked = () => {
        setJsonActive(false);
        setImageActive(true);
    };

    const startExport = () => {
        emitter.emit('export', jsonActive ? 'json' : 'image');
    };

    useEffect(() => {
        emitter.on('showExport', handleShow);
        return () => {
            emitter.removeListener('showExport', handleShow);
        };
    }, []);

    return (
        <Draggable handle={'.panel-heading'}>
            <PoseContainer
                visible={visible}
                className={clsx(
                    styles.container,
                    context.darkMode ? styles.dark : null
                )}
            >
                <Panel>
                    <Panel.Heading>
                        Export Graph
                        <Button
                            onClick={handleClose}
                            className='close'
                            aria-label='Close'
                        >
                            <span aria-hidden='true'>&times;</span>
                        </Button>
                    </Panel.Heading>

                    <Panel.Body>
                        <ListGroup>
                            <ListGroupItem
                                header={'Export to JSON'}
                                onClick={jsonClicked}
                                active={jsonActive}
                            >
                                Use this format to export data and re-import it
                                later
                            </ListGroupItem>
                            <ListGroupItem
                                header={'Export to Image'}
                                onClick={imageClicked}
                                active={imageActive}
                            >
                                Use this format to export data and view it as an
                                image
                            </ListGroupItem>
                        </ListGroup>
                        <div className={styles.centerButton}>
                            <Button onClick={startExport} size={'lg'}>
                                Export Data
                            </Button>
                        </div>
                    </Panel.Body>
                </Panel>
            </PoseContainer>
        </Draggable>
    );
};

ExportContainer.propTypes = {};
export default ExportContainer;
