import React, {useContext} from 'react';
import {motion} from 'framer-motion';
import {AppContext} from '../../../AppContext';
import styles from './EdgeFilter.module.css';
import EdgeFilterCheck from './EdgeFilterCheck';
import clsx from 'clsx';
import EdgeFilterSection from './EdgeFilterSection';

const EdgeFilter = ({ open }) => {
    const context = useContext(AppContext);
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
            className={clsx(
                styles.edgeFilter,
                context.darkMode ? styles.dark : styles.light
            )}
        >
            <div className={styles.center}>
                <h3>Edge Filtering</h3>
            </div>

            <div className={styles.container}>
                <div>
                    <EdgeFilterSection
                        title='Default Edges'
                        edges={['MemberOf', 'HasSession', 'AdminTo']}
                        sectionName='default'
                    />
                    <EdgeFilterCheck name='MemberOf' />
                    <EdgeFilterCheck name='HasSession' />
                    <EdgeFilterCheck name='AdminTo' />
                    <EdgeFilterSection
                        title='ACL Edges'
                        edges={[
                            'AllExtendedRights',
                            'AddMember',
                            'ForceChangePassword',
                            'GenericAll',
                            'GenericWrite',
                            'Owns',
                            'WriteDacl',
                            'WriteOwner',
                            'ReadLAPSPassword',
                            'ReadGMSAPassword',
                            'AddKeyCredentialLink',
                            'WriteSPN',
                            'AddSelf'
                        ]}
                        sectionName='ACL'
                    />
                    <EdgeFilterCheck name='AllExtendedRights' />
                    <EdgeFilterCheck name='AddMember' />
                    <EdgeFilterCheck name='ForceChangePassword' />
                    <EdgeFilterCheck name='GenericAll' />
                    <EdgeFilterCheck name='GenericWrite' />
                    <EdgeFilterCheck name='Owns' />
                    <EdgeFilterCheck name='WriteDacl' />
                    <EdgeFilterCheck name='WriteOwner' />
                    <EdgeFilterCheck name='ReadLAPSPassword' />
                    <EdgeFilterCheck name='ReadGMSAPassword' />
                    <EdgeFilterCheck name='AddKeyCredentialLink' />
                    <EdgeFilterCheck name='WriteSPN' />
                    <EdgeFilterCheck name='AddSelf' />
                    <EdgeFilterSection
                        title='Containers'
                        sectionName='container'
                        edges={['Contains', 'GpLink']}
                    />
                    <EdgeFilterCheck name='Contains' />
                    <EdgeFilterCheck name='GpLink' />
                    <EdgeFilterSection
                        title='Special'
                        sectionName='special'
                        edges={[
                            'CanRDP',
                            'CanPSRemote',
                            'ExecuteDCOM',
                            'AllowedToDelegate',
                            'AddAllowedToAct',
                            'AllowedToAct',
                            'SQLAdmin',
                            'HasSIDHistory',
                        ]}
                    />
                    <EdgeFilterCheck name='CanRDP' />
                    <EdgeFilterCheck name='CanPSRemote' />
                    <EdgeFilterCheck name='ExecuteDCOM' />
                    <EdgeFilterCheck name='AllowedToDelegate' />
                    <EdgeFilterCheck name='AddAllowedToAct' />
                    <EdgeFilterCheck name='AllowedToAct' />
                    <EdgeFilterCheck name='SQLAdmin' />
                    <EdgeFilterCheck name='HasSIDHistory' />
                </div>
                <div>
                    <EdgeFilterSection
                        title='Azure Edges'
                        edges={[
                            'AZAddMembers',
                            'AZContains',
                            'AZContributor',
                            'AZGetCertificates',
                            'AZGetKeys',
                            'AZGetSecrets',
                            'AZGlobalAdmin',
                            'AZOwns',
                            'AZPrivilegedRoleAdmin',
                            'AZResetPassword',
                            'AZUserAccessAdministrator',
                            'AZAppAdmin',
                            'AZCloudAppAdmin',
                            'AZRunsAs',
                            'AZKeyVaultContributor',
                        ]}
                        sectionName='azure'
                    />
                    <EdgeFilterCheck name='AZAddMembers' />
                    <EdgeFilterCheck name='AZContains' />
                    <EdgeFilterCheck name='AZContributor' />
                    <EdgeFilterCheck name='AZGetCertificates' />
                    <EdgeFilterCheck name='AZGetKeys' />
                    <EdgeFilterCheck name='AZGetSecrets' />
                    <EdgeFilterCheck name='AZGlobalAdmin' />
                    <EdgeFilterCheck name='AZOwns' />
                    <EdgeFilterCheck name='AZPrivilegedRoleAdmin' />
                    <EdgeFilterCheck name='AZResetPassword' />
                    <EdgeFilterCheck name='AZUserAccessAdministrator' />
                    <EdgeFilterCheck name='AZAppAdmin' />
                    <EdgeFilterCheck name='AZCloudAppAdmin' />
                    <EdgeFilterCheck name='AZRunsAs' />
                    <EdgeFilterCheck name='AZKeyVaultContributor' />
                </div>
            </div>
        </motion.div>
    );
};

EdgeFilter.propTypes = {};
export default EdgeFilter;
