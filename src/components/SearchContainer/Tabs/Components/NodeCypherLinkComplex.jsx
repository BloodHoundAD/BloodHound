import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';

const NodeCypherLinkComplex = ({
    property,
    target,
    countQuery,
    graphQuery,
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
        sess.run(countQuery, {
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
                    graphQuery,
                    { objectid: target },
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

NodeCypherLinkComplex.propTypes = {
    target: PropTypes.string.isRequired,
    property: PropTypes.string.isRequired,
    countQuery: PropTypes.string.isRequired,
    graphQuery: PropTypes.string.isRequired,
    start: PropTypes.string,
    end: PropTypes.string,
};

export default NodeCypherLinkComplex;
