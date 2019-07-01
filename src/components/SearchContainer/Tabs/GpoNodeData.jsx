import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NodeCypherLink from './NodeCypherLink.jsx';
import NodeCypherLinkComplex from './NodeCypherLinkComplex.jsx';
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

class GpoNodeData extends Component {
    constructor() {
        super();

        this.state = {
            label: '',
            guid: '',
            propertyMap: {},
            displayMap: {
                description: 'Description',
                gpcpath: 'GPO File Path',
            },
            notes: null,
            pics: [],
            currentImage: 0,
            lightboxIsOpen: false,
        };

        emitter.on('gpoNodeClicked', this.getNodeData.bind(this));
        emitter.on('computerNodeClicked', this.nullTarget.bind(this));
        emitter.on('groupNodeClicked', this.nullTarget.bind(this));
        emitter.on('domainNodeClicked', this.nullTarget.bind(this));
        emitter.on('userNodeClicked', this.nullTarget.bind(this));
        emitter.on('ouNodeClicked', this.nullTarget.bind(this));
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

    getNodeData(payload, guid) {
        jQuery(this.refs.complete).hide();
        this.setState({
            label: payload,
            guid: guid,
        });

        let key = `gpo_${this.state.label}`;
        let c = imageconf.get(key);
        let pics = [];
        if (typeof c !== 'undefined') {
            this.setState({ pics: c });
        } else {
            this.setState({ pics: pics });
        }

        let props = driver.session();
        props
            .run('MATCH (n:GPO {name:{name}}) RETURN n', { name: payload })
            .then(
                function(result) {
                    var properties = result.records[0]._fields[0].properties;
                    let notes;
                    if (!properties.notes) {
                        notes = null;
                    } else {
                        notes = properties.notes;
                    }
                    this.setState({ propertyMap: properties, notes: notes });
                    props.close();
                }.bind(this)
            );
    }

    uploadImage(files) {
        if (!this.props.visible || files.length === 0) {
            return;
        }
        let p = this.state.pics;
        let oLen = p.length;
        let key = `gpo_${this.state.label}`;

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
        let key = `gpo_${this.state.label}`;
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

    notesChanged(event) {
        this.setState({ notes: event.target.value });
    }

    notesBlur() {
        let notes =
            this.state.notes === null || this.state.notes === ''
                ? null
                : this.state.notes;
        let q = driver.session();
        if (notes === null) {
            q.run('MATCH (n:GPO {name:{name}}) REMOVE n.notes', {
                name: this.state.label,
            }).then(x => {
                q.close();
            });
        } else {
            q.run('MATCH (n:GPO {name:{name}}) SET n.notes = {notes}', {
                name: this.state.label,
                notes: this.state.notes,
            }).then(x => {
                q.close();
            });
        }
        let check = jQuery(this.refs.complete);
        check.show();
        check.fadeOut(2000);
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
                    <dt>Domain</dt>
                    <dd>{this.state.label}</dd>
                    <dt>GUID</dt>
                    <dd>{this.state.guid}</dd>
                    <NodeProps
                        properties={this.state.propertyMap}
                        displayMap={this.state.displayMap}
                        ServicePrincipalNames={[]}
                    />

                    <NodeCypherLink
                        property='Reachable High Value Targets'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (m:GPO {name:{name}}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                        }
                        start={this.state.label}
                    />
                    <br />
                    <h4>Affected Objects</h4>
                    <NodeCypherLink
                        property='Directly Affected OUs'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p = (m:GPO {name:{name}})-[r:GpLink]->(n)'
                        }
                        start={this.state.label}
                    />

                    <NodeCypherLink
                        property='Affected OUs'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p = (m:GPO {name:{name}})-[r:GpLink|Contains*1..]->(n) WHERE n:OU OR n:Domain'
                        }
                        start={this.state.label}
                    />

                    <NodeCypherLinkComplex
                        property='Computer Objects'
                        target={this.state.label}
                        countQuery={
                            "MATCH (g:GPO {name:{name}}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:Computer) WHERE NONE(x in NODES(p1) WHERE x.blocksinheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:Computer) RETURN count(n1) + count(n2)"
                        }
                        graphQuery={
                            "MATCH (g:GPO {name:{name}}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:Computer) WHERE NONE(x in NODES(p1) WHERE x.blocksinheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:Computer) RETURN p1,p2"
                        }
                    />

                    <NodeCypherLinkComplex
                        property='User Objects'
                        target={this.state.label}
                        countQuery={
                            "MATCH (g:GPO {name:{name}}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:User) WHERE NONE(x in NODES(p1) WHERE x.blocksinheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:User) RETURN count(n1) + count(n2)"
                        }
                        graphQuery={
                            "MATCH (g:GPO {name:{name}}) OPTIONAL MATCH (g)-[r1:GpLink {enforced:false}]->(container1) WITH g,container1 OPTIONAL MATCH (g)-[r2:GpLink {enforced:true}]->(container2) WITH g,container1,container2 OPTIONAL MATCH p1 = (g)-[r1:GpLink]->(container1)-[r2:Contains*1..]->(n1:User) WHERE NONE(x in NODES(p1) WHERE x.blocksinheritance = true AND LABELS(x) = 'OU') WITH g,p1,container2,n1 OPTIONAL MATCH p2 = (g)-[r1:GpLink]->(container2)-[r2:Contains*1..]->(n2:User) RETURN p1,p2"
                        }
                    />

                    <h4>Inbound Object Control</h4>

                    <NodeCypherLink
                        property='Explicit Object Controllers'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p = (n)-[r:AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(g:GPO {name:{name}})'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Unrolled Object Controllers'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p = (n)-[r:MemberOf*1..]->(g1:Group)-[r1]->(g2:GPO {name: {name}}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = g2.name) AND NOT n.name = g2.name AND r1.isacl=true'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Transitive Object Controllers'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((n)-[r:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(g:GPO {name:{name}}))'
                        }
                        end={this.state.label}
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

GpoNodeData.propTypes = {
    visible: PropTypes.bool.isRequired,
};

export default withAlert()(GpoNodeData);
