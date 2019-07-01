import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NodeCypherLink from './NodeCypherLink.jsx';
import NodeCypherNoNumberLink from './NodeCypherNoNumberLink';
import NodeProps from './NodeProps';
import Gallery from 'react-photo-gallery';
import SelectedImage from './SelectedImage';
import Lightbox from 'react-images';
import { readFileSync, writeFileSync } from 'fs';
import sizeOf from 'image-size';
import md5File from 'md5-file';
import { remote } from 'electron';
const { app } = remote;
import { join } from 'path';
import { withAlert } from 'react-alert';

class OuNodeData extends Component {
    constructor() {
        super();

        this.state = {
            label: '',
            guid: '',
            blocks: '',
            propertyMap: {},
            displayMap: {
                description: 'Description',
            },
            notes: null,
            pics: [],
            currentImage: 0,
            lightboxIsOpen: false,
        };

        emitter.on('ouNodeClicked', this.getNodeData.bind(this));
        emitter.on('computerNodeClicked', this.nullTarget.bind(this));
        emitter.on('groupNodeClicked', this.nullTarget.bind(this));
        emitter.on('domainNodeClicked', this.nullTarget.bind(this));
        emitter.on('gpoNodeClicked', this.nullTarget.bind(this));
        emitter.on('userNodeClicked', this.nullTarget.bind(this));
        emitter.on('imageUploadFinal', this.uploadImage.bind(this));
        emitter.on('clickPhoto', this.openLightbox.bind(this));
        emitter.on('deletePhoto', this.handleDelete.bind(this));
    }

    componentDidMount() {
        jQuery(this.refs.complete).hide();
        jQuery(this.refs.piccomplete).hide();
    }

    nullTarget() {
        this.setState({
            label: '',
        });
    }

    getNodeData(payload, guid, blocksInheritance) {
        jQuery(this.refs.complete).hide();
        let bi = '' + blocksInheritance;
        bi = bi.toTitleCase();

        this.setState({
            label: payload,
            guid: guid,
            blocks: bi,
        });

        let key = `ou_${this.state.guid}`;
        let c = imageconf.get(key);
        let pics = [];
        if (typeof c !== 'undefined') {
            this.setState({ pics: c });
        } else {
            this.setState({ pics: pics });
        }

        let props = driver.session();
        props.run('MATCH (n:OU {guid:{name}}) RETURN n', { name: guid }).then(
            function(result) {
                var properties = result.records[0]._fields[0].properties;
                let notes;
                if (!properties.notes) {
                    notes = null;
                } else {
                    notes = properties.notes;
                }
                this.setState({
                    ServicePrincipalNames: [],
                    propertyMap: properties,
                    notes: notes,
                });
                this.setState({ propertyMap: properties, notes: notes });
                props.close();
            }.bind(this)
        );
    }

    notesChanged(event) {
        this.setState({ notes: event.target.value });
    }

    notesBlur(event) {
        let notes =
            this.state.notes === null || this.state.notes === ''
                ? null
                : this.state.notes;
        let q = driver.session();
        if (notes === null) {
            q.run('MATCH (n:OU {guid:{name}}) REMOVE n.notes', {
                name: this.state.guid,
            }).then(x => {
                q.close();
            });
        } else {
            q.run('MATCH (n:OU {guid:{name}}) SET n.notes = {notes}', {
                name: this.state.guid,
                notes: this.state.notes,
            }).then(x => {
                q.close();
            });
        }
        let check = jQuery(this.refs.complete);
        check.show();
        check.fadeOut(2000);
    }

    uploadImage(files) {
        if (!this.props.visible || files.length === 0) {
            return;
        }
        let p = this.state.pics;
        let oLen = p.length;
        let key = `ou_${this.state.guid}`;

        $.each(files, (_, f) => {
            let exists = false;
            let hash = md5File.sync(f.path);
            $.each(p, (_, p1) => {
                if (p1.hash === hash) {
                    exists = true;
                }
            });
            if (exists) {
                this.props.alert.error('Image already exists');
                return;
            }
            let path = join(app.getPath('userData'), 'images', hash);
            let dimensions = sizeOf(f.path);
            let data = readFileSync(f.path);
            writeFileSync(path, data);
            p.push({
                hash: hash,
                src: path,
                width: dimensions.width,
                height: dimensions.height,
            });
        });

        if (p.length === oLen) {
            return;
        }
        this.setState({ pics: p });
        imageconf.set(key, p);
        let check = jQuery(this.refs.piccomplete);
        check.show();
        check.fadeOut(2000);
    }

    handleDelete(event) {
        if (!this.props.visible) {
            return;
        }
        let pics = this.state.pics;
        let temp = pics[event.index];
        pics.splice(event.index, 1);
        this.setState({
            pics: pics,
        });
        let key = `ou_${this.state.guid}`;
        imageconf.set(key, pics);

        let check = jQuery(this.refs.piccomplete);
        check.show();
        check.fadeOut(2000);
    }

