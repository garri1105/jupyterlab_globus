import {ILayoutRestorer, JupyterLab, JupyterLabPlugin} from '@jupyterlab/application';
import '../style/index.css';
import {GlobusHome} from "./globus/home";
import {IDocumentManager} from '@jupyterlab/docmanager';
import {ICommandPalette} from "@jupyterlab/apputils";

/**
 * Globus plugin
 */
export const globus: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus',
    autoStart: true,
    requires: [IDocumentManager, ILayoutRestorer, ICommandPalette],
    activate: activateGlobus
};

function activateGlobus(app: JupyterLab, manager: IDocumentManager, restorer: ILayoutRestorer) {
    console.log('JupyterLab extension jupyterlab_globus is activated!');

    let home: GlobusHome = new GlobusHome();
    console.log(manager.openOrReveal('C:\\Users\\Juan David Garrido\\Documents\\hi.txt'));
    console.log(manager.openOrReveal('C:\\Users\\Juan David Garrido\\Documents\\UPP.pdf'));
    restorer.add(home, 'globus-home');
    app.shell.addToLeftArea(home, { rank: 101 });
}

/**
 * Export the plugins as default.
 */
export default globus;
