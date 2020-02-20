import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const EdgeFilter = ({ open }) => {
    const [edgeIncluded, setEdgeIncluded] = useState(appStore.edgeincluded);

    const clearSection = section => {
        let current = edgeIncluded;
        if (section === 'default') {
            current.MemberOf = false;
            current.HasSession = false;
            current.AdminTo = false;
        } else if (section === 'acl') {
            current.AllExtendedRights = false;
            current.AddMember = false;
            current.ForceChangePassword = false;
            current.GenericAll = false;
            current.GenericWrite = false;
            current.Owns = false;
            current.WriteDacl = false;
            current.WriteOwner = false;
            current.ReadLAPSPassword = false;
            current.ReadGMSAPassword = false;
        } else if (section === 'special') {
            current.CanRDP = false;
            current.CanPSRemote = false;
            current.ExecuteDCOM = false;
            current.AllowedToDelegate = false;
            current.AddAllowedToAct = false;
            current.AllowedToAct = false;
            current.SQLAdmin = false;
            current.HasSIDHistory = false;
        } else {
            current.Contains = false;
            current.GpLink = false;
        }

        setEdgeIncluded({ ...current });
        appStore.edgeincluded = current;
        conf.set('edgeincluded', current);
    };

    const setSection = section => {
        let current = edgeIncluded;
        if (section === 'default') {
            current.MemberOf = true;
            current.HasSession = true;
            current.AdminTo = true;
        } else if (section === 'acl') {
            current.AllExtendedRights = true;
            current.AddMember = true;
            current.ForceChangePassword = true;
            current.GenericAll = true;
            current.GenericWrite = true;
            current.Owns = true;
            current.WriteDacl = true;
            current.WriteOwner = true;
            current.ReadLAPSPassword = true;
            current.ReadGMSAPassword = true;
        } else if (section === 'special') {
            current.CanRDP = true;
            current.CanPSRemote = true;
            current.ExecuteDCOM = true;
            current.AllowedToDelegate = true;
            current.AddAllowedToAct = true;
            current.AllowedToAct = true;
            current.SQLAdmin = true;
            current.HasSIDHistory = true;
        } else {
            current.Contains = true;
            current.GpLink = true;
        }

        setEdgeIncluded({ ...current });
        appStore.edgeincluded = current;
        conf.set('edgeincluded', current);
    };

    const handleEdgeChange = e => {
        let current = edgeIncluded;
        let edgeName = e.target.getAttribute('name');
        current[edgeName] = !current[edgeName];
        setEdgeIncluded({ ...current });
        appStore.edgeincluded = current;
        conf.set('edgeincluded', current);
    };

    return (
        <motion.div
            variants={{
                visible: {
                    height: 'auto',
                    width: 'auto',
                    transition: { duration: 0.4 },
                },
                hidden: {
                    height: 0,
                    width: 0,
                    transition: { duration: 0.4 },
                },
            }}
            initial={'hidden'}
            animate={open ? 'visible' : 'hidden'}
            className={'edgeFilter'}
        >
            <div>
                <h3>Edge Filtering</h3>
                <i
                    data-toggle='tooltip'
                    data-placement='right'
                    title='Filters edges in shortest path queries'
                    className='glyphicon glyphicon-question-sign'
                />
            </div>
            <div className={'edge-filter-heading'}>
                <h4>Default Edges</h4>
                <button
                    onClick={() => {
                        setSection('default');
                    }}
                    className={'fa fa-check-double'}
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Check all default edges'
                />
                <button
                    onClick={() => {
                        clearSection('default');
                    }}
                    className={'fa fa-eraser'}
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Clear all default edges'
                />
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    checked={edgeIncluded.MemberOf}
                    onChange={e => handleEdgeChange(e)}
                    name='MemberOf'
                />
                <label onClick={e => handleEdgeChange(e)} name='MemberOf'>
                    {' '}
                    MemberOf
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='HasSession'
                    checked={edgeIncluded.HasSession}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='HasSession'>
                    {' '}
                    HasSession
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='AdminTo'
                    checked={edgeIncluded.AdminTo}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='AdminTo'>
                    {' '}
                    AdminTo
                </label>
            </div>
            <div className={'edge-filter-heading'}>
                <h4>ACL Edges</h4>
                <button
                    onClick={() => setSection('acl')}
                    className={'fa fa-check-double'}
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Check all ACL edges'
                />
                <button
                    onClick={() => clearSection('acl')}
                    className={'fa fa-eraser'}
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Clear all ACL edges'
                />
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='AllExtendedRights'
                    checked={edgeIncluded.AllExtendedRights}
                    onChange={e => handleEdgeChange(e)}
                />
                <label
                    onClick={e => handleEdgeChange(e)}
                    name='AllExtendedRights'
                >
                    {' '}
                    AllExtendedRights
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='AddMember'
                    checked={edgeIncluded.AddMember}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='AddMember'>
                    {' '}
                    AddMember
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='ForceChangePassword'
                    checked={edgeIncluded.ForceChangePassword}
                    onChange={e => handleEdgeChange(e)}
                />
                <label
                    onClick={e => handleEdgeChange(e)}
                    name='ForceChangePassword'
                >
                    {' '}
                    ForceChangePassword
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='GenericAll'
                    checked={edgeIncluded.GenericAll}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='GenericAll'>
                    {' '}
                    GenericAll
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='GenericWrite'
                    checked={edgeIncluded.GenericWrite}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='GenericWrite'>
                    {' '}
                    GenericWrite
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='Owns'
                    checked={edgeIncluded.Owns}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='Owns'>
                    {' '}
                    Owns
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='WriteDacl'
                    checked={edgeIncluded.WriteDacl}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='WriteDacl'>
                    {' '}
                    WriteDacl
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='WriteOwner'
                    checked={edgeIncluded.WriteOwner}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='WriteOwner'>
                    {' '}
                    WriteOwner
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='ReadLAPSPassword'
                    checked={edgeIncluded.ReadLAPSPassword}
                    onChange={e => handleEdgeChange(e)}
                />
                <label
                    onClick={e => handleEdgeChange(e)}
                    name='ReadLAPSPassword'
                >
                    {' '}
                    ReadLAPSPassword
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='ReadGMSAPassword'
                    checked={edgeIncluded.ReadGMSAPassword}
                    onChange={e => handleEdgeChange(e)}
                />
                <label
                    onClick={e => handleEdgeChange(e)}
                    name='ReadGMSAPassword'
                >
                    {' '}
                    ReadGMSAPassword
                </label>
            </div>
            <div className={'edge-filter-heading'}>
                <h4>Containers</h4>
                <button
                    onClick={x => setSection('containers')}
                    className={'fa fa-check-double'}
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Check all Containers edges'
                />
                <button
                    onClick={x => clearSection('containers')}
                    className={'fa fa-eraser'}
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Clear all Containers edges'
                />
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='Contains'
                    checked={edgeIncluded.Contains}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='Contains'>
                    {' '}
                    Contains
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='GpLink'
                    checked={edgeIncluded.GpLink}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='GpLink'>
                    {' '}
                    GpLink
                </label>
            </div>
            <div className={'edge-filter-heading'}>
                <h4>Special</h4>
                <button
                    onClick={x => setSection('special')}
                    className={'fa fa-check-double'}
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Check all special edges'
                />
                <button
                    onClick={x => clearSection('special')}
                    className={'fa fa-eraser'}
                    data-toggle='tooltip'
                    data-placement='top'
                    title='Clear all special edges'
                />
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='CanRDP'
                    checked={edgeIncluded.CanRDP}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='CanRDP'>
                    {' '}
                    CanRDP
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='CanPSRemote'
                    checked={edgeIncluded.CanPSRemote}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='CanPSRemote'>
                    {' '}
                    CanPSRemote
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='ExecuteDCOM'
                    checked={edgeIncluded.ExecuteDCOM}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='ExecuteDCOM'>
                    {' '}
                    ExecuteDCOM
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='AllowedToDelegate'
                    checked={edgeIncluded.AllowedToDelegate}
                    onChange={e => handleEdgeChange(e)}
                />
                <label
                    onClick={e => handleEdgeChange(e)}
                    name='AllowedToDelegate'
                >
                    {' '}
                    AllowedToDelegate
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='AddAllowedToAct'
                    checked={edgeIncluded.AddAllowedToAct}
                    onChange={e => handleEdgeChange(e)}
                />
                <label
                    onClick={e => handleEdgeChange(e)}
                    name='AddAllowedToAct'
                >
                    {' '}
                    AddAllowedToAct
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='AllowedToAct'
                    checked={edgeIncluded.AllowedToAct}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='AllowedToAct'>
                    {' '}
                    AllowedToAct
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='SQLAdmin'
                    checked={edgeIncluded.SQLAdmin}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='SQLAdmin'>
                    {' '}
                    SQLAdmin
                </label>
            </div>
            <div>
                <input
                    className='checkbox-inline'
                    type='checkbox'
                    name='HasSIDHistory'
                    checked={edgeIncluded.HasSIDHistory}
                    onChange={e => handleEdgeChange(e)}
                />
                <label onClick={e => handleEdgeChange(e)} name='HasSIDHistory'>
                    {' '}
                    HasSIDHistory
                </label>
            </div>
        </motion.div>
    );
};

EdgeFilter.propTypes = {};
export default EdgeFilter;
