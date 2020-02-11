import React from 'react';
import {Highlighter} from 'react-bootstrap-typeahead';

const SearchRow = (item, props) => {
    let searched;
    let search = props.text;
    if (search.includes(':')) {
        searched = search.split(':')[1];
    } else {
        searched = search;
    }
    let type = item.type;
    let icon = {};
    icon.style = { marginLeft: '10px' };

    switch (type) {
        case 'Group':
            icon.className = 'fa fa-users';
            break;
        case 'User':
            icon.className = 'fa fa-user';
            break;
        case 'Computer':
            icon.className = 'fa fa-desktop';
            break;
        case 'Domain':
            icon.className = 'fa fa-globe';
            break;
        case 'GPO':
            icon.className = 'fa fa-list';
            break;
        case 'OU':
            icon.className = 'fa fa-sitemap';
            break;
    }

    let name = item.name || item.objectid;

    return (
        <>
            <span>
                <i {...icon} />
            </span>
            <Highlighter matchElement='strong' search={searched}>
                {name}
            </Highlighter>
        </>
    );
};

SearchRow.propTypes = {};
export default SearchRow;
