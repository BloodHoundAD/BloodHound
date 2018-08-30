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
import threading
from ldap3.utils.conv import escape_filter_chars
from bloodhound.ad.utils import ADUtils

class ObjectResolver(object):
    """
    This class is responsible for resolving objects. This can be for example sAMAccountNames which
    should be resolved in the GC to see which domain they belong to, or SIDs which have to be
    resolved somewhere else. This resolver is thread-safe.
    """
    def __init__(self, addomain, addc):
        self.addomain = addomain
        self.addc = addc
        self.lock = threading.Lock()

    def resolve_distinguishedname(self, distinguishedname, use_gc=True):
        """
        Resolve a DistinguishedName in LDAP. This will use the GC by default
        Returns a single LDAP entry
        """
        with self.lock:
            if use_gc and not self.addc.gcldap:
                if not self.addc.gc_connect():
                    # Error connecting, bail
                    return None
            if not use_gc and not self.addc.resolverldap:
                if not self.addc.ldap_connect(resolver=True):
                    # Error connecting, bail
                    return None
            if use_gc:
                logging.debug('Querying GC for DN %s', distinguishedname)
            else:
                logging.debug('Querying resolver LDAP for DN %s', distinguishedname)
            distinguishedname = self.addc.ldap_get_single(distinguishedname, use_gc=use_gc, use_resolver=True)
            return distinguishedname

    def resolve_samname(self, samname):
        """
        Resolve a SAM name in the GC. This can give multiple results.
        Returns a list of LDAP entries
        """
        out = []
        safename = escape_filter_chars(samname)
        with self.lock:
            if not self.addc.gcldap:
                if not self.addc.gc_connect():
                    # Error connecting, bail
                    return None
            logging.debug('Querying GC for SAM Name %s', samname)
            entries = self.addc.search(search_base="",
                                       search_filter='(sAMAccountName=%s)' % safename,
                                       use_gc=True,
                                       attributes=['sAMAccountName', 'distinguishedName', 'sAMAccountType'])
            # This uses a generator, however we return a list
            for entry in entries:
                out.append(entry)

        return out

    def resolve_upn(self, upn):
        """
        Resolve a UserPrincipalName in the GC.
        Returns a single LDAP entry
        """
        safename = escape_filter_chars(upn)
        with self.lock:
            if not self.addc.gcldap:
                if not self.addc.gc_connect():
                    # Error connecting, bail
                    return None
            logging.debug('Querying GC for UPN %s', upn)
            entries = self.addc.search(search_base="",
                                       search_filter='&((objectClass=user)(userPrincipalName=%s))' % safename,
                                       use_gc=True,
                                       attributes=['sAMAccountName', 'distinguishedName', 'sAMAccountType'])
            for entry in entries:
                # By definition this can be only one entry
                return entry

    def resolve_sid(self, sid, use_gc=True):
        """
        Resolve a SID in LDAP. This will use the GC by default
        Returns a single LDAP entry
        """
        with self.lock:
            if use_gc and not self.addc.gcldap:
                if not self.addc.gc_connect():
                    # Error connecting, bail
                    return None
            if not use_gc and not self.addc.resolverldap:
                if not self.addc.ldap_connect(resolver=True):
                    # Error connecting, bail
                    return None
            if use_gc:
                base = ""
                logging.debug('Querying GC for SID %s', sid)
            else:
                logging.debug('Querying resolver LDAP for SID %s', sid)
                base = None
            entries = self.addc.search(search_base=base,
                                       search_filter='(objectSid=%s)' % sid,
                                       use_gc=use_gc,
                                       use_resolver=True,
                                       attributes=['sAMAccountName', 'distinguishedName', 'sAMAccountType'])
            for entry in entries:
                # By definition this can be only one entry
                return entry

    def gc_sam_lookup(self, samname):
        """
        This function attempts to resolve the SAM name returned in session enumeration to
        a user/domain combination by querying the Global Catalog.
        SharpHound calls this GC Deconflictation.
        """
        output = []
        entries = self.resolve_samname(samname)
        # If an error occurs, return
        if entries is None:
            return
        if len(entries) > 1:
            # Awww multiple matches, unsure which is the valid one, add them with different weights
            for entry in entries:
                domain = ADUtils.ldap2domain(entry['dn'])
                principal = (u'%s@%s' % (entry['attributes']['sAMAccountName'], domain)).upper()
                # This is consistent with SharpHound
                if domain.lower() == self.addomain.domain.lower():
                    weight = 1
                else:
                    weight = 2
                output.append((principal, weight))
        else:
            if len(entries) == 0:
                # This shouldn't even happen, but let's default to the current domain
                principal = (u'%s@%s' % (samname, self.addomain.domain)).upper()
                output.append((principal, 2))
            else:
                # One match, best case
                entry = entries[0]
                domain = ADUtils.ldap2domain(entry['dn'])
                principal = (u'%s@%s' % (entry['attributes']['sAMAccountName'], domain)).upper()
                output.append((principal, 2))

        return output
