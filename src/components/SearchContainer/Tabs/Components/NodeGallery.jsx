import React, { useEffect, useState, useCallback, useRef } from 'react';
import Gallery from 'react-photo-gallery';
import SelectedImage from './SelectedImage';
import Carousel, { Modal, ModalGateway } from 'react-images';
import sizeOf from 'image-size';
import md5File from 'md5-file';
import { readFileSync, writeFileSync } from 'fs';
import { useAlert } from 'react-alert';
import { join } from 'path';
import { remote } from 'electron';
const { app } = remote;
import styles from './NoteGallery.module.css';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const NodeGallery = ({ objectid, type, visible }) => {
    const [pics, setPics] = useState(null);
    const [currentImage, setCurrentImage] = useState(0);
    const [showCheck, setShowCheck] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const picsRef = useRef(pics);

    useEffect(() => {
        picsRef.current = pics;
    }, [pics]);

    useEffect(() => {
        emitter.on('imageUploadFinal', uploadImage);
        emitter.on('clickPhoto', imageClick);
        return () => {
            emitter.removeListener('imageUploadFinal', uploadImage);
            emitter.removeListener('clickPhoto', imageClick);
        };
    }, []);

    const alert = useAlert();

    const imageRenderer = useCallback(({ index, left, top, key, photo }) => (
        <SelectedImage
            key={key}
            margin={'2px'}
            index={index}
            left={left}
            top={top}
            photo={photo}
        />
    ));

    useEffect(() => {
        let key = getKey();
        let conf = imageconf.get(key);

        if (typeof conf !== 'undefined') {
            setPics(conf);
        } else {
            setPics([]);
        }
    }, [objectid]);

    const variants = {
        visible: {
            opacity: 1,
            display: 'inline-block',
            transition: {
                duration: 1,
            },
        },
        hidden: {
            opacity: 0,
            transitionEnd: {
                display: 'none',
            },
            transition: {
                duration: 1,
            },
        },
    };

    let noPics = <span>Drop pictures here to upload!</span>;

    const imageClick = (del, photo) => {
        if (!visible) {
            return;
        }

        if (del) {
            let p = picsRef.current;
            p.splice(photo.index, 1);
            setPics(p);
            let key = getKey();
            imageconf.set(key, p);
            setShowCheck(true);
            setTimeout(() => {
                setShowCheck(false);
            }, 2000);
        } else {
            setCurrentImage(photo.index);
            setModalOpen(true);
        }
    };

    const uploadImage = files => {
        if (!visible || files.length === 0) {
            return;
        }

        let p = picsRef.current;
        let originalLength = p.length;
        let key = getKey();

        files.forEach((val, index) => {
            let exists = false;
            let hash = md5File.sync(val.path);
            p.forEach(val => {
                if (val.hash === hash) {
                    exists = true;
                    return;
                }
            });

            if (exists) {
                alert.error('Image already exists');
                return;
            }

            let path = join(app.getPath('userData'), 'images', hash);
            let dimensions = sizeOf(val.path);
            let data = readFileSync(val.path);
            writeFileSync(path, data);
            p.push({
                hash: hash,
                src: path,
                width: dimensions.width,
                height: dimensions.height,
            });
        });

        if (p.length === originalLength) {
            return;
        }

        imageconf.set(key, p);
        setPics(p);
        setShowCheck(true);
        setTimeout(() => {
            setShowCheck(false);
        }, 2000);
    };

    const getKey = () => {
        return `${type.toLowerCase()}_${objectid}`;
    };

    const closeLightbox = () => {
        setCurrentImage(0);
        setModalOpen(false);
    };

    const clickPrevious = () => {
        setCurrentImage(currentImage - 1);
    };

    const clickNext = () => {
        setCurrentImage(currentImage + 1);
    };

    const gallery = () => {
        if (!pics || pics.length === 0) {
            return noPics;
        } else {
            return (
                <>
                    <Gallery
                        photos={pics}
                        className={'gallerymod'}
                        renderImage={imageRenderer}
                    />
                    <ModalGateway>
                        {modalOpen && (
                            <Modal
                                onClose={closeLightbox}
                                styles={{
                                    blanket: (base, state) => ({
                                        ...base,
                                        zIndex: 1100,
                                    }),
                                    positioner: (base, state) => ({
                                        ...base,
                                        zIndex: 1110,
                                    }),
                                    dialog: (base, state) => ({
                                        ...base,
                                        zIndex: 1120,
                                    }),
                                }}
                            >
                                <Carousel
                                    views={pics}
                                    onClickNext={clickNext}
                                    onClickPrev={clickPrevious}
                                    currentIndex={currentImage}
                                />
                            </Modal>
                        )}
                    </ModalGateway>
                </>
            );
        }
    };

    return (
        <>
            <div>
                <h4 className={styles.inline}>Pictures</h4>
                <motion.i
                    className={clsx(
                        'fa',
                        'fa-check',
                        styles.green,
                        styles.check
                    )}
                    variants={variants}
                    animate={showCheck ? 'visible' : 'hidden'}
                />
            </div>
            {gallery()}
        </>
    );
};

NodeGallery.propTypes = {};
export default NodeGallery;
