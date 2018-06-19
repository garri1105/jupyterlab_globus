import {ERROR_CODES} from "./globus/client";

export const GLOBUS_GROUP = 'jp-Globus-group';
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
export const GLOBUS_SELECTED = 'jp-Globus-selected';
export const GLOBUS_BORDER = 'jp-Globus-border';
export const GLOBUS_SUCCESS = 'jp-Globus-success';
export const GLOBUS_FAIL = 'jp-Globus-fail';
export const GLOBUS_BUTTON = 'jp-Globus-button';
export const GLOBUS_DISPLAY_FLEX = 'jp-Globus-displayFlex';
export const GLOBUS_MENU_BTN = 'jp-Globus-menuBtn';
export const GLOBUS_MENU = 'jp-Globus-menu';

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
    if (element.classList.contains(GLOBUS_GROUP)) {
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

export function createDescriptionElement(dList: HTMLDListElement, term: string, details: string) {
    let dt: HTMLElement = document.createElement('dt');
    dt.className = `${GLOBUS_DESCRIPTION_TERM}`;
    dt.textContent = term;

    let dd: HTMLElement = document.createElement('dd');
    dd.className = `${GLOBUS_DESCRIPTION_DETAILS}`;
    dd.textContent = details;

    dList.appendChild(dt);
    dList.appendChild(dd);
}