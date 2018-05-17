import {
    JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
    ICommandPalette
} from '@jupyterlab/apputils';

import {
    GlobusExplorerFileBrowser
} from './file-browser/browser';

import {
    GlobusExplorerEndpointFinder
} from "./endpoint-finder/finder";

import '../style/index.css';


function activateEndpointFinder(app: JupyterLab, palette: ICommandPalette) {
    console.log('JupyterLab extension jupyterlab_globus-explorer:endpoint-finder is activated!');

    // Declare a widget variable
    let widget: GlobusExplorerEndpointFinder;

    // Add an application command
    const command: string = 'endpoint-finder:open';
    app.commands.addCommand(command, {
        label: 'Endpoint Finder',
        execute: () => {
            if (!widget) {
                widget = new GlobusExplorerEndpointFinder();
                widget.update();
            }
            if (!widget.isAttached) {
                app.shell.addToMainArea(widget);
            }
            app.shell.activateById(widget.id);
        }
    });

    palette.addItem({command, category: "Globus Explorer"});
}

function activateFileBrowser(app: JupyterLab) {
    console.log('JupyterLab extension jupyterlab_globus-explorer:file-browser is activated!');

    let browser: GlobusExplorerFileBrowser = new GlobusExplorerFileBrowser();

    app.shell.addToLeftArea(browser, {rank: 101});
}

const fileBrowserPlugin: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus-explorer:file-browser',
    requires: [ICommandPalette, ILayoutRestorer],
    activate: activateFileBrowser,
    autoStart: true
};

const endpointFinderPlugin: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus-explorer:endpoint-finder',
    requires: [ICommandPalette, ILayoutRestorer],
    activate: activateEndpointFinder,
    autoStart: true
};

const plugins: JupyterLabPlugin<any>[] = [
    fileBrowserPlugin,
    endpointFinderPlugin
];
export default plugins;
