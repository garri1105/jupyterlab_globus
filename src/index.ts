import {
    JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import '../style/index.css';
import {GlobusHome} from "./globus/home";

import {
    IFileBrowserFactory
} from '@jupyterlab/filebrowser';

export const GLOBUS_TRANSFER_API_URL: string = 'https://transfer.api.globusonline.org/v0.10';
export const GLOBUS_AUTH_URL: string = 'https://auth.globus.org/v2/oauth2/authorize';
export const GLOBUS_AUTH_TOKEN: string = 'https://auth.globus.org/v2/oauth2/token';

export const LOADING_ICON = document.createElement('div');
LOADING_ICON.className = 'loader';

export const CHECKMARK_ICON = document.createElement('div');
CHECKMARK_ICON.className = 'checkmark';

export const CROSS_ICON = document.createElement('div');
CROSS_ICON.className = 'cross';

/**
 * Globus plugin
 */
export const globus: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus:file-browser',
    requires: [IFileBrowserFactory],
    activate: activateGlobus,
    autoStart: true
};

function activateGlobus(app: JupyterLab) {
    console.log('JupyterLab extension jupyterlab_globus is activated!');

    let home: GlobusHome = new GlobusHome();

    app.shell.addToLeftArea(home, {rank: 101});
}


/**
 * Export the plugins as default.
 */
export default globus;

