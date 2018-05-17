import {
    JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
    ICommandPalette, InstanceTracker
} from '@jupyterlab/apputils';

import {
    JSONExt
} from '@phosphor/coreutils';

import {
    Widget
} from '@phosphor/widgets';

import '../style/index.css';

class GlobusExplorerWidget extends Widget {
    searchResults: HTMLUListElement;
    searchInput: HTMLInputElement;
    searchButton: HTMLButtonElement;

    constructor() {
        super();

        this.id = 'globus-explorer_jupyterlab';
        this.title.label = 'GlobusExplorer';
        this.title.closable = true;

        this.searchResults = document.createElement('ul');
        this.searchInput = document.createElement('input');
        this.searchInput.placeholder = 'Search endpoints';

        this.searchButton = document.createElement('button');
        this.searchButton.textContent = 'Search';

        this.node.appendChild(this.searchInput);
        this.node.appendChild(this.searchButton);
        this.node.appendChild(this.searchResults);
    }
}

function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer) {
    console.log('JupyterLab extension jupyterlab_globus-explorer is activated!');

    // Declare a widget variable
    let widget: GlobusExplorerWidget;

    // Add an application command
    const command: string = 'globus-explorer:open';
    app.commands.addCommand(command, {
        label: 'Globus explorer',
        execute: () => {
            if (!widget) {
                // Create a new widget if one does not exist
                widget = new GlobusExplorerWidget();
                widget.update();
            }
            if (!tracker.has(widget)) {
                // Track the state of the widget for later restoration
                tracker.add(widget);
            }
            if (!widget.isAttached) {
                // Attach the widget to the main work area if it's not there
                app.shell.addToMainArea(widget);
            } else {
                // Refresh the comic in the widget
                widget.update();
            }
            // Activate the widget
            app.shell.activateById(widget.id);
        }
    });

    // Add the command to the palette.
    palette.addItem({ command, category: 'My extension' });

    // Track and restore the widget state
    let tracker = new InstanceTracker<Widget>({ namespace: 'globus-explorer' });
    restorer.restore(tracker, {
        command,
        args: () => JSONExt.emptyObject,
        name: () => 'globus-explorer'
    });
}

const extension: JupyterLabPlugin<void> = {
    id: 'jupyterlab_globus-explorer',
    autoStart: true,
    requires: [ICommandPalette, ILayoutRestorer],
    activate: activate
};

export default extension;
