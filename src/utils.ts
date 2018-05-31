export const LOADING_ICON = document.createElement('div');
LOADING_ICON.className = 'jp-Globus-loader';

export const LOADING_LABEL = document.createElement('span');
LOADING_LABEL.className = 'jp-Globus-loaderLabel';

export const CHECKMARK_ICON = document.createElement('div');
CHECKMARK_ICON.className = 'jp-Globus-checkmark';

export const CROSS_ICON = document.createElement('div');
CROSS_ICON.className = 'jp-Globus-cross';

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
