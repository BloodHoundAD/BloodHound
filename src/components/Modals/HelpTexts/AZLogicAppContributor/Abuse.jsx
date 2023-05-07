import React from 'react';

const Abuse = () => {
    return (
        <>
            <p>
                Currently you need access to the portal GUI to execute this abuse.
            </p>

            <p>
                The abuse involves adding or modifying an existing logic app to coerce 
                the logic app into sending a JWT for its managed identity service principal
                to a web server you control.
            </p>

            <p>
                You can see a full walkthrough for executing that abuse in this blog post:
            </p>

            <p>
                <a href='https://medium.com/p/52b29354fc54'>
                    Andy Robbins - Managed Identity Attack Paths, Part 2: Logic Apps
                </a>
            </p>

        </>
    );
};

export default Abuse;
