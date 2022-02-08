import React from 'react';
import styles from './NoteGallery.module.css';
import clsx from 'clsx';
import { useAlert } from 'react-alert';
const { clipboard } = require('electron');

const SelectedImage = ({ index, photo, margin }) => {
    const alert = useAlert();

    const imageClick = (_, del) => {
        let img = {
            index: index,
            photo: photo,
        };

        emitter.emit('clickPhoto', del, img);
    };

    const style = {
        margin: margin,
        height: photo.height,
        width: photo.width,
    };

    return (
        <div
            className={clsx(styles.imageContainer, 'gallery-img')}
            style={style}
        >
            <i
                className='fa fa-copy'
                onClick={x => {
                    alert.success('Copied file path to clipboard');
                    clipboard.writeText(photo.src);
                }}
            />
            <i className='fa fa-trash-alt' onClick={e => imageClick(e, true)} />
            <img
                className={'gallery-img'}
                onClick={e => imageClick(e, false)}
                {...photo}
                style={style}
            />
        </div>
    );
};

SelectedImage.propTypes = {};
export default SelectedImage;
