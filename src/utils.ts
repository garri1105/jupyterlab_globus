export const GLOBUS_GROUP = 'jp-Globus-group';
export const GLOBUS_INPUT_GROUP = 'jp-Globus-inputGroup';
export const GLOBUS_INPUT = 'jp-Globus-input';
export const GLOBUS_LIST = 'jp-Globus-list';
export const GLOBUS_LIST_ITEM = 'jp-Globus-listItem';
export const GLOBUS_LIST_ITEM_TITLE = 'jp-Globus-listItemTitle';
export const GLOBUS_DIRECTORY_ITEM = 'jp-Globus-directoryItem';
export const GLOBUS_FETCH_ERROR = 'jp-Globus-fetchError';
export const GLOBUS_HEADER = 'jp-Globus-header';
export const GLOBUS_OPEN = 'jp-Globus-open';
export const GLOBUS_SELECTED = 'jp-Globus-selected';
export const GLOBUS_BORDER = 'jp-Globus-border';
export const GLOBUS_SUCCESS = 'jp-Globus-success';
export const GLOBUS_FAIL = 'jp-Globus-fail';
export const GLOBUS_BUTTON = 'jp-Globus-button';
export const GLOBUS_FLEX_CENTER_SCREEN = 'jp-Globus-flexCenterScreen';

export const LOADING_ICON = document.createElement('div');
LOADING_ICON.className = 'jp-Globus-loader';

export const LOADING_LABEL = document.createElement('div');
LOADING_LABEL.className = 'jp-Globus-loaderLabel';

export const ERROR_IMAGE = document.createElement('div');
ERROR_IMAGE.className = 'jp-Globus-errorImage';

export const BG_IMAGES: any = {
    'dir': 'var(--jp-Globus-icon-folder2)',
    'file': 'var(--jp-Globus-icon-file)',
};

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