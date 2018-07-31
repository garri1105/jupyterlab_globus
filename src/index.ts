import {ILayoutRestorer, JupyterLab, JupyterLabPlugin} from '@jupyterlab/application';
import '../style/index.css';
import {GlobusHome} from "./globus/home";
import {IDocumentManager} from '@jupyterlab/docmanager';
import {IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {GlobusWidgetManager} from "./globus/widget_manager";

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
    // Writes and executes a command inside of the default terminal in JupyterLab.
    // console.log(app.info);
    // app.serviceManager.terminals.startNew().then(session => {
    //     let request = `http POST ${window.location.href}/static body="$(printenv)" 'Authorization:token ${ServerConnection.defaultSettings.token}'\r`;
    //     session.send({ type: 'stdin', content: [request]});
    // });

    let widgetManager: GlobusWidgetManager = new GlobusWidgetManager(app, manager, factory);
    let home: GlobusHome = new GlobusHome(widgetManager);
    restorer.add(home, 'globus-home');
    app.shell.addToLeftArea(home, { rank: 101 });
}

/**
 * Export the plugin as default.
 */
export default globus;
