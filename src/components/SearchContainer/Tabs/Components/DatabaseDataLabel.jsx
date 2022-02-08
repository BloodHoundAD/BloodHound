import React, {useEffect, useState} from 'react';

const DatabaseDataLabel = ({ label, query, index }) => {
    const [ready, setReady] = useState(false);
    const [value, setValue] = useState(0);

    useEffect(() => {
        let sess = driver.session();

        setReady(false);

        sess.run(query)
            .then((result) => {
                setValue(result.records[0].get('count'));
                setReady(true);
                sess.close();
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
    }, [index]);

    return (
        <tr>
            <td>{label}</td>
            <td align='right'>{ready ? value : 'Refreshing'}</td>
        </tr>
    );
};

DatabaseDataLabel.propTypes = {};
export default DatabaseDataLabel;
