import {JupyterLab, JupyterLabPlugin} from '@jupyterlab/application';
import '../style/index.css';
import {GlobusHome} from "./globus/home";
import {GlobusWidgetManager} from "./globus/widget_manager";

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

