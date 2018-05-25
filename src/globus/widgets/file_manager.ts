import {Widget} from '@phosphor/widgets';
import {activateEndpoint, endpointSearch, ERROR_CODES, listDirectoryContents} from "../../client";
import {LOADING_LABEL, LOADING_ICON, removeChildren, BG_IMAGES} from "../../utils";
import {GLOBUS_BUTTON} from "../home";

export const FILE_MANAGER = 'globus-file-manager';

/**
 * CSS classes
 */
// TODO move these to more global files
// TODO create GLOBUS_GROUP if necessary
const GLOBUS_FILE_MANAGER = 'jp-Globus-file-manager';
const GLOBUS_INPUT_GROUP = 'jp-Globus-inputGroup';
const GLOBUS_INPUT = 'jp-Globus-input';
const GLOBUS_LIST = 'jp-Globus-list';
const GLOBUS_LIST_ITEM = 'jp-Globus-listItem';
const GLOBUS_LIST_ITEM_TITLE = 'jp-Globus-listItemTitle';
const GLOBUS_DIRECTORY_ITEM = 'jp-Globus-directoryItem';
const GLOBUS_PERMISSION_DENIED = 'jp-Globus-permissionDenied';
const GLOBUS_HEADER = 'jp-Globus-header';
const GLOBUS_SELECTED = 'jp-Globus-selected';

const GLOBUS_ENDPOINT_GROUP = 'jp-Globus-endpointGroup';
const GLOBUS_ENDPOINT_INPUT = 'jp-Globus-endpointInput';
const GLOBUS_ENDPOINT_LIST = 'jp-Globus-endpointList';
const GLOBUS_DIR_GROUP = 'jp-Globus-dirPathGroup';
const GLOBUS_DIR_PATH_INPUT = 'jp-Globus-dirPathInput';
const GLOBUS_DIR_LIST = 'jp-Globus-dirList';
const GLOBUS_START_TRANSFER_BUTTON = 'jp-Globus-startTransferBtn';


/**
 * Widget for hosting the Globus File Manager.
 */
export class GlobusFileManager extends Widget {
    private searchGroup: HTMLDivElement;
    private sourceGroup: HTMLDivElement;
    private destinationGroup: HTMLDivElement;

    constructor() {
        super();
        this.id = FILE_MANAGER;
        this.addClass(GLOBUS_FILE_MANAGER);

        this.title.label = 'File Manager';
        this.title.closable = true;

        this.createHTMLElements();
    }

    private loadCollections(endpointInput: HTMLInputElement, endpointList: HTMLUListElement) {
        if (endpointInput.value.length > 0) {
            endpointList.style.display = 'block';

            LOADING_LABEL.textContent = 'Loading Collections...';
            endpointList.appendChild(LOADING_ICON);
            endpointList.appendChild(LOADING_LABEL);
            this.fetchEndpoints(endpointInput, endpointList);
        }
        else {
            endpointList.style.display = 'none';
        }
    }

    private fetchEndpoints(endpointInput: HTMLInputElement, endpointList: HTMLUListElement) {
        return new Promise<void>((resolve) => {
            endpointSearch(endpointInput.value).then(data => {
                removeChildren(endpointList);
                this.displayEndpoints(data, endpointList);
                resolve();
            });
        });
    }

