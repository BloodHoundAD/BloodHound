import React, { useEffect } from 'react';
import Highlight from 'react-highlighter';

const SearchRow = ({ item, search }) => {
    let searched;
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

    let name = item.name;

    return (
        <div>
            <Highlight matchElement='strong' search={searched}>
                {name}
            </Highlight>
            <i {...icon} />
        </div>
    );
};

SearchRow.propTypes = {};
export default SearchRow;
