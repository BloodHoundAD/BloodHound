import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CollapsibleSection from './CollapsibleSection';
import styles from './MappedNodeProps.module.css'
import { Table } from 'react-bootstrap';

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
        // let property = properties[propName];
        // let type = typeof property;
        // let temp = [];
        // let displayProp = displayMap[propName];

        // if (type === 'undefined') {
        //     return temp;
        // }

        // if (type === 'number') {
        //     temp.push('<tr><td>');
        //     temp.push(<dt key={`${propName}a`}>{displayProp}</dt>);
        //     temp.push(<dd key={`${propName}b`}>{createValue(property)}</dd>);
        //     temp.push('</td></tr>');
        //     return temp;
        // }

        // if (type === 'boolean') {
        //     temp.push('<tr><td>');
        //     temp.push(<dt key={`${propName}a`}>{displayProp}</dt>);
        //     temp.push(<dd key={`${propName}b`}>{createValue(property)}</dd>);
        //     temp.push('</td></tr>');
        //     return temp;
        // }

        // if (type === 'string') {
        //     let t;
        //     t += (<dt key={`${propName}a`}>{displayProp}</dt>);
        //     t += (<dd key={`${propName}b`}>{createValue(property)}</dd>);
        //     temp.push(<tr><td>{t}</td></tr>);
        //     return temp;
        // }

        // if (Array.isArray(property) && property.length > 0) {
        //     temp.push('<tr><td>');
        //     temp.push(<dt key={`${propName}k`}>{displayProp}</dt>);
        //     property.forEach((val, index) => {
        //         temp.push(
        //             <dd key={`${propName}${index}`}>{createValue(val)}</dd>
        //         );
        //     });
        //     temp.push('</td></tr>');
        //     return temp;
        // }

        // return temp;
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
            <div className={styles.itemlist}>
                <Table striped borderless hover responsive>
                    <tbody>
                    {elements.map((o, i) => {
                        return (
                            <tr><td>{o}</td></tr>
                        )
                    })}
                    </tbody>
                </Table>
            </div>
        </CollapsibleSection>
        // <CollapsibleSection header={'NODE PROPERTIES'}>
        //     <div className={styles.itemlist}>
        //         <Table className="table table-hover table-striped table-borderless table-responsive">
        //             <thead></thead>
        //             <tbody className='searchable'>
        //                 {
        //                     Object.keys(elements).map(
        //                         function (key) {
        //                             var d = elements[key];
        //                             return (<tr><td><dt>{key}</dt><dd>{d}</dd></td></tr>);
        //                         }
        //                     )
        //                 }
        //             </tbody>
        //         </Table>
        //     </div>
        // </CollapsibleSection>
    );
};

MappedNodeProps.propTypes = {};
export default MappedNodeProps;