    openLightbox(event) {
        if (!this.props.visible) {
            return;
        }
        this.setState({
            currentImage: event.index,
            lightboxIsOpen: true,
        });
    }
    closeLightbox() {
        if (!this.props.visible) {
            return;
        }
        this.setState({
            currentImage: 0,
            lightboxIsOpen: false,
        });
    }
    gotoPrevious() {
        if (!this.props.visible) {
            return;
        }
        this.setState({
            currentImage: this.state.currentImage - 1,
        });
    }
    gotoNext() {
        if (!this.props.visible) {
            return;
        }
        this.setState({
            currentImage: this.state.currentImage + 1,
        });
    }

    render() {
        let gallery;
        if (this.state.pics.length === 0) {
            gallery = <span>Drop pictures on here to upload!</span>;
        } else {
            gallery = (
                <React.Fragment>
                    <Gallery
                        photos={this.state.pics}
                        ImageComponent={SelectedImage}
                        className={'gallerymod'}
                    />
                    <Lightbox
                        images={this.state.pics}
                        isOpen={this.state.lightboxIsOpen}
                        onClose={this.closeLightbox.bind(this)}
                        onClickPrev={this.gotoPrevious.bind(this)}
                        onClickNext={this.gotoNext.bind(this)}
                        currentImage={this.state.currentImage}
                    />
                </React.Fragment>
            );
        }

        return (
            <div className={this.props.visible ? '' : 'displaynone'}>
                <dl className='dl-horizontal'>
                    <dt>Ou</dt>
                    <dd>{this.state.label}</dd>
                    <dt>GUID</dt>
                    <dd>{this.state.guid}</dd>
                    <dt>Blocks Inheritance</dt>
                    <dd>{this.state.blocks}</dd>
                    <NodeProps
                        properties={this.state.propertyMap}
                        displayMap={this.state.displayMap}
                        ServicePrincipalNames={[]}
                    />
                    <NodeCypherNoNumberLink
                        query='MATCH p = (d)-[r:Contains*1..]->(o:OU {guid:{name}}) RETURN p'
                        target={this.state.guid}
                        property='See OU Within Domain Tree'
                    />

                    <br />

                    <h4>Affecting GPOs</h4>
                    <NodeCypherLink
                        property='GPOs Directly Affecting This OU'
                        target={this.state.guid}
                        baseQuery={
                            'MATCH p=(n:GPO)-[r:GpLink]->(o:OU {guid:{name}})'
                        }
                    />
                    <NodeCypherLink
                        property='GPOs Affecting This OU'
                        target={this.state.guid}
                        baseQuery={
                            'MATCH p=(n:GPO)-[r:GpLink|Contains*1..]->(o:OU {guid:{name}})'
                        }
                    />

                    <h4>Descendant Objects</h4>
                    <NodeCypherLink
                        property='Total User Objects'
                        target={this.state.guid}
                        baseQuery={
                            'MATCH p=(o:OU {guid:{name}})-[r:Contains*1..]->(n:User)'
                        }
                        distinct
                    />

                    <NodeCypherLink
                        property='Total Group Objects'
                        target={this.state.guid}
                        baseQuery={
                            'MATCH p=(o:OU {guid:{name}})-[r:Contains*1..]->(n:Group)'
                        }
                        distinct
                    />

                    <NodeCypherLink
                        property='Total Computer Objects'
                        target={this.state.guid}
                        baseQuery={
                            'MATCH p=(o:OU {guid:{name}})-[r:Contains*1..]->(n:Computer)'
                        }
                        distinct
                    />

                    <NodeCypherLink
                        property='Sibling Objects within OU'
                        target={this.state.guid}
                        baseQuery={
                            'MATCH (o1)-[r1:Contains]->(o2:OU {guid:{name}}) WITH o1 MATCH p=(d)-[r2:Contains*1..]->(o1)-[r3:Contains]->(n)'
                        }
                        distinct
                    />
                </dl>
                <div>
                    <h4 className={'inline'}>Notes</h4>
                    <i
                        ref='complete'
                        className='fa fa-check-circle green-icon-color notes-check-style'
                    />
                </div>
                <textarea
                    onBlur={this.notesBlur.bind(this)}
                    onChange={this.notesChanged.bind(this)}
                    value={this.state.notes === null ? '' : this.state.notes}
                    className={'node-notes-textarea'}
                    ref='notes'
                />
                <div>
                    <h4 className={'inline'}>Pictures</h4>
                    <i
                        ref='piccomplete'
                        className='fa fa-check-circle green-icon-color notes-check-style'
                    />
                </div>
                {gallery}
            </div>
        );
    }
}

OuNodeData.propTypes = {
    visible: PropTypes.bool.isRequired,
};

export default withAlert()(OuNodeData);
