import React from 'react';
import { Highlighter } from 'react-bootstrap-typeahead';
import styles from './SearchRow.module.css';
import clsx from 'clsx';

const SearchRow = ({ item, search }) => {
    let searched;
    if (search.includes(':')) {
        searched = search.split(':')[1];
    } else {
        searched = search;
    }

    let type = item.type;
    let icon = {};

    const selectName = () => {
        if (item.hasOwnProperty("name")){
            return item["name"];
        }else if (item.hasOwnProperty("azname")){
            return item["azname"];
        }else{
            return item["objectid"]
        }
    }

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
        case 'Container':
            icon.className = 'fa fa-box'
            break
        case 'AZUser':
            icon.className = 'fa fa-user';
            break;
        case 'AZGroup':
            icon.className = 'fa fa-users';
            break;
        case 'AZTenant':
            icon.className = 'fa fa-cloud';
            break;
        case 'AZSubscription':
            icon.className = 'fa fa-key';
            break;
        case 'AZResourceGroup':
            icon.className = 'fa fa-cube';
            break;
        case 'AZVM':
            icon.className = 'fa fa-desktop';
            break;
        case 'AZDevice':
            icon.className = 'fa fa-desktop';
            break;
        case 'AZKeyVault':
            icon.className = 'fa fa-lock';
            break;
        case 'AZApp':
            icon.className = 'fa fa-window-restore';
            break;
        case 'AZServicePrincipal':
            icon.className = 'fa fa-robot';
            break;
        default:
            icon.className = 'fa fa-question';
            type = 'Base';
            break;
    }

    icon.style = { color: appStore.highResPalette.iconScheme[type].color };
    icon.className = clsx(icon.className, styles.spacing);

    let name = item.name || item.objectid;

    return (
        <>
            <span>
                <i {...icon} />
            </span>
            <Highlighter matchElement='strong' search={searched}>
                {selectName()}
            </Highlighter>
        </>
    );
};

SearchRow.propTypes = {};
export default SearchRow;
