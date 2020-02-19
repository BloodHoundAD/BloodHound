import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CollapsibleSection from './CollapsibleSection';

const MappedNodeProps = ({ label, properties, displayMap }) => {
    const [elements, setElements] = useState([]);

    const createValue = value => {
        let type = typeof value;
        if (type === 'number') {
            if (value === -1) {
                return 'Never';
            }

            let currentDate = Math.round(new Date().getTime() / 1000);

            //315536400 = January 1st, 1980. Seems like a safe bet
            if (value > 315536400 && value < currentDate) {
                return new Date(value * 1000).toUTCString();
            } else {
                return value.toLocaleString();
            }
        }

        if (type === 'boolean') {
            return value.toString().toTitleCase();
        }

        return value;
    };

    const convertProperty = propName => {
        let property = properties[propName];
        let type = typeof property;
        let temp = [];
        let displayProp = displayMap[propName];

        if (type === 'undefined') {
            return temp;
        }

        if (type === 'number') {
            temp.push(<dt key={`${propName}a`}>{displayProp}</dt>);
            temp.push(<dd key={`${propName}b`}>{createValue(property)}</dd>);
            return temp;
        }

        if (type === 'boolean') {
            temp.push(<dt key={`${propName}a`}>{displayProp}</dt>);
            temp.push(<dd key={`${propName}b`}>{createValue(property)}</dd>);
            return temp;
        }

        if (type === 'string') {
            temp.push(<dt key={`${propName}a`}>{displayProp}</dt>);
            temp.push(<dd key={`${propName}b`}>{createValue(property)}</dd>);
            return temp;
        }

        if (Array.isArray(property) && property.length > 0) {
            temp.push(<dt key={`${propName}k`}>{displayProp}</dt>);
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
        Object.keys(displayMap).forEach((val, index) => {
            temp = temp.concat(convertProperty(val));
        });
        temp = temp.filter(s => s !== undefined);

        setElements(temp);
    }, [label]);

    return elements.length == 0 ? null : (
        <CollapsibleSection header={'Node Properties'}>
            {elements}
        </CollapsibleSection>
    );
};

MappedNodeProps.propTypes = {};
export default MappedNodeProps;
