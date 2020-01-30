import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import NodeALink from './NodeALink';

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
        let query = countQuery;

        sess.run(query, {
            objectid: target,
            domain: domain,
        })
            .then(result => {
                setValue(result.records[0]._fields[0]);
                setReady(true);
            })
            .catch(error => {
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
        <>
            <dt>{property}</dt>
            <dd>
                <NodeALink
                    ready={ready}
                    value={value}
                    click={() => {
                        emitter.emit(
                            'query',
                            graphQuery,
                            { objectid: target },
                            start,
                            end
                        );
                    }}
                />
            </dd>
        </>
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