    private fetchDirectories(dirPathInput: HTMLInputElement, dirList: HTMLUListElement) {
        let globusGroup = dirList.parentElement.parentElement.parentElement;
        let endpoint: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_SELECTED)[0] as HTMLDivElement);
        // Activate endpoint fetch -> "autoactivate"
        return new Promise<void>((resolve) => {
            activateEndpoint(endpoint.id).then(() => {
                listDirectoryContents(endpoint.id, dirPathInput.value).then(data => {
                    this.displayDirectories(data, dirList);
                    resolve();
                });
            });
        });
    }

    private displayDirectories(data: any, dirList: HTMLUListElement) {
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

                directory.addEventListener("click", this.directoryClicked.bind(this, directoryData, dirList));
                dirList.appendChild(directory);
            }
        }
        else {
            let permissionDenied: HTMLLIElement = document.createElement('li');
            permissionDenied.className = `${GLOBUS_LIST_ITEM} ${GLOBUS_PERMISSION_DENIED}`;
            permissionDenied.textContent = ERROR_CODES[data.code];
            dirList.appendChild(permissionDenied);
        }
    }

    private displayEndpoints(data: any, endpointList: HTMLUListElement) {
        for (let i = 0; i < data.DATA.length; i++) {
            let endPointData = data.DATA[i];

            let endPoint: HTMLLIElement = document.createElement('li');
            endPoint.className = GLOBUS_LIST_ITEM;
            endPoint.id = endPointData.id;
            endPoint.title = endPointData.display_name;

            let name: HTMLDivElement = document.createElement('div');
            name.textContent = endPointData.display_name;
            name.className = GLOBUS_LIST_ITEM_TITLE;

            let owner: HTMLDivElement = document.createElement('div');
            owner.textContent = endPointData.owner_string;

            endPoint.appendChild(name);
            endPoint.appendChild(owner);

            endPoint.addEventListener("click", this.endPointClicked.bind(this));
            endpointList.appendChild(endPoint);
        }
    }

    private async endPointClicked(e: any) {
        //TODO make a utililty function for these
        let globusGroup = e.currentTarget.parentElement.parentElement.parentElement;
        console.log(globusGroup);
        let endpointList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_ENDPOINT_LIST)[0] as HTMLUListElement);
        let endpointInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_ENDPOINT_INPUT)[0] as HTMLInputElement);
        let directoryGroup: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_GROUP)[0] as HTMLDivElement);
        let dirList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_LIST)[0] as HTMLUListElement);
        let dirPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);

        e.currentTarget.classList.toggle(GLOBUS_SELECTED);
        endpointInput.value = e.currentTarget.title;
        endpointList.style.display = 'none';
        directoryGroup.style.display = 'block';

        this.retrieveDirectories(dirPathInput, dirList);
    }

    private async directoryClicked(directoryData: any, dirList: HTMLUListElement) {
        let globusGroup = dirList.parentElement.parentElement;
        let dirPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);

        switch (directoryData.type) {
            case 'dir': {
                dirPathInput.value += `${directoryData.name}/`;
                this.retrieveDirectories(dirPathInput, dirList);
                break;
            }
            case 'file': {
                dirPathInput.value += `${directoryData.name}`;
                this.sourceGroup.appendChild(this.searchGroup);
                this.sourceGroup.style.display = 'block';
                this.destinationGroup.style.display = 'block';
            }
        }
    }

    private retrieveDirectories(dirPathInput: HTMLInputElement, dirList: HTMLUListElement) {
        removeChildren(dirList);
        LOADING_LABEL.textContent = 'Retrieving Directories...';
        dirList.appendChild(LOADING_ICON);
        dirList.appendChild(LOADING_LABEL);
        this.fetchDirectories(dirPathInput, dirList).then(() => {
            dirList.removeChild(LOADING_ICON);
            dirList.removeChild(LOADING_LABEL);
        });
    }

    private createHTMLElements() {
        /* -------------<Endpoint search>------------- */

        // Search Input. Shown
        let endpointInput = document.createElement('input');
        endpointInput.className = `${GLOBUS_INPUT} ${GLOBUS_ENDPOINT_INPUT}`;
        endpointInput.placeholder = 'Search collections';

        // Endpoint List. Hidden
        let endpointList: HTMLUListElement = document.createElement('ul');
        endpointList.className = `${GLOBUS_LIST} ${GLOBUS_ENDPOINT_LIST}`;
        endpointList.style.display = 'none';

        // Search Input container for adding extra elements
        let endpointGroup = document.createElement('div');
        endpointGroup.className = `${GLOBUS_INPUT_GROUP} ${GLOBUS_ENDPOINT_GROUP}`;
        endpointGroup.appendChild(endpointInput);
        endpointGroup.appendChild(endpointList);

        /* -------------</Endpoint search>------------- */



        /* -------------<DirPath search>------------- */

        // DirPath Input. Hidden
        let dirPathInput = document.createElement('input');
        dirPathInput.className = `${GLOBUS_INPUT} ${GLOBUS_DIR_PATH_INPUT}`;
        dirPathInput.value = '/~/';

        // Directory List. Hidden
        let dirList: HTMLUListElement = document.createElement('ul');
        dirList.className = `${GLOBUS_LIST} ${GLOBUS_DIR_LIST}`;

        // Path Input container for adding extra elements
        let directoryGroup = document.createElement('div');
        directoryGroup.className = `${GLOBUS_INPUT_GROUP} ${GLOBUS_DIR_GROUP}`;
        directoryGroup.appendChild(dirPathInput);
        directoryGroup.appendChild(dirList);
        directoryGroup.style.display = 'none';

        /* -------------</DirPath search>------------- */


        // Add both groups to searchGroup
        this.searchGroup = document.createElement('div');
        this.searchGroup.appendChild(endpointGroup);
        this.searchGroup.appendChild(directoryGroup);
        this.searchGroup.addEventListener('keyup', this.onKeyUpEndpointInputHandler.bind(this));
        this.searchGroup.addEventListener('change', this.onChangeDirPathInputHandler.bind(this));

        // Clone searchGroup into sourceGroup and add header
        let sourceHeader = document.createElement('div');
        sourceHeader.textContent = 'Source';
        sourceHeader.className = GLOBUS_HEADER;
        this.sourceGroup = document.createElement('div');
        this.sourceGroup.appendChild(sourceHeader);
        this.sourceGroup.style.display = 'none';

        // Clone searchGroup into destinationHeader and add header
        let destinationHeader = document.createElement('div');
        destinationHeader.textContent = 'Destination';
        destinationHeader.className = GLOBUS_HEADER;
        let startTransfer = document.createElement('button');
        startTransfer.textContent = 'Start Transfer';
        startTransfer.className = `jp-mod-styled jp-mod-accept ${GLOBUS_BUTTON} ${GLOBUS_START_TRANSFER_BUTTON}`;
        let searchGroupClone = this.searchGroup.cloneNode(true);
        this.destinationGroup = document.createElement('div');
        this.destinationGroup.appendChild(destinationHeader);
        this.destinationGroup.appendChild(searchGroupClone);
        this.destinationGroup.appendChild(startTransfer);
        this.destinationGroup.addEventListener('keyup', this.onKeyUpEndpointInputHandler.bind(this));
        this.destinationGroup.addEventListener('change', this.onChangeDirPathInputHandler.bind(this));
        this.destinationGroup.addEventListener('click', this.onClickStartTransferHandler.bind(this));
        this.destinationGroup.style.display = 'none';

        this.node.appendChild(this.searchGroup);
        this.node.appendChild(this.sourceGroup);
        this.node.appendChild(this.destinationGroup);
    }

    private onKeyUpEndpointInputHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_ENDPOINT_INPUT}`)) {
            let globusGroup = e.target.parentElement.parentElement;
            let dirPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);
            let directoryGroup: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_GROUP)[0] as HTMLDivElement);
            let endpointList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_ENDPOINT_LIST)[0] as HTMLUListElement);

            dirPathInput.value = '/~/';
            directoryGroup.style.display = 'none';
            this.loadCollections(e.target, endpointList);
        }
    }

    private onChangeDirPathInputHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_DIR_PATH_INPUT}`)) {
            let globusGroup = e.target.parentElement.parentElement;
            let dirList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_LIST)[0] as HTMLUListElement);
            this.retrieveDirectories(e.target, dirList);
        }
    }

    private onClickStartTransferHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_START_TRANSFER_BUTTON}`)) {
            let sourcePathInput: HTMLInputElement = (this.sourceGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);
            let sourceEndpoint: HTMLLIElement = (this.sourceGroup.getElementsByClassName(GLOBUS_SELECTED)[0] as HTMLLIElement);
            let destinationPathInput: HTMLInputElement = (this.destinationGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);
            let destinationEndpoint: HTMLLIElement = (this.destinationGroup.getElementsByClassName(GLOBUS_SELECTED)[0] as HTMLLIElement);
            let splits = sourcePathInput.value.split('/');
            let fileName = splits[splits.length - 1];
            sourcePathInput.value.slice(-fileName.length);
            console.log(fileName);
            console.log(sourceEndpoint.id);
            console.log(sourcePathInput.value);
            console.log(destinationEndpoint.id);
            console.log(destinationPathInput.value);

            // transferFile(
            //     fileName,
            //     sourceEndpoint.id,
            //     sourcePathInput.value,
            //     destinationEndpoint.id,
            //     destinationPathInput.value);
            console.log('transferring');
        }
    }


}