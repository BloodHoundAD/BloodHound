import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const NodeCypherLabel = ({ property, target, baseQuery, domain }) => {
    const [ready, setReady] = useState(false);
    const [value, setValue] = useState(0);
    const [session, setSession] = useState(null);

    useEffect(() => {
        if (domain === null) {
            return;
        }

        if (session !== null) {
            session.close();
        }

        if (target === '') {
            return;
        }

        let sess = driver.session();

        setSession(sess);
        setReady(false);
        let query = `${baseQuery} RETURN COUNT(n) AS count`;

        sess.run(query, {
            objectid: target,
            domain: domain,
        })
            .then(r => {
                sess.close();
                setSession(null);
                let v = r.records[0].get('count');
                setValue(v.toLocaleString());
                setReady(true);
            })
            .catch(error => {
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
    }, [target, domain]);

    return ready ? (
        <>
            <dt>{property}</dt>
            <dd>{value}</dd>
        </>
    ) : (
        <>
            <dt>{property}</dt>
            <dd>
                <div className='spinner'>
                    <div className='bounce1' />
                    <div className='bounce2' />
                    <div className='bounce3' />
                </div>
            </dd>
        </>
    );
};

NodeCypherLabel.propTypes = {};
export default NodeCypherLabel;
