import {Widget} from '@phosphor/widgets';
import {activateEndpoint, endpointSearch, ERROR_CODES, listDirectoryContents, transferFile} from "../../client";
import {LOADING_LABEL, LOADING_ICON, removeChildren, BG_IMAGES} from "../../utils";
import {IDocumentManager} from '@jupyterlab/docmanager';

export const FILE_MANAGER = 'globus-file-manager';

/**
 * CSS classes
 */
const GLOBUS_FILE_MANAGER = 'jp-Globus-file-manager';
const GLOBUS_INPUT_GROUP = 'jp-Globus-inputGroup';
const GLOBUS_INPUT = 'jp-Globus-input';
const GLOBUS_LIST = 'jp-Globus-list';
const GLOBUS_LIST_ITEM = 'jp-Globus-listItem';
const GLOBUS_LIST_ITEM_TITLE = 'jp-Globus-listItem-title';
const GLOBUS_DIRECTORY_ITEM = 'jp-Globus-directoryItem';
const GLOBUS_PERMISSION_DENIED = 'jp-Globus-permissionDenied';

/**
 * Widget for hosting the Globus File Manager.
 */
export class GlobusFileManager extends Widget {
    private endpointList: HTMLUListElement;
    private directoryList: HTMLUListElement;
    private endpointInput: HTMLInputElement;
    private searchGroup: HTMLDivElement;
    private pathInput: HTMLInputElement;
    private pathGroup: HTMLDivElement;
    private loadedEndpoint: any;

    constructor(manager: IDocumentManager) {
        super();
        this.id = FILE_MANAGER;
        this.addClass(GLOBUS_FILE_MANAGER);

        this.title.label = 'File Manager';
        this.title.closable = true;

        this.endpointList = document.createElement('ul');
        this.endpointList.className = GLOBUS_LIST;
        this.endpointList.style.display = 'none';

        this.directoryList = document.createElement('ul');
        this.directoryList.className = GLOBUS_LIST;
        this.directoryList.style.display = 'none';

        this.endpointInput = document.createElement('input');
        this.endpointInput.className = GLOBUS_INPUT;
        this.endpointInput.placeholder = 'Search endpoints';
        this.endpointInput.addEventListener('keyup', () => {
            this.pathInput.value = '/~';
            this.pathGroup.style.display = 'none';
            this.directoryList.style.display = 'none';
            this.loadCollections();
        });

        this.searchGroup = document.createElement('div');
        this.searchGroup.className = GLOBUS_INPUT_GROUP;
        this.searchGroup.appendChild(this.endpointInput);

        this.pathInput = document.createElement('input');
        this.pathInput.className = GLOBUS_INPUT;
        this.pathInput.value = '/~';
        this.pathInput.addEventListener('change', () => {
            this.retrieveDirectories();
        });

        this.pathGroup = document.createElement('div');
        this.pathGroup.className = GLOBUS_INPUT_GROUP;
        this.pathGroup.appendChild(this.pathInput);
        this.pathGroup.style.display = 'none';

        this.node.appendChild(this.searchGroup);
        this.node.appendChild(this.endpointList);
        this.node.appendChild(this.pathGroup);
        this.node.appendChild(this.directoryList);
    }

    private loadCollections() {
        if (this.endpointInput.value.length > 0) {
            this.endpointList.style.display = 'block';

            LOADING_LABEL.textContent = 'Loading Collections...';
            this.endpointList.appendChild(LOADING_ICON);
            this.endpointList.appendChild(LOADING_LABEL);
            this.fetchEndpoints();
        }
        else {
            this.endpointList.style.display = 'none';
        }
    }

    private fetchEndpoints() {
        return new Promise<void>((resolve) => {
            endpointSearch(this.endpointInput.value).then(data => {
                removeChildren(this.endpointList);
                this.displayEndpoints(data);
                resolve();
            });
        });
    }

    private fetchDirectories() {
        // Activate endpoint fetch -> "autoactivate"
        return new Promise<void>((resolve) => {
            activateEndpoint(this.loadedEndpoint.id).then(() => {
                listDirectoryContents(this.loadedEndpoint.id, this.pathInput.value).then(data => {
                    this.displayDirectories(data);
                    resolve();
                });
            });
        });
    }

    private displayDirectories(data: any) {
        // Add directories if they were retrieved (user has permission)
        if (data.DATA) {
            for (let i = 0; i < data.DATA.length; i++) {
                let directoryData = data.DATA[i];

                let directory: HTMLLIElement = document.createElement('li');
                directory.className = `${GLOBUS_LIST_ITEM} ${GLOBUS_DIRECTORY_ITEM}`;
                directory.style.backgroundImage = BG_IMAGES[directoryData.type];

                // TODO Add last date modified with moment.js
                let name: HTMLDivElement = document.createElement('div');
                let size: HTMLDivElement = document.createElement('div');

                name.textContent = directoryData.name;
                name.className = GLOBUS_LIST_ITEM_TITLE;

                size.textContent = `${directoryData.size} B`;

                directory.appendChild(name);
                directory.appendChild(size);

                directory.addEventListener("click", this.directoryClicked.bind(this, directoryData));
                this.directoryList.appendChild(directory);
            }
        }
        else {
            let permissionDenied: HTMLLIElement = document.createElement('li');
            permissionDenied.className = `${GLOBUS_LIST_ITEM} ${GLOBUS_PERMISSION_DENIED}`;
            permissionDenied.textContent = ERROR_CODES[data.code];
            this.directoryList.appendChild(permissionDenied);
        }
    }

    private displayEndpoints(data: any) {
        for (let i = 0; i < data.DATA.length; i++) {
            let endPointData = data.DATA[i];

            let endPoint: HTMLLIElement = document.createElement('li');
            endPoint.className = GLOBUS_LIST_ITEM;

            let name: HTMLDivElement = document.createElement('div');
            let owner: HTMLDivElement = document.createElement('div');

            name.textContent = endPointData.display_name;
            name.className = GLOBUS_LIST_ITEM_TITLE;

            owner.textContent = endPointData.owner_string;

            endPoint.appendChild(name);
            endPoint.appendChild(owner);

            endPoint.addEventListener("click", this.endPointClicked.bind(this, endPointData));
            this.endpointList.appendChild(endPoint);
        }
    }

    private async endPointClicked(endPointData: any) {
        this.loadedEndpoint = endPointData;
        this.endpointInput.value = endPointData.display_name;
        this.endpointList.style.display = 'none';
        this.pathGroup.style.display = 'block';
        this.directoryList.style.display = 'block';

        this.retrieveDirectories();
    }

    private async directoryClicked(directoryData: any) {
        switch (directoryData.type) {
            case 'dir': {
                this.pathInput.value += `/${directoryData.name}`;
                this.retrieveDirectories();
                break;
            }
            case 'file': {
                console.log(directoryData);
                transferFile(directoryData.name, this.loadedEndpoint.id,
                    this.pathInput.value,
                    'ddb59af0-6d04-11e5-ba46-22000b92c6ec');
                console.log('transferring');
            }
        }
    }

    private retrieveDirectories() {
        removeChildren(this.directoryList);
        LOADING_LABEL.textContent = 'Retrieving Directories...';
        this.directoryList.appendChild(LOADING_ICON);
        this.directoryList.appendChild(LOADING_LABEL);
        this.fetchDirectories().then(() => {
            this.directoryList.removeChild(LOADING_ICON);
            this.directoryList.removeChild(LOADING_LABEL);
        });
    }
}