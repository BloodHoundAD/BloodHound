import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CollapsibleSection from './CollapsibleSection';

const ExtraNodeProps = ({ label, properties, displayMap }) => {
    const [elements, setElements] = useState([]);

    const createValue = value => {
        let type = typeof value;
        if (type === 'number') {
            return value;
        }

        if (type === 'boolean') {
            return value.toString().toTitleCase();
        }

        if (type === 'string') {
            if (value.startsWith('TMSTMP')) {
                let time = parseInt(value.substring(7));
                return new Date(time * 1000).toUTCString();
            } else {
                return value;
            }
        }
    };

    const convertProperty = propName => {
        let property = properties[propName];
        let type = typeof property;
        let temp = [];

        if (type === 'undefined') {
            return temp;
        }

        if (type === 'number') {
            temp.push(<dt key={`${propName}a`}>{propName}</dt>);
            temp.push(<dd key={`${propName}b`}>{createValue(property)}</dd>);
            return temp;
        }

        if (type === 'boolean') {
            temp.push(<dt key={`${propName}a`}>{propName}</dt>);
            temp.push(<dd key={`${propName}b`}>{createValue(property)}</dd>);
            return temp;
        }

        if (type === 'string') {
            temp.push(<dt key={`${propName}a`}>{propName}</dt>);
            temp.push(<dd key={`${propName}b`}>{createValue(property)}</dd>);
            return temp;
        }

        if (Array.isArray(property) && property.length > 0) {
            temp.push(<dt key={`${propName}k`}>{propName}</dt>);
            property.forEach((val, index) => {
                temp.push(
                    <dd key={`${propName}${index}`}>{createValue(val)}</dd>
                );
            });
            return temp;
        }

        return temp;
    };

    useEffect(() => {
        let temp = [];
        let mapped = Object.keys(displayMap);
        Object.keys(properties)
            .sort()
            .forEach(val => {
                if (!mapped.includes(val)) {
                    temp = temp.concat(convertProperty(val));
                }
            });
        temp = temp.filter(s => s !== undefined);

        setElements(temp);
    }, [label]);

    return elements.length == 0 ? null : (
        <CollapsibleSection header={'Extra Properties'}>
            {elements}
        </CollapsibleSection>
    );
};

ExtraNodeProps.propTypes = {};
export default ExtraNodeProps;
