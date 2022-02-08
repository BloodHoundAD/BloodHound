import React, { useEffect, useState } from 'react';
import Icon from '../../../Icon';
import styles from './NodePlayCypherLink.module.css';
import NodeALink from './NodeALink';

const NodePlayCypherLink = ({
    property,
    target,
    baseQuery,
    distinct,
    start,
    end,
    domain,
}) => {
    const [played, setPlayed] = useState(false);
    const [ready, setReady] = useState(false);
    const [value, setValue] = useState(0);
    const [session, setSession] = useState(null);

    useEffect(() => {
        setPlayed(false);
        setReady(false);
    }, [target]);

    const onClick = () => {
        if (!played) {
            startQuery();
        } else {
            emitter.emit(
                'query',
                `${baseQuery} RETURN p`,
                { objectid: target, domain: domain },
                start,
                end
            );
        }
    };

    const startQuery = () => {
        setPlayed(true);

        if (session !== null) {
            session.close();
        }

        if (target === '') {
            return;
        }

        let sess = driver.session();

        setSession(sess);
        setReady(false);
        let query = `${baseQuery} ${
            distinct ? 'RETURN COUNT(DISTINCT(n))' : 'RETURN COUNT(n)'
        }`;

        sess.run(query, {
            objectid: target,
            domain: domain,
        })
            .then((result) => {
                setValue(result.records[0].get(0));
                setReady(true);
            })
            .catch((error) => {
                if (
                    !error.message.includes(
                        'The transaction has been terminated'
                    )
                ) {
                    console.log(target);
                    console.log(baseQuery);
                    console.log(error);
                }
            });
    };

    return (
        <tr
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            <td align='left'>
                {property}
            </td>
            <td align='right'>
                {!played && <Icon glyph='play' extraClass={styles.icon} />}
                {played && <NodeALink ready={ready} value={value} />}
            </td>
        </tr>
    );
};

NodePlayCypherLink.propTypes = {};
export default NodePlayCypherLink;
