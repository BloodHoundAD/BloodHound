import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../../../AppContext';
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
                            'AddSelf',
                            'AddAllowedToAct',
                            'DCSync',
                            'SyncLAPSPassword',
                            'WriteAccountRestrictions',
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
                    <EdgeFilterCheck name='AddAllowedToAct' />
                    <EdgeFilterCheck name='WriteAccountRestrictions' />
                    <EdgeFilterCheck name='DCSync' />
                    <EdgeFilterCheck name='SyncLAPSPassword' />
                    <EdgeFilterSection
                        title='Containers'
                        sectionName='container'
                        edges={['Contains', 'GPLink']}
                    />
                    <EdgeFilterCheck name='Contains' />
                    <EdgeFilterCheck name='GPLink' />
                    <EdgeFilterSection
                        title='Special'
                        sectionName='special'
                        edges={[
                            'CanRDP',
                            'CanPSRemote',
                            'ExecuteDCOM',
                            'AllowedToDelegate',
                            'AllowedToAct',
                            'SQLAdmin',
                            'HasSIDHistory',
                            'DumpSMSAPassword',
                        ]}
                    />
                    <EdgeFilterCheck name='CanRDP' />
                    <EdgeFilterCheck name='CanPSRemote' />
                    <EdgeFilterCheck name='ExecuteDCOM' />
                    <EdgeFilterCheck name='AllowedToDelegate' />
                    <EdgeFilterCheck name='AllowedToAct' />
                    <EdgeFilterCheck name='SQLAdmin' />
                    <EdgeFilterCheck name='HasSIDHistory' />
                    <EdgeFilterCheck name='DumpSMSAPassword' />
                </div>
                <div>
                    <EdgeFilterSection
                        title='Azure Edges'
                        edges={[
                            'AZAvereContributor',
                            'AZContains',
                            'AZContributor',
                            'AZGetCertificates',
                            'AZGetKeys',
                            'AZGetSecrets',
                            'AZHasRole',
                            'AZMemberOf',
                            'AZRunsAs',
                            'AZVMContributor',
                            'AZVMAdminLogin',
                            'AZAddMembers',
                            'AZAddSecret',
                            'AZExecuteCommand',
                            'AZGlobalAdmin',
                            'AZPrivilegedAuthAdmin',
                            'AZPrivilegedRoleAdmin',
                            'AZResetPassword',
                            'AZUserAccessAdministrator',
                            'AZOwns',
                            'AZCloudAppAdmin',
                            'AZAppAdmin',
                            'AZAddOwner',
                            'AZManagedIdentity',
                            'AZKeyVaultContributor',
                            'AZNodeResourceGroup',
                            'AZWebsiteContributor',
                            'AZLogicAppContributor',
                            'AZAutomationContributor',
                            'AZAKSContributor',
                        ]}
                        sectionName='azure'
                    />
                    <EdgeFilterCheck name='AZAvereContributor' />
                    <EdgeFilterCheck name='AZContains' />
                    <EdgeFilterCheck name='AZContributor' />
                    <EdgeFilterCheck name='AZGetCertificates' />
                    <EdgeFilterCheck name='AZGetKeys' />
                    <EdgeFilterCheck name='AZGetSecrets' />
                    <EdgeFilterCheck name='AZHasRole' />
                    <EdgeFilterCheck name='AZMemberOf' />
                    <EdgeFilterCheck name='AZRunsAs' />
                    <EdgeFilterCheck name='AZVMContributor' />
                    <EdgeFilterCheck name='AZVMAdminLogin' />
                    <EdgeFilterCheck name='AZAddMembers' />
                    <EdgeFilterCheck name='AZAddSecret' />
                    <EdgeFilterCheck name='AZExecuteCommand' />
                    <EdgeFilterCheck name='AZGlobalAdmin' />
                    <EdgeFilterCheck name='AZPrivilegedAuthAdmin' />
                    <EdgeFilterCheck name='AZPrivilegedRoleAdmin' />
                    <EdgeFilterCheck name='AZResetPassword' />
                    <EdgeFilterCheck name='AZUserAccessAdministrator' />
                    <EdgeFilterCheck name='AZOwns' />
                    <EdgeFilterCheck name='AZCloudAppAdmin' />
                    <EdgeFilterCheck name='AZAppAdmin' />
                    <EdgeFilterCheck name='AZAddOwner' />
                    <EdgeFilterCheck name='AZManagedIdentity' />
                    <EdgeFilterCheck name='AZKeyVaultContributor' />
                    <EdgeFilterCheck name='AZNodeResourceGroup' />
                    <EdgeFilterCheck name='AZWebsiteContributor' />
                    <EdgeFilterCheck name='AZLogicAppContributor' />
                    <EdgeFilterCheck name='AZAutomationContributor' />
                    <EdgeFilterCheck name='AZAKSContributor' />
                </div>
                <div>
                    <EdgeFilterSection
                        title='MS Graph App Roles'
                        edges={[
                            'AZMGAddSecret',
                            'AZMGAddOwner',
                            'AZMGAddMember',
                            'AZMGGrantAppRoles',
                            'AZMGGrantRole',
                        ]}
                        sectionName='msgraphapproles'
                    />
                    <EdgeFilterCheck name='AZMGAddSecret' />
                    <EdgeFilterCheck name='AZMGAddOwner' />
                    <EdgeFilterCheck name='AZMGAddMember' />
                    <EdgeFilterCheck name='AZMGGrantAppRoles' />
                    <EdgeFilterCheck name='AZMGGrantRole' />
                </div>
            </div>
        </motion.div>
    );
};

EdgeFilter.propTypes = {};
export default EdgeFilter;
