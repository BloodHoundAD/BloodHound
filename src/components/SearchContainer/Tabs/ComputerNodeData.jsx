import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NodeProps from './NodeProps';
import NodeCypherLink from './NodeCypherLink';
import NodeCypherNoNumberLink from './NodeCypherNoNumberLink';
import NodeCypherLinkComplex from './NodeCypherLinkComplex';
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

class ComputerNodeData extends Component {
    constructor() {
        super();

        this.state = {
            label: '',
            driversessions: [],
            propertyMap: {},
            ServicePrincipalNames: [],
            displayMap: {
                operatingsystem: 'OS',
                enabled: 'Enabled',
                unconstraineddelegation: 'Allows Unconstrained Delegation',
                owned: 'Compromised',
                haslaps: 'LAPS Enabled',
            },
            notes: null,
            pics: [],
            currentImage: 0,
            lightboxIsOpen: false,
        };

        emitter.on('computerNodeClicked', this.getNodeData.bind(this));
        emitter.on('userNodeClicked', this.nullTarget.bind(this));
        emitter.on('groupNodeClicked', this.nullTarget.bind(this));
        emitter.on('domainNodeClicked', this.nullTarget.bind(this));
        emitter.on('gpoNodeClicked', this.nullTarget.bind(this));
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

    getNodeData(payload) {
        jQuery(this.refs.complete).hide();
        jQuery(this.refs.piccomplete).hide();
        $.each(this.state.driversessions, function(_, record) {
            record.close();
        });
        this.setState({
            label: payload,
            propertyMap: {},
            driversessions: [],
        });

        let key = `computer_${this.state.label}`;
        let c = imageconf.get(key);
        let pics = [];
        if (typeof c !== 'undefined') {
            this.setState({ pics: c });
        } else {
            this.setState({ pics: pics });
        }

        var propCollection = driver.session();
        propCollection
            .run('MATCH (c:Computer {name:{name}}) RETURN c', { name: payload })
            .then(result => {
                var properties = result.records[0]._fields[0].properties;
                let spn;
                if (!properties.serviceprincipalnames) {
                    spn = [];
                } else {
                    spn = properties.serviceprincipalnames;
                }
                let notes;
                if (!properties.notes) {
                    notes = null;
                } else {
                    notes = properties.notes;
                }

                let del;
                if (!properties.allowedtodelegate) {
                    del = [];
                } else {
                    del = properties.allowedtodelegate;
                }
                this.setState({
                    ServicePrincipalNames: spn,
                    AllowedToDelegate: del,
                    propertyMap: properties,
                    notes: notes,
                });
                propCollection.close();
            });

        this.setState({ driversessions: [propCollection] });
    }

    uploadImage(files) {
        if (!this.props.visible || files.length === 0) {
            return;
        }
        let p = this.state.pics;
        let oLen = p.length;
        let key = `computer_${this.state.label}`;

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
        let key = `computer_${this.state.label}`;
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

    notesBlur(event) {
        let notes =
            this.state.notes === null || this.state.notes === ''
                ? null
                : this.state.notes;
        let q = driver.session();
        if (notes === null) {
            q.run('MATCH (n:Computer {name:{name}}) REMOVE n.notes', {
                name: this.state.label,
            }).then(() => {
                q.close();
            });
        } else {
            q.run('MATCH (n:Computer {name:{name}}) SET n.notes = {notes}', {
                name: this.state.label,
                notes: this.state.notes,
            }).then(() => {
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
                    <h4>Node Info</h4>
                    <dt>Name</dt>
                    <dd>{this.state.label}</dd>
                    <NodeProps
                        properties={this.state.propertyMap}
                        displayMap={this.state.displayMap}
                        ServicePrincipalNames={this.state.ServicePrincipalNames}
                        AllowedToDelegate={this.state.AllowedToDelegate}
                    />

                    <NodeCypherLink
                        property='Sessions'
                        target={this.state.label}
                        baseQuery={
                            "MATCH p=(m:Computer {name:{name}})-[r:HasSession]->(n:User) WHERE NOT n.name ENDS WITH '$'"
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Reachable High Value Targets'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (m:Computer {name:{name}}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                        }
                        start={this.state.label}
                    />

                    <NodeCypherLinkComplex
                        property='Sibling Objects in the Same OU'
                        target={this.state.label}
                        countQuery={
                            'MATCH (o1)-[r1:Contains]->(o2:Computer {name:{name}}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN count(distinct(n))'
                        }
                        graphQuery={
                            'MATCH (o1)-[r1:Contains]->(o2:Computer {name:{name}}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN p1,p2'
                        }
                    />

                    <NodeCypherLinkComplex
                        property='Effective Inbound GPOs'
                        target={this.state.label}
                        countQuery={
                            'MATCH (c:Computer {name:{name}}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN count(g1)+count(g2)'
                        }
                        graphQuery={
                            'MATCH (c:Computer {name:{name}}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN p1,p2'
                        }
                    />

                    <NodeCypherNoNumberLink
                        target={this.state.label}
                        property='See Computer within Domain/OU Tree'
                        query='MATCH p = (d:Domain)-[r:Contains*1..]->(u:Computer {name:{name}}) RETURN p'
                    />
                    <h4>Local Admins</h4>

                    <NodeCypherLink
                        property='Explicit Admins'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n)-[b:AdminTo]->(c:Computer {name:{name}})'
                        }
                        end={this.state.label}
                    />

                    <NodeCypherLink
                        property='Unrolled Admins'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n)-[r:MemberOf|AdminTo*1..]->(m:Computer {name:{name}}) WHERE NOT n:Group'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLinkComplex
                        property='Foreign Admins'
                        target={this.state.label}
                        countQuery={
                            'MATCH (c:Computer {name:{name}}) OPTIONAL MATCH (u1)-[:AdminTo]->(c) WHERE NOT u1.domain = c.domain WITH u1,c OPTIONAL MATCH (u2)-[:MemberOf*1..]->(:Group)-[:AdminTo]->(c) WHERE NOT u2.domain = c.domain WITH COLLECT(u1) + COLLECT(u2) as tempVar,c UNWIND tempVar as principals RETURN COUNT(DISTINCT(principals))'
                        }
                        graphQuery={
                            'MATCH (c:Computer {name:{name}}) OPTIONAL MATCH p1 = (u1)-[:AdminTo]->(c) WHERE NOT u1.domain = c.domain WITH p1,c OPTIONAL MATCH p2 = (u2)-[:MemberOf*1..]->(:Group)-[:AdminTo]->(c) WHERE NOT u2.domain = c.domain RETURN p1,p2'
                        }
                    />

                    <NodeCypherLink
                        property='Derivative Local Admins'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((n)-[r:AdminTo|MemberOf|HasSession*1..]->(m:Computer {name:{name}}))'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <h4>Inbound Execution Privileges</h4>
                    <NodeCypherLink
                        property='First Degree Remote Desktop Users'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n)-[r:CanRDP]->(m:Computer {name:{name}})'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Remote Desktop Users'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n)-[r1:MemberOf*1..]->(g:Group)-[r:CanRDP]->(m:Computer {name:{name}})'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='First Degree Distributed COM Users'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n)-[r:ExecuteDCOM]->(m:Computer {name:{name}})'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Distributed COM Users'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n)-[r1:MemberOf*1..]->(g:Group)-[r:ExecuteDCOM]->(m:Computer {name:{name}})'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <h4>Group Memberships</h4>

                    <NodeCypherLink
                        property='First Degree Group Membership'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (m:Computer {name:{name}}),(n:Group), p=(m)-[r:MemberOf]->(n)'
                        }
                        start={this.state.label}
                    />

                    <NodeCypherLink
                        property='Unrolled Group Membership'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(c:Computer {name:{name}})-[r:MemberOf*1..]->(n:Group)'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Foreign Group Membership'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(c:Computer {name:{name}})-[r:MemberOf*1..]->(n:Group) WHERE NOT n.domain = c.domain'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <h4>Local Admin Rights</h4>

                    <NodeCypherLink
                        property='First Degree Local Admin'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (m:Computer {name:{name}}), (n:Computer), p=(m)-[r:AdminTo]->(n)'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Local Admin'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(m:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(n:Computer) WHERE NOT n.name={name}'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Derivative Local Admin'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (m:Computer {name:{name}}), (n:Computer) WHERE NOT n.name={name} MATCH p=shortestPath((m)-[r:AdminTo|MemberOf*1..]->(n))'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <h4>Inbound Execution Privileges</h4>
                    <NodeCypherLink
                        property='SQL Admins'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n:User)-[r:SQLAdmin]->(m:Computer {name:{name}})'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <h4>Outbound Execution Privileges</h4>
                    <NodeCypherLink
                        property='First Degree RDP Privileges'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(m:Computer {name:{name}})-[r:CanRDP]->(n:Computer)'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated RDP Privileges'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(m:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:CanRDP]->(n:Computer)'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='First Degree DCOM Privileges'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(m:Computer {name:{name}})-[r:ExecuteDCOM]->(n:Computer)'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated DCOM Privileges'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(m:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2:ExecuteDCOM]->(n:Computer)'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Constrained Delegation Privileges'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(m:User {name:{name}})-[r:AllowedToDelegate]->(n:Computer)'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <h4>Inbound Object Control</h4>
                    <NodeCypherLink
                        property='Explicit Object Controllers'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n)-[r]->(u1:Computer {name: {name}}) WHERE r.isacl=true'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Unrolled Object Controllers'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1:AddMember|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(u:Computer {name: {name}}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.name = u.name) AND NOT n.name = u.name'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Transitive Object Controllers'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((n)-[r1:MemberOf|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:Computer {name: {name}}))'
                        }
                        end={this.state.label}
                        distinct
                    />

                    <h4>Outbound Object Control</h4>
                    <NodeCypherLink
                        property='First Degree Object Control'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p = (c:Computer {name:{name}})-[r]->(n) WHERE r.isacl=true'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Object Control'
                        target={this.state.label}
                        baseQuery={
                            'MATCH p = (c:Computer {name:{name}})-[r1:MemberOf*1..]->(g:Group)-[r2]->(n) WHERE r2.isacl=true'
                        }
                        start={this.state.label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Transitive Object Control'
                        target={this.state.label}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.name={name} WITH n MATCH p = shortestPath((c:Computer {name:{name}})-[r:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(n))'
                        }
                        start={this.state.label}
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

ComputerNodeData.propTypes = {
    visible: PropTypes.bool.isRequired,
};

export default withAlert()(ComputerNodeData);
