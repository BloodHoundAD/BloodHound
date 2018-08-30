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

from impacket.structure import Structure
from struct import unpack


# LDAP SID structure - from impackets SAMR_RPC_SID, except the SubAuthority is LE here
class LDAP_SID_IDENTIFIER_AUTHORITY(Structure):
    structure = (
        ('Value', '6s'),
    )



class LDAP_SID(Structure):
    structure = (
        ('Revision', '<B'),
        ('SubAuthorityCount', '<B'),
        ('IdentifierAuthority', ':', LDAP_SID_IDENTIFIER_AUTHORITY),
        ('SubLen', '_-SubAuthority', 'self["SubAuthorityCount"]*4'),
        ('SubAuthority', ':'),
    )

    def formatCanonical(self):
        ans = 'S-%d-%d' % (self['Revision'], ord(self['IdentifierAuthority']['Value'][5]))
        for i in range(self['SubAuthorityCount']):
            ans += '-%d' % (unpack('<L', self['SubAuthority'][i*4:i*4+4])[0])
        return ans
