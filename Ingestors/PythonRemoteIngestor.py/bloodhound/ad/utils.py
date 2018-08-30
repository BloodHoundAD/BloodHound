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
import socket
import threading
import re
import dns
from dns import resolver, reversename
from bloodhound.ad.structures import LDAP_SID

"""
"""
class ADUtils(object):
    WELLKNOWN_SIDS = {
        "S-1-0": ("Null Authority", "USER"),
        "S-1-0-0": ("Nobody", "USER"),
        "S-1-1": ("World Authority", "USER"),
        "S-1-1-0": ("Everyone", "GROUP"),
        "S-1-2": ("Local Authority", "USER"),
        "S-1-2-0": ("Local", "GROUP"),
        "S-1-2-1": ("Console Logon", "GROUP"),
        "S-1-3": ("Creator Authority", "USER"),
        "S-1-3-0": ("Creator Owner", "USER"),
        "S-1-3-1": ("Creator Group", "GROUP"),
        "S-1-3-2": ("Creator Owner Server", "COMPUTER"),
        "S-1-3-3": ("Creator Group Server", "COMPUTER"),
        "S-1-3-4": ("Owner Rights", "GROUP"),
        "S-1-4": ("Non-unique Authority", "USER"),
        "S-1-5": ("NT Authority", "USER"),
        "S-1-5-1": ("Dialup", "GROUP"),
        "S-1-5-2": ("Network", "GROUP"),
        "S-1-5-3": ("Batch", "GROUP"),
        "S-1-5-4": ("Interactive", "GROUP"),
        "S-1-5-6": ("Service", "GROUP"),
        "S-1-5-7": ("Anonymous", "GROUP"),
        "S-1-5-8": ("Proxy", "GROUP"),
        "S-1-5-9": ("Enterprise Domain Controllers", "GROUP"),
        "S-1-5-10": ("Principal Self", "USER"),
        "S-1-5-11": ("Authenticated Users", "GROUP"),
        "S-1-5-12": ("Restricted Code", "GROUP"),
        "S-1-5-13": ("Terminal Server Users", "GROUP"),
        "S-1-5-14": ("Remote Interactive Logon", "GROUP"),
        "S-1-5-15": ("This Organization ", "GROUP"),
        "S-1-5-17": ("This Organization ", "GROUP"),
        "S-1-5-18": ("Local System", "USER"),
        "S-1-5-19": ("NT Authority", "USER"),
        "S-1-5-20": ("NT Authority", "USER"),
        "S-1-5-80-0": ("All Services ", "GROUP"),
        "S-1-5-32-544": ("Administrators", "GROUP"),
        "S-1-5-32-545": ("Users", "GROUP"),
        "S-1-5-32-546": ("Guests", "GROUP"),
        "S-1-5-32-547": ("Power Users", "GROUP"),
        "S-1-5-32-548": ("Account Operators", "GROUP"),
        "S-1-5-32-549": ("Server Operators", "GROUP"),
        "S-1-5-32-550": ("Print Operators", "GROUP"),
        "S-1-5-32-551": ("Backup Operators", "GROUP"),
        "S-1-5-32-552": ("Replicators", "GROUP"),
        "S-1-5-32-554": ("Pre-Windows 2000 Compatible Access", "GROUP"),
        "S-1-5-32-555": ("Remote Desktop Users", "GROUP"),
        "S-1-5-32-556": ("Network Configuration Operators", "GROUP"),
        "S-1-5-32-557": ("Incoming Forest Trust Builders", "GROUP"),
        "S-1-5-32-558": ("Performance Monitor Users", "GROUP"),
        "S-1-5-32-559": ("Performance Log Users", "GROUP"),
        "S-1-5-32-560": ("Windows Authorization Access Group", "GROUP"),
        "S-1-5-32-561": ("Terminal Server License Servers", "GROUP"),
        "S-1-5-32-562": ("Distributed COM Users", "GROUP"),
        "S-1-5-32-568": ("IIS_IUSRS", "GROUP"),
        "S-1-5-32-569": ("Cryptographic Operators", "GROUP"),
        "S-1-5-32-573": ("Event Log Readers", "GROUP"),
        "S-1-5-32-574": ("Certificate Service DCOM Access", "GROUP"),
        "S-1-5-32-575": ("RDS Remote Access Servers", "GROUP"),
        "S-1-5-32-576": ("RDS Endpoint Servers", "GROUP"),
        "S-1-5-32-577": ("RDS Management Servers", "GROUP"),
        "S-1-5-32-578": ("Hyper-V Administrators", "GROUP"),
        "S-1-5-32-579": ("Access Control Assistance Operators", "GROUP"),
        "S-1-5-32-580": ("Access Control Assistance Operators", "GROUP")
    }


    @staticmethod
    def domain2ldap(domain):
        return 'DC=' + ',DC='.join(str(domain).rstrip('.').split('.'))


    @staticmethod
    def ldap2domain(ldap):
        return re.sub(',DC=', '.', ldap[ldap.find('DC='):], flags=re.I)[3:]


    @staticmethod
    def tcp_ping(host, port, timeout=1.0):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(timeout)
            s.connect((host, port))
            s.close()
            return True
        except KeyboardInterrupt:
            raise
        except:
            return False

    @staticmethod
    def ip2host(ip, resolver=resolver, use_tcp=False):
        result = ip
        try:
            addr = reversename.from_address(ip)
        except dns.exception.SyntaxError:
            logging.warning('DNS: invalid address: %s' % ip)
            return result

        try:
            answer = str(resolver.query(addr, 'PTR', tcp=use_tcp)[0])
            result = answer.rstrip('.')
        except (dns.resolver.NXDOMAIN, dns.resolver.Timeout) as e:
            pass
        except:
            logging.warning('DNS lookup failed: %s' % addr)
            pass

        return result

    # Translate the binary SID from LDAP into human-readable form
    @staticmethod
    def formatSid(siddata):
        return LDAP_SID(siddata).formatCanonical()

    # Translate SidType to strings accepted by BloodHound
    @staticmethod
    def translateSidType(sidType):
        if sidType == 1:
            return 'user'
        if sidType == 2:
            return 'group'
        # sidType 4 means "alias", this is actually a Domain Local Group
        if sidType == 4:
            return 'group'
        if sidType == 9:
            return 'computer'
        if sidType == 5:
            return 'wellknown'
        # Can be a (by BloudHound) unsupported type
        # must not be an empty string since this breaks our CSV files
        return 'unknown'

    @staticmethod
    def resolve_ad_entry(entry):
        """
        Translate an LDAP entry into a dictionary containing the
        information used by BloodHound
        """
        resolved = {}
        account = ''
        dn = ''
        domain = ''
        if 'sAMAccountName' in entry['attributes']:
            account = entry['attributes']['sAMAccountName']
        if entry['attributes']['distinguishedName']:
            dn = entry['attributes']['distinguishedName']
            domain = ADUtils.ldap2domain(dn)

        resolved['principal'] = unicode('%s@%s' % (account, domain)).upper()
        if not 'sAMAccountName' in entry['attributes']:
            # TODO: Fix foreign users
            # requires cross-forest resolving
            if 'ForeignSecurityPrincipals' in dn:
                resolved['principal'] = domain.upper()
                resolved['type'] = 'foreignsecurityprincipal'
                if 'name' in entry['attributes']:
                    # Fix wellknown entries
                    ename = entry['attributes']['name']
                    if ename in ADUtils.WELLKNOWN_SIDS:
                        name, sidtype = ADUtils.WELLKNOWN_SIDS[ename]
                        resolved['type'] = sidtype.lower()
                        resolved['principal'] = unicode('%s@%s' % (name, domain)).upper()
            else:
                resolved['type'] = 'unknown'
        else:
            accountType = entry['attributes']['sAMAccountType']
            if accountType in [268435456, 268435457, 536870912, 536870913]:
                resolved['type'] = 'group'
            elif accountType in [805306369]:
                resolved['type'] = 'computer'
                short_name = account.rstrip('$')
                resolved['principal'] = unicode('%s.%s' % (short_name, domain)).upper()
            elif accountType in [805306368]:
                resolved['type'] = 'user'
            elif accountType in [805306370]:
                resolved['type'] = 'trustaccount'
            else:
                resolved['type'] = 'domain'

        return resolved

