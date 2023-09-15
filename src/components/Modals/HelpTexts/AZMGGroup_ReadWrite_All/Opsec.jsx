import React from 'react';

const Opsec = () => {
    return (
        <>
            <p>
                This edge is created when a Service Principal has been 
                granted the Group.ReadWrite.All edge. The edge is 
                not abusable, but is used during post-processing to create 
                abusable edges.
            </p>
        </>
    );
};

export default Opsec;
