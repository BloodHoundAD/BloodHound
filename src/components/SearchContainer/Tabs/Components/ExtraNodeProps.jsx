import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CollapsibleSection from './CollapsibleSection';
import styles from './ExtraNodeProps.module.css'
import { Table } from 'react-bootstrap';

const ExtraNodeProps = ({ label, properties, displayMap }) => {
    const [elements, setElements] = useState([]);

    const blacklist = ['highvalue', 'hasspn', 'primarygroupid'];

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
        let temp = {};
        Object.keys(displayMap).forEach((val, index) => {
            let c = convertProperty(val);
            if (c.length !== 0) temp[val] = c;
        });
        setElements(temp);
    }, [label]);

    return elements.length == 0 ? null : (
        <CollapsibleSection header={'EXTRA PROPERTIES'}>
            <div className={styles.itemlist}>
                <Table bordered={false} hover responsive>
                    <tbody>
                        {Object.keys(elements).map((key) => {
                            return (
                                <tr key={key}>
                                    <td>{elements[key]}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        </CollapsibleSection>
    );
};

ExtraNodeProps.propTypes = {};
export default ExtraNodeProps;
