import {ILayoutRestorer, JupyterLab, JupyterLabPlugin} from '@jupyterlab/application';
import '../style/index.css';
import {GlobusHome} from "./globus/home";
import {IDocumentManager} from '@jupyterlab/docmanager';
import {ICommandPalette, InstanceTracker} from "@jupyterlab/apputils";
import {Widget} from '@phosphor/widgets';
import {JSONExt} from '@phosphor/coreutils';

/**
 * Globus plugin
 */
export const globus: JupyterLabPlugin<void> = {
    id: '@jupyterlab/globus',
    autoStart: true,
    requires: [IDocumentManager, ILayoutRestorer, ICommandPalette],
    activate: activateGlobus
};

function activateGlobus(app: JupyterLab, manager: IDocumentManager, restorer: ILayoutRestorer, palette: ICommandPalette) {
    console.log('JupyterLab extension jupyterlab_globus is activated!');

    getGCPEndpoint(app, manager);

    let home: GlobusHome = new GlobusHome(manager);
    app.shell.addToLeftArea(home, {rank: 101});

    const command: string = 'globus:open';
    app.commands.addCommand(command, {
        label: 'Open Globus',
        execute: () => {
            if (!home) {
                home = new GlobusHome(manager);
            }
            if (!tracker.has(home)) {
                tracker.add(home);
            }
            if (!home.isAttached) {
                app.shell.addToLeftArea(home, {rank: 101});
            } else {
                home.update();
            }
            app.shell.activateById(home.id);
        }
    });

    palette.addItem({ command, category: 'Globus' });

    // Track and restore the widget state
    let tracker = new InstanceTracker<Widget>({ namespace: 'globus' });
    restorer.restore(tracker, {
        command,
        args: () => JSONExt.emptyObject,
        name: () => 'globus'
    });
}

function getGCPEndpoint(app: JupyterLab, manager: IDocumentManager) {
    let OSName = "Unknown";
    if (window.navigator.userAgent.indexOf("Windows") != -1) OSName="Windows";
    if (window.navigator.userAgent.indexOf("Mac")     != -1) OSName="Mac/iOS";
    if (window.navigator.userAgent.indexOf("X11")     != -1) OSName="UNIX";
    if (window.navigator.userAgent.indexOf("Linux")   != -1) OSName="Linux";

    if (OSName === 'Windows') {
        console.log(manager.openOrReveal('C:\\Users\\Juan David Garrido\\Documents\\hi.txt'));
        app.shell.addToMainArea(manager.openOrReveal('C:\\Users\\Juan David Garrido\\Documents\\GISForm.pdf'));
    }
}

/**
 * Export the plugins as default.
 */
export default globus;

