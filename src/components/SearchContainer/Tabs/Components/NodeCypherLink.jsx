import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import './NodeCypherLink.module.css';

const NodeCypherLink = ({
    property,
    target,
    baseQuery,
    distinct,
    start,
    end,
    domain,
}) => {
    const [ready, setReady] = useState(false);
    const [value, setValue] = useState(0);
    const [session, setSession] = useState(null);

    useEffect(() => {
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
            distinct
                ? 'RETURN COUNT(DISTINCT(n)) AS count'
                : 'RETURN COUNT(n) AS count'
        }`;

        sess.run(query, {
            objectid: target,
            domain: domain,
        })
            .then((result) => {
                setValue(result.records[0].get('count'));
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
    }, [target]);

    return (
        <tr
            style={{ cursor: 'pointer' }}
            onClick={() => {
                emitter.emit(
                    'query',
                    `${baseQuery} RETURN p`,
                    { objectid: target, domain: domain },
                    start,
                    end
                );
            }}
        >
            <td align='left'>{property}</td>
            <td align='right'>{value}</td>
        </tr>
    );
};

NodeCypherLink.propTypes = {
    target: PropTypes.string.isRequired,
    property: PropTypes.string.isRequired,
    baseQuery: PropTypes.string.isRequired,
    distinct: PropTypes.bool,
    start: PropTypes.string,
    end: PropTypes.string,
};

export default NodeCypherLink;
