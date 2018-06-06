import {ILayoutRestorer, JupyterLab, JupyterLabPlugin} from '@jupyterlab/application';
import '../style/index.css';
import {GlobusHome} from "./globus/home";
import {IDocumentManager} from '@jupyterlab/docmanager';
import {IFileBrowserFactory} from "@jupyterlab/filebrowser";

/**
 * Globus plugin
 */
export const globus: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus',
    autoStart: true,
    requires: [IDocumentManager, ILayoutRestorer, IFileBrowserFactory],
    activate: activateGlobus
};

function activateGlobus(app: JupyterLab, manager: IDocumentManager, restorer: ILayoutRestorer, factory: IFileBrowserFactory) {
    console.log('JupyterLab extension jupyterlab_globus is activated!');

    let home: GlobusHome = new GlobusHome(manager, factory);
    restorer.add(home, 'globus-home');
    app.shell.addToLeftArea(home, { rank: 101 });
}

/**
 * Export the plugin as default.
 */
export default globus;
