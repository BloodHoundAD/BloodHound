####################
#
# Copyright (c) 2018 Fox-IT
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#
####################

import logging
import traceback
from impacket.dcerpc.v5 import transport, samr, srvs, lsat, lsad, nrpc
from impacket.dcerpc.v5.rpcrt import DCERPCException
from impacket.dcerpc.v5.ndr import NULL
from impacket.dcerpc.v5.dtypes import RPC_SID, MAXIMUM_ALLOWED
from bloodhound.ad.utils import ADUtils

class ADComputer(object):
    """
    Computer connected to Active Directory
    """
    def __init__(self, hostname=None, samname=None, ad=None, objectsid=None):
        self.hostname = hostname
        self.ad = ad
        self.samname = samname
        self.rpc = None
        self.dce = None
        self.admin_sids = []
        self.admins = []
        self.trusts = []
        self.addr = None
        self.smbconnection = None
        # The SID of the local domain
        self.sid = None
        # The SID within the domain
        self.objectsid = objectsid
        self.primarygroup = None

    def get_bloodhound_data(self):
        data = {
            'Name': self.hostname.upper(),
            'LocalAdmins': self.admins,
            'Properties': {
                'objectsid': self.objectsid,
                'domain': self.ad.domain,
                'highvalue': False
            }
        }
        return data

    def try_connect(self):
        addr = None
        try:
            addr = self.ad.dnscache.get(self.hostname)
        except KeyError:
            try:
                q = self.ad.dnsresolver.query(self.hostname, 'A', tcp=self.ad.dns_tcp)
                for r in q:
                    addr = r.address

                if addr == None:
                    return False
            # Do exit properly on keyboardinterrupts
            except KeyboardInterrupt:
                raise
            except Exception as e:
                # Doesn't exist
                if "None of DNS query names exist" in str(e):
                    logging.info('Skipping enumeration for %s since it could not be resolved.', self.hostname)
                else:
                    logging.warning('Could not resolve: %s: %s', self.hostname, e)
                return False

            logging.debug('Resolved: %s' % addr)

            self.ad.dnscache.put(self.hostname, addr)

        self.addr = addr

        logging.debug('Trying connecting to computer: %s', self.hostname)
        # We ping the host here, this adds a small overhead for setting up an extra socket
        # but saves us from constructing RPC Objects for non-existing hosts. Also RPC over
        # SMB does not support setting a connection timeout, so we catch this here.
        if ADUtils.tcp_ping(addr, 445) is False:
            return False
        return True


    def dce_rpc_connect(self, binding, uuid):
        logging.debug('DCE/RPC binding: %s', binding)

        try:
            self.rpc = transport.DCERPCTransportFactory(binding)
            self.rpc.set_connect_timeout(1.0)
            if hasattr(self.rpc, 'set_credentials'):
                self.rpc.set_credentials(self.ad.auth.username, self.ad.auth.password,
                                         domain=self.ad.auth.domain,
                                         lmhash=self.ad.auth.lm_hash,
                                         nthash=self.ad.auth.nt_hash,
                                         aesKey=self.ad.auth.aes_key)

            # TODO: check Kerberos support
            # if hasattr(self.rpc, 'set_kerberos'):
                # self.rpc.set_kerberos(True, self.ad.auth.kdc)
            # Yes we prefer SMB3, but it isn't supported by all OS
            # self.rpc.preferred_dialect(smb3structs.SMB2_DIALECT_30)

            # Re-use the SMB connection if possible
            if self.smbconnection:
                self.rpc.set_smb_connection(self.smbconnection)
            dce = self.rpc.get_dce_rpc()
            dce.connect()
            if self.smbconnection is None:
                self.smbconnection = self.rpc.get_smb_connection()
                # We explicity set the smbconnection back to the rpc object
                # this way it won't be closed when we call disconnect()
                self.rpc.set_smb_connection(self.smbconnection)

