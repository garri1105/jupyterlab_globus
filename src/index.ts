import {
    JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
    ICommandPalette
} from '@jupyterlab/apputils';

import {
    GlobusFileBrowser
} from './file-browser/browser';

import {
    GlobusEndpointFinder
} from "./endpoint-finder/finder";

import '../style/index.css';


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
 * Globus Endpoint Finder initialization
 */
const endpointFinderPlugin: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus:endpoint-finder',
    requires: [ICommandPalette, ILayoutRestorer],
    activate: activateEndpointFinder,
    autoStart: true
};

function activateEndpointFinder(app: JupyterLab, palette: ICommandPalette) {
    console.log('JupyterLab extension jupyterlab_globus:endpoint-finder is activated!');

    let widget: GlobusEndpointFinder;

    const command: string = 'endpoint-finder:open';
    app.commands.addCommand(command, {
        label: 'Endpoint Finder',
        execute: () => {
            // Create widget
            if (!widget) {
                widget = new GlobusEndpointFinder();
                widget.update();
            }
            // Add it to screen
            if (!widget.isAttached) {
                app.shell.addToMainArea(widget);
            }
            app.shell.activateById(widget.id);
        }
    });

    palette.addItem({command, category: "Globus"});
}


/**
 * Globus File Browser
 */
const fileBrowserPlugin: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus:file-browser',
    requires: [ICommandPalette, ILayoutRestorer],
    activate: activateFileBrowser,
    autoStart: true
};

function activateFileBrowser(app: JupyterLab) {
    console.log('JupyterLab extension jupyterlab_globus:file-browser is activated!');

    let browser: GlobusFileBrowser = new GlobusFileBrowser();

    app.shell.addToLeftArea(browser, {rank: 101});
}


/**
 * Export the plugins as default.
 */
const plugins: JupyterLabPlugin<any>[] = [
    fileBrowserPlugin,
    endpointFinderPlugin
];
export default plugins;
