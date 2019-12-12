import posed from 'react-pose';

const Container = posed.div({
    visible: {
        opacity: 1,
        transition: { duration: 250 },
        applyAtStart: { display: 'block' },
    },
    hidden: {
        opacity: 0,
        transition: { duration: 250 },
        applyAtEnd: { display: 'none' },
    },
});

export default Container;
