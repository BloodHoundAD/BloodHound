import React, { useEffect, useState } from 'react';
import styles from './NodeEditorRow.module.css';

const NodeEditorRow = ({
    attributeName,
    val,
    deleteHandler,
    updateHandler,
}) => {
    const [valType, setValType] = useState('object');
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [internalValue, setInternalValue] = useState(null);
    const [tempValue, setTempValue] = useState(null);

    useEffect(() => {
        let type = typeof val;
        if (type === 'object') {
            type = 'array';
        }

        setValType(type);
        setInternalValue(val);
    }, [val]);

    const saveDelete = () => {
        setDeleting(false);
        deleteHandler(attributeName);
    };

    const cancelDelete = () => {
        setDeleting(false);
    };

    const enableDelete = () => {
        setDeleting(true);
    };

    const changeValue = () => {
        setInternalValue(!internalValue);
    };

    const cancelEdit = () => {
        setInternalValue(val);
        setEditing(false);
    };

    const saveEdit = () => {
        setEditing(false);
        setInternalValue(tempValue);
        let temp = internalValue;
        if (valType === 'number') {
            temp = parseInt(internalValue);
        }

        updateHandler(attributeName, temp);
    };

    const enableEdit = () => {
        setEditing(true);
    };

    const handleChangeString = (e) => {
        setTempValue(e.target.innerText);
    };

    const handleChangeNumber = (e) => {
        setTempValue(e.target.innerText);
    };

    const handleChangeTextArea = (e) => {
        setTempValue(e.target.innerText);
    };

    const getValueColumn = () => {
        if (internalValue === null) {
            return <div />;
        }

        if (valType === 'boolean') {
            return (
                <input
                    className='checkbox'
                    type='checkbox'
                    checked={internalValue}
                    disabled={!editing}
                    onChange={changeValue}
                    contentEditable={editing}
                />
            );
        } else if (valType === 'string') {
            return (
                <div
                    onInput={handleChangeString}
                    suppressContentEditableWarning={true}
                    className={styles.nodeEditString}
                    contentEditable={editing}
                >
                    {internalValue}
                </div>
            );
        } else if (valType === 'number') {
            return (
                <div
                    onInput={handleChangeNumber}
                    suppressContentEditableWarning={true}
                    className={styles.nodeEditNumber}
                    contentEditable={editing}
                >
                    {internalValue}
                </div>
            );
        } else if (valType === 'object' || valType === 'array') {
            let value = internalValue.join('\n');
            return (
                <textarea
                    disabled={!editing}
                    className={styles.nodeEditArray}
                    defaultValue={value}
                    onInput={handleChangeTextArea}
                />
            );
        }
    };

    const getDeleteColumn = () => {
        if (deleting) {
            return (
                <div>
                    <button type='button'>
                        <span className='fa fa-check' onClick={saveDelete} />
                    </button>
                    <button type='button'>
                        <span className='fa fa-close' onClick={cancelDelete} />
                    </button>
                </div>
            );
        } else {
            return (
                <button type='button'>
                    <span className='fa fa-trash' onClick={enableDelete} />
                </button>
            );
        }
    };

    const getEditColumn = () => {
        if (editing) {
            return (
                <div>
                    <button type='button'>
                        <span className='fa fa-check' onClick={saveEdit} />
                    </button>
                    <button type='button'>
                        <span className='fa fa-times' onClick={cancelEdit} />
                    </button>
                </div>
            );
        } else {
            return (
                <button type='button'>
                    <span className='fa fa-edit' onClick={enableEdit} />
                </button>
            );
        }
    };

    return (
        <tr className={styles.nodeEditRow}>
            <td align='center'>{getDeleteColumn()}</td>
            <td align='center'>{getEditColumn()}</td>
            <td align='center'>{attributeName}</td>
            <td align='center'>{getValueColumn()}</td>
        </tr>
    );
};

export default NodeEditorRow;
