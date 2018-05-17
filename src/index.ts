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

const GLOBUSTRANSFERAPIURL: string = 'https://transfer.api.globusonline.org/v0.10';

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

        this.searchButton.addEventListener('click', () => this.searchEndPoints());

        this.node.appendChild(this.searchInput);
        this.node.appendChild(this.searchButton);
        this.node.appendChild(this.searchResults);
    }

    private searchEndPoints() {
        this.searchResults.innerHTML = "";

        fetch(`${GLOBUSTRANSFERAPIURL}/endpoint_search?filter_fulltext=${this.searchInput.value}`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer Ag34bvav1Xg2OYOqm1JmanKmQzx9z59nWM8gpejW9w9yPYyX0qsVCVDEnQW3VEb5PpBjVNBJvbQ8n9fXqyPPqSdl0P'}
        }).then(response => {
            return response.json();
        }).then(data => {
            console.log(data.DATA);
            for (let i = 0; i < data.DATA.length; i++) {
                // Create endPoint tag
                let endPoint: HTMLLIElement = document.createElement('li');
                endPoint.addEventListener('click', () => this.showDirectories(event));
                endPoint.textContent = `${data.DATA[i].display_name}\nOwner: ${data.DATA[i].owner_string}`;

                // Hidden tag containing endPointId
                let endPointId: HTMLParagraphElement = document.createElement('p');
                endPointId.innerText = `${data.DATA[i].id}`;
                endPointId.hidden = true;
                endPoint.appendChild(endPointId);

                this.searchResults.appendChild(endPoint);
            }
        });
    }

    private showDirectories(event: any) {
        let endPointId: HTMLParagraphElement = event.target.lastChild.innerText;

        fetch(`${GLOBUSTRANSFERAPIURL}/endpoint/${endPointId}/autoactivate`, {
            method: 'POST',
            headers: {'Authorization': 'Bearer Ag34bvav1Xg2OYOqm1JmanKmQzx9z59nWM8gpejW9w9yPYyX0qsVCVDEnQW3VEb5PpBjVNBJvbQ8n9fXqyPPqSdl0P'},
            body: ''
        }).then(() => {
            fetch(`${GLOBUSTRANSFERAPIURL}/endpoint/${endPointId}/ls?path=/~/`, {
                method: 'GET',
                headers: {'Authorization': 'Bearer Ag34bvav1Xg2OYOqm1JmanKmQzx9z59nWM8gpejW9w9yPYyX0qsVCVDEnQW3VEb5PpBjVNBJvbQ8n9fXqyPPqSdl0P'},
            }).then(response => {
                return response.json();
            }).then(data => {
                let directoryList: HTMLUListElement;
                if (event.target.childNodes.length > 2) {
                    event.target.removeChild(event.target.childNodes[1]);
                    return;
                }
                else {
                    console.log('first time');
                    directoryList = document.createElement('ul');
                    event.target.insertBefore(directoryList, event.target.childNodes[1]);
                    console.log(event.target);
                }

                console.log(data);
                if (data.DATA) {
                    for (let i = 0; i < data.DATA.length; i++) {
                        // Create endPoint tag
                        let directory: HTMLLIElement = document.createElement('li');
                        directory.textContent = `${data.DATA[i].name}\nType: ${data.DATA[i].type}`;
                        console.log(directoryList);
                        directoryList.appendChild(directory);
                    }
                }
                else {
                    directoryList.innerText = "You don't have permission to see these"
                }


            });
        });
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
