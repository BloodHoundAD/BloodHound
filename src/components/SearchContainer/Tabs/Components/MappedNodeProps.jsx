import React, {useContext, useEffect, useState} from 'react';
import CollapsibleSection from './CollapsibleSection';
import styles from '../NodeData.module.css';
import {Table} from 'react-bootstrap';
import {AppContext} from '../../../../AppContext';

const MappedNodeProps = ({ label, properties, displayMap }) => {
    const [elements, setElements] = useState({});
    const context = useContext(AppContext);

    const createValue = (value) => {
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

    const convertProperty = (propName) => {
        let property = properties[propName];
        let type = typeof property;
        let temp = [];
        let displayProp = displayMap[propName];
        if (type === 'undefined') {
            return temp;
        }
        if (type === 'number') {
            temp.push(
                <td align='left' key={`${propName}a`}>
                    {displayProp}
                </td>
            );
            temp.push(
                <td align='right' key={`${propName}b`}>
                    {createValue(property)}
                </td>
            );
            return temp;
        }
        if (type === 'boolean') {
            temp.push(
                <td align='left' key={`${propName}a`}>
                    {displayProp}
                </td>
            );
            temp.push(
                <td align='right' key={`${propName}b`}>
                    {createValue(property)}
                </td>
            );
            return temp;
        }
        if (type === 'string') {
            temp.push(
                <td align='left' key={`${propName}a`}>
                    {displayProp}
                </td>
            );
            temp.push(
                <td align='right' key={`${propName}b`}>
                    {createValue(property)}
                </td>
            );
            return temp;
        }
        if (Array.isArray(property) && property.length > 0) {
            temp.push(
                <td align='left' key={`${propName}k`}>
                    {displayProp}
                </td>
            );
            let d = '';
            property.forEach((val, index) => {
                d += `${createValue(val)}\n`;
            });
            temp.push(
                <td align='right' style={{ whiteSpace: 'pre' }}>
                    {d}
                </td>
            );
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

    return elements.length === 0 ? null : (
        <CollapsibleSection header={'NODE PROPERTIES'}>
            <div className={styles.itemlist}>
                <Table>
                    <thead></thead>
                    <tbody>
                        {Object.keys(elements).map((key) => {
                            return <tr key={key}>{elements[key]}</tr>;
                        })}
                    </tbody>
                </Table>
            </div>
        </CollapsibleSection>
    );
};

MappedNodeProps.propTypes = {};
export default MappedNodeProps;
