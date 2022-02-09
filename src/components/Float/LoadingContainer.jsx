import React, {useContext, useEffect, useState} from 'react';
import {AppContext} from '../../AppContext';
import PoseContainer from '../PoseContainer';
import clsx from 'clsx';

const LoadingContainer = () => {
    const [text, setText] = useState('Loading');
    const [visible, setVisible] = useState(false);
    const context = useContext(AppContext);

    const updateLoadingText = (newText) => {
        setText(newText);
    };

    const updateShowState = (newState) => {
        setVisible(newState);
    };

    useEffect(() => {
        emitter.on('updateLoadingText', updateLoadingText);
        emitter.on('showLoadingIndicator', updateShowState);
        return () => {
            emitter.removeListener('updateLoadingText', setText);
        };
    }, []);

    return (
        <PoseContainer
            visible={visible}
            className={clsx(
                'loadingIndicator',
                `loading-indicator-${context.darkMode ? 'dark' : 'light'}`
            )}
            draggable={false}
        >
            <div>{text}</div>
            <img src='src/img/loading_new.gif' />
        </PoseContainer>
    );
};

LoadingContainer.propTypes = {};
export default LoadingContainer;