class DNSCache(object):
    """
    A cache used for caching forward and backward DNS at the same time.
    This cache is used to avoid PTR queries when forward lookups are already done
    """
    def __init__(self):
        self.lock = threading.Lock()
        self._cache = {}

    # Get an entry from the cache
    def get(self, entry):
        with self.lock:
            return self._cache[entry]

    # Put a forward lookup in the cache, this also
    # puts the reverse lookup in the cache
    def put(self, entry, value):
        with self.lock:
            self._cache[entry] = value
            self._cache[value] = entry

    # Put a reverse lookup in the cache. Forward lookup
    # is not added since reverse is considered less reliable
    def put_single(self, entry, value):
        with self.lock:
            self._cache[entry] = value

class SidCache(object):
    """
    Generic cache for caching SID lookups
    """
    def __init__(self):
        self.lock = threading.Lock()
        self._cache = {}

    # Get an entry from the cache
    def get(self, entry):
        with self.lock:
            return self._cache[entry]

    # Put a forward lookup in the cache, this also
    # puts the reverse lookup in the cache
    def put(self, entry, value):
        with self.lock:
            self._cache[entry] = value

class SamCache(SidCache):
    """
    Cache for mapping SAM names to principals.
    Identical to the SidCache in behaviour
    """
    pass