# Implement encryption?
#            dce.set_auth_level(NTLM_AUTH_PKT_PRIVACY)
            dce.bind(uuid)
        except DCERPCException as e:
            logging.debug(traceback.format_exc())
            logging.warning('DCE/RPC connection failed: %s', str(e))
            return None
        except KeyboardInterrupt:
            raise
        except Exception as e:
            logging.debug(traceback.format_exc())
            logging.warning('DCE/RPC connection failed: %s', e)
            return None
        except:
            logging.warning('DCE/RPC connection failed (unknown error)')
            return None

        return dce

    def rpc_close(self):
        if self.smbconnection:
            self.smbconnection.logoff()

    def rpc_get_sessions(self):
        binding = r'ncacn_np:%s[\PIPE\srvsvc]' % self.addr

        dce = self.dce_rpc_connect(binding, srvs.MSRPC_UUID_SRVS)

        if dce is None:
            logging.warning('Connection failed: %s', binding)
            return

        try:
            resp = srvs.hNetrSessionEnum(dce, '\x00', NULL, 10)
        except Exception as e:
            if str(e).find('Broken pipe') >= 0:
                return
            else:
                raise

        sessions = []

        for session in resp['InfoStruct']['SessionInfo']['Level10']['Buffer']:
            userName = session['sesi10_username'][:-1]
            ip = session['sesi10_cname'][:-1]
            # Strip \\ from IPs
            if ip[:2] == '\\\\':
                ip = ip[2:]
            # Skip empty IPs
            if ip == '':
                continue
            # Skip our connection
            if userName == self.ad.auth.username:
                continue
            # Skip empty usernames
            if len(userName) == 0:
                continue
            # Skip machine accounts
            if userName[-1] == '$':
                continue
            # Skip local connections
            if ip in ['127.0.0.1', '[::1]']:
                continue
            # IPv6 address
            if ip[0] == '[' and ip[-1] == ']':
                ip = ip[1:-1]

            logging.info('User %s is logged in on %s from %s' % (userName, self.hostname, ip))

            sessions.append({'user': userName, 'source': ip, 'target': self.hostname})

        dce.disconnect()

        return sessions

    """
    """
    def rpc_get_domain_trusts(self):
        binding = r'ncacn_np:%s[\PIPE\netlogon]' % self.addr

        dce = self.dce_rpc_connect(binding, nrpc.MSRPC_UUID_NRPC)

        if dce is None:
            logging.warning('Connection failed: %s', binding)
            return

        try:
            req = nrpc.DsrEnumerateDomainTrusts()
            req['ServerName'] = NULL
            req['Flags'] = 1
            resp = dce.request(req)
        except Exception as e:
            raise e

        for domain in resp['Domains']['Domains']:
            logging.info('Found domain trust from %s to %s', self.hostname, domain['NetbiosDomainName'])
            self.trusts.append({'domain': domain['DnsDomainName'],
                                'type': domain['TrustType'],
                                'flags': domain['Flags']})

        dce.disconnect()


    """
    This magic is mostly borrowed from impacket/examples/netview.py
    """
    def rpc_get_local_admins(self):
        binding = r'ncacn_np:%s[\PIPE\samr]' % self.addr

        dce = self.dce_rpc_connect(binding, samr.MSRPC_UUID_SAMR)

        if dce is None:
            logging.warning('Connection failed: %s', binding)
            return

        try:
            resp = samr.hSamrConnect(dce)
            serverHandle = resp['ServerHandle']
            # Attempt to get the SID from this computer to filter local accounts later
            try:
                resp = samr.hSamrLookupDomainInSamServer(dce, serverHandle, self.samname[:-1])
                self.sid = resp['DomainId'].formatCanonical()
            # This doesn't always work (for example on DCs)
            except DCERPCException as e:
                # Make it a string which is guaranteed not to match a SID
                self.sid = 'UNKNOWN'


            # Enumerate the domains known to this computer
            resp = samr.hSamrEnumerateDomainsInSamServer(dce, serverHandle)
            domains = resp['Buffer']['Buffer']

            # Query the builtin domain (derived from this SID)
            sid = RPC_SID()
            sid.fromCanonical('S-1-5-32')

            logging.debug('Opening domain handle')
            # Open a handle to this domain
            resp = samr.hSamrOpenDomain(dce,
                                        serverHandle=serverHandle,
                                        desiredAccess=samr.DOMAIN_LOOKUP | MAXIMUM_ALLOWED,
                                        domainId=sid)
            domainHandle = resp['DomainHandle']

            resp = samr.hSamrOpenAlias(dce,
                                       domainHandle,
                                       desiredAccess=samr.ALIAS_LIST_MEMBERS | MAXIMUM_ALLOWED,
                                       aliasId=544)
            resp = samr.hSamrGetMembersInAlias(dce,
                                               aliasHandle=resp['AliasHandle'])
            for member in resp['Members']['Sids']:
                sid_string = member['SidPointer'].formatCanonical()

                logging.debug('Found admin SID: %s', sid_string)
                if not sid_string.startswith(self.sid):
                    # If the sid is known, we can add the admin value directly
                    try:
                        siddata, domain = self.ad.sidcache.get(sid_string)
                        logging.debug('Sid is cached: %s@%s', siddata['Name'], domain)
                        self.admins.append({'Name': u'%s@%s' % (unicode(siddata['Name']).upper(), domain.upper()),
                                            'Type': ADUtils.translateSidType(siddata['Use'])})
                    except KeyError:
                        # Append it to the list of unresolved SIDs
                        self.admin_sids.append(sid_string)
                else:
                    logging.debug('Ignoring local group %s', sid_string)
        except DCERPCException as e:
            logging.debug('Exception connecting to RPC: %s', e)
        except Exception as e:
            if 'connection reset' in str(e):
                logging.debug('Connection was reset: %s', e)
            else:
                raise e

        dce.disconnect()


    def rpc_resolve_sids(self):
        """
        Resolve any remaining unknown SIDs for local administrator accounts.
        """
        # If all sids were already cached, we can just return
        if len(self.admin_sids) == 0:
            return
        binding = r'ncacn_np:%s[\PIPE\lsarpc]' % self.addr

        dce = self.dce_rpc_connect(binding, lsat.MSRPC_UUID_LSAT)

        if dce is None:
            logging.warning('Connection failed')
            return

        try:
            resp = lsat.hLsarOpenPolicy2(dce, lsat.POLICY_LOOKUP_NAMES | MAXIMUM_ALLOWED)
        except Exception as e:
            if str(e).find('Broken pipe') >= 0:
                return
            else:
                raise

        policyHandle = resp['PolicyHandle']

        # We could look up the SIDs all at once, but if not all SIDs are mapped, we don't know which
        # ones were resolved and which not, making it impossible to map them in the cache.
        # Therefor we use more SAMR calls at the start, but after a while most SIDs will be reliable
        # in our cache and this function doesn't even need to get called anymore.
        for sid_string in self.admin_sids:
            try:
                resp = lsat.hLsarLookupSids(dce, policyHandle, [sid_string], lsat.LSAP_LOOKUP_LEVEL.LsapLookupWksta)
            except DCERPCException as e:
                if str(e).find('STATUS_NONE_MAPPED') >= 0:
                    logging.warning('SID %s lookup failed, return status: STATUS_NONE_MAPPED', sid_string)
                    # Try next SID
                    continue
                elif str(e).find('STATUS_SOME_NOT_MAPPED') >= 0:
                    # Not all could be resolved, work with the ones that could
                    resp = e.get_packet()
                else:
                    raise

            domains = []
            for entry in resp['ReferencedDomains']['Domains']:
                domains.append(entry['Name'])

            for entry in resp['TranslatedNames']['Names']:
                domain = domains[entry['DomainIndex']]
                domainEntry = self.ad.get_domain_by_name(domain)
                if domainEntry is not None:
                    domain = ADUtils.ldap2domain(domainEntry['attributes']['distinguishedName'])

                if entry['Name'] != '':
                    logging.debug('Resolved SID to name: %s@%s' % (entry['Name'], domain))
                    self.admins.append({'Name': u'%s@%s' % (unicode(entry['Name']).upper(), domain.upper()),
                                        'Type': ADUtils.translateSidType(entry['Use'])})
                    # Add it to our cache
                    self.ad.sidcache.put(sid_string, (entry, domain))
                else:
                    logging.warning('Resolved name is empty [%s]', entry)

        dce.disconnect()
