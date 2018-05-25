import {JupyterLab, JupyterLabPlugin} from '@jupyterlab/application';
import '../style/index.css';
import {GlobusHome} from "./globus/home";
import {GlobusWidgetManager} from "./globus/widget_manager";

export const GLOBUS_TRANSFER_API_URL: string = 'https://transfer.api.globusonline.org/v0.10';
export const GLOBUS_AUTH_URL: string = 'https://auth.globus.org/v2/oauth2/authorize';
export const GLOBUS_AUTH_TOKEN: string = 'https://auth.globus.org/v2/oauth2/token';

/**
 * Globus plugin
 */
export const globus: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus:file-browser',
    requires: [],
    activate: activateGlobus,
    autoStart: true
};

function activateGlobus(app: JupyterLab) {
    console.log('JupyterLab extension jupyterlab_globus is activated!');

    let widgetManager: GlobusWidgetManager = new GlobusWidgetManager();
    let home: GlobusHome = new GlobusHome(widgetManager);
    app.shell.addToLeftArea(home, {rank: 101});
}


/**
 * Export the plugins as default.
 */
export default globus;

