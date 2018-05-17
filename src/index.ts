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


function activateEndpointFinder(app: JupyterLab, palette: ICommandPalette) {
    console.log('JupyterLab extension jupyterlab_globus:endpoint-finder is activated!');

    // Declare a widget variable
    let widget: GlobusEndpointFinder;

    // Add an application command
    const command: string = 'endpoint-finder:open';
    app.commands.addCommand(command, {
        label: 'Endpoint Finder',
        execute: () => {
            if (!widget) {
                widget = new GlobusEndpointFinder();
                widget.update();
            }
            if (!widget.isAttached) {
                app.shell.addToMainArea(widget);
            }
            app.shell.activateById(widget.id);
        }
    });

    palette.addItem({command, category: "Globus "});
}

function activateFileBrowser(app: JupyterLab) {
    console.log('JupyterLab extension jupyterlab_globus:file-browser is activated!');

    let browser: GlobusFileBrowser = new GlobusFileBrowser();

    app.shell.addToLeftArea(browser, {rank: 101});
}

const fileBrowserPlugin: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus:file-browser',
    requires: [ICommandPalette, ILayoutRestorer],
    activate: activateFileBrowser,
    autoStart: true
};

const endpointFinderPlugin: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus:endpoint-finder',
    requires: [ICommandPalette, ILayoutRestorer],
    activate: activateEndpointFinder,
    autoStart: true
};

const plugins: JupyterLabPlugin<any>[] = [
    fileBrowserPlugin,
    endpointFinderPlugin
];
export default plugins;
