import {ERROR_CODES} from "./globus/api/client";
import {GlobusFileItem} from "./globus/api/models";
import * as moment from "moment";
import * as $ from 'jquery';

export const GLOBUS_PARENT_GROUP = 'jp-Globus-group';
export const GLOBUS_INPUT = 'jp-Globus-input';
export const GLOBUS_DESCRIPTION_TERM = 'jp-Globus-descriptionTerm';
export const GLOBUS_DESCRIPTION_DETAILS = 'jp-Globus-descriptionDetails';
export const GLOBUS_LIST = 'jp-Globus-list';
export const GLOBUS_LIST_ITEM = 'jp-Globus-listItem';
export const GLOBUS_LIST_ITEM_TITLE = 'jp-Globus-listItemTitle';
export const GLOBUS_LIST_ITEM_SUBTITLE = 'jp-Globus-listItemSubtitle';
export const GLOBUS_FETCH_ERROR = 'jp-Globus-fetchError';
export const GLOBUS_HEADER = 'jp-Globus-header';
export const GLOBUS_OPEN = 'jp-Globus-open';
export const GLOBUS_BORDER = 'jp-Globus-border';
export const GLOBUS_SUCCESS = 'jp-Globus-success';
export const GLOBUS_FAIL = 'jp-Globus-fail';
export const GLOBUS_BUTTON = 'jp-Globus-button';
export const GLOBUS_DISPLAY_FLEX = 'jp-Globus-displayFlex';
export const GLOBUS_MENU_BTN = 'jp-Globus-menuBtn';
export const GLOBUS_MENU = 'jp-Globus-menu';
export const GLOBUS_SELECTED = 'jp-Globus-selected';
export const GLOBUS_DISABLED = 'jp-Globus-disabled';
export const GLOBUS_ACTIVE = 'jp-Globus-active';

export const LOADING_ICON = document.createElement('div');
LOADING_ICON.className = 'jp-Globus-loader';

export const LOADING_LABEL = document.createElement('div');
LOADING_LABEL.className = 'jp-Globus-loaderLabel';

export const ERROR_IMAGE = document.createElement('div');
ERROR_IMAGE.className = 'jp-Globus-errorImage';

export function removeChildren(node: HTMLElement) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

export function queryParams(params: any) {
    return Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
}

export function getGlobusParentGroup(element: HTMLElement): HTMLElement {
    if (element.classList.contains(GLOBUS_PARENT_GROUP)) {
        return element;
    }
    else {
        return getGlobusParentGroup(element.parentElement);
    }
}

export function getGlobusElement(group: HTMLElement, className: string): HTMLElement {
    return group.getElementsByClassName(className)[0] as HTMLElement;
}

export function displayError(e: any, node: HTMLElement) {
    console.log(e);
    let errorCode = document.createElement('div');
    errorCode.className = GLOBUS_FETCH_ERROR;
    console.log(e.code);
    let code = ERROR_CODES[e.code];
    if (code) {
        errorCode.textContent = code;
    }
    else if (e.customMessage){
        errorCode.textContent = e.customMessage;
    }
    else {
        errorCode.textContent = e.code;
    }
    node.appendChild(errorCode);
}

export function createDescriptionElement(dList: HTMLDListElement, term: string, details: any) {
    let dt: HTMLElement = document.createElement('dt');
    dt.className = `${GLOBUS_DESCRIPTION_TERM}`;
    dt.textContent = term;

    let dd: HTMLElement = document.createElement('dd');
    dd.className = `${GLOBUS_DESCRIPTION_DETAILS}`;
    dd.textContent = details;

    dList.appendChild(dt);
    dList.appendChild(dd);
}

// Adapted from https://math.stackexchange.com/questions/247444/explain-convertion-algorithm-from-bytes-to-kb-mb-gb
export function convertBytes(size: number): string {
    if (!size) {
        return '0 B';
    }

    let base = Math.log(size)/Math.log(1000);

    let suffix = ['B', 'KB', 'MB', 'GB', 'TB'];

    return `${Math.round(Math.pow(1000, base - Math.floor(base)) * 100) / 100} ${suffix[Math.floor(base)]}`;
}

// Adapted from https://www.w3schools.com/howto/howto_js_sort_list.asp
export function sortList(list: HTMLUListElement, sortBy: string | 'name' | 'date' | 'size' | 'type') {
    let i, switching, b, shouldSwitch, dir, switchcount = 0;

    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc";
    // Make a loop that will continue until no switching has been done:
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        b = list.getElementsByTagName("LI");
        // Loop through all list-items:
        for (i = 0; i < (b.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Check if the next item should switch place with the current item,
            based on the sorting direction (asc or desc): */
            let fileData: GlobusFileItem = $.data(b[i], 'data');
            let fileData2: GlobusFileItem = $.data(b[i+1], 'data');

            // If used instead of switch because of the break statements
            if (sortBy === 'name') {
                if (dir === "asc" && fileData.name.toLowerCase() > fileData2.name.toLowerCase()) {
                    /* If next item is alphabetically lower than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch = true;
                    break;
                } else if (dir === "desc" && fileData.name.toLowerCase() < fileData2.name.toLowerCase()) {
                    /* If next item is alphabetically higher than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch= true;
                    break;
                }
            }
            else if (sortBy === 'date') {
                if (dir === "asc" && moment(fileData.last_modified).diff(fileData2.last_modified) < 0) {
                    /* If next item is alphabetically lower than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch = true;
                    break;
                } else if (dir === "desc" &&  moment(fileData.last_modified).diff(fileData2.last_modified) > 0) {
                    /* If next item is alphabetically higher than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch = true;
                    break;
                }
            }
            else if (sortBy === 'size') {
                if (dir === "asc" && fileData.size > fileData2.size) {
                    /* If next item is alphabetically lower than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch = true;
                    break;
                } else if (dir === "desc" && fileData.size < fileData2.size) {
                    /* If next item is alphabetically higher than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch= true;
                    break;
                }
            }
            else if (sortBy === 'type') {
                if (dir === "asc" && fileData.type.toLowerCase() > fileData2.type.toLowerCase()) {
                    /* If next item is alphabetically lower than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch = true;
                    break;
                } else if (dir === "desc" && fileData.type.toLowerCase() < fileData2.type.toLowerCase()) {
                    /* If next item is alphabetically higher than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch= true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
            and mark that a switch has been done: */
            b[i].parentNode.insertBefore(b[i + 1], b[i]);
            switching = true;
            // Each time a switch is done, increase switchcount by 1:
            switchcount ++;
        } else {
            /* If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again. */
            if (!switchcount && dir === "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}