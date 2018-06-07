import {Widget} from '@phosphor/widgets';
import {activateEndpoint, endpointSearch, ERROR_CODES, listDirectoryContents, transferFile} from "../client";
import {LOADING_LABEL, LOADING_ICON, removeChildren, BG_IMAGES} from "../../utils";
import {GLOBUS_BUTTON} from "../home";
import Timer = NodeJS.Timer;
import {GCP_ENDPOINT_ID} from "./globus_connect_personal";

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
const GLOBUS_OPEN = 'jp-Globus-open';
const GLOBUS_SELECTED = 'jp-Globus-selected';
const GLOBUS_BORDER = 'jp-Globus-border';

const GLOBUS_ENDPOINT_GROUP = 'jp-Globus-endpointGroup';
const GLOBUS_ENDPOINT_INPUT = 'jp-Globus-endpointInput';
const GLOBUS_ENDPOINT_LIST = 'jp-Globus-endpointList';
const GLOBUS_DIR_GROUP = 'jp-Globus-dirPathGroup';
const GLOBUS_DIR_PATH_INPUT = 'jp-Globus-dirPathInput';
const GLOBUS_DIR_LIST = 'jp-Globus-dirList';
const GLOBUS_DIR_MENU = 'jp-Globus-dirMenu';
const GLOBUS_MENU_BTN = 'jp-Globus-menuBtn';
const GLOBUS_START_TRANSFER_BUTTON = 'jp-Globus-startTransferBtn';
const GLOBUS_MENU_SELECT = 'jp-Globus-menuSelect';
const GLOBUS_MENU_UP_FOLDER = 'jp-Globus-menuUpFolder';
const GLOBUS_MENU_REFRESH = 'jp-Globus-menuRefresh';
const GLOBUS_MENU_TRANSFER = 'jp-Globus-menuTransfer';
const GLOBUS_SEARCH_INFO = 'jp-Globus-searchInfo';
const GLOBUS_SEARCH_GROUP = 'jp-Globus-searchGroup';
const GLOBUS_TRANSFER_RESULT = 'jp-Globus-transferResult';


/**
 * Widget for hosting the Globus File Manager.
 */
export class GlobusFileManager extends Widget {
    private searchGroup: HTMLDivElement;
    private sourceGroup: HTMLDivElement;
    private destinationGroup: HTMLDivElement;
    private timeout: Timer;

    constructor() {
        super();
        this.id = FILE_MANAGER;
        this.addClass(GLOBUS_FILE_MANAGER);

        this.title.label = 'File Manager';

        this.createHTMLElements();
    }

    private fetchEndpoints(query: string, endpointList: HTMLUListElement) {
        return new Promise<void>((resolve) => {
            endpointSearch(query).then(data => {
                removeChildren(endpointList);
                this.displayEndpoints(data, endpointList);
                resolve();
            });
        });
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

            endPoint.addEventListener("click", this.endpointClicked.bind(this));
            endpointList.appendChild(endPoint);
        }
    }

    private retrieveEndpoints(endpointInput: HTMLInputElement, endpointList: HTMLUListElement) {
        if (endpointInput.value.length > 0) {
            endpointList.style.display = 'block';

            LOADING_LABEL.textContent = 'Loading Collections...';
            endpointList.appendChild(LOADING_ICON);
            endpointList.appendChild(LOADING_LABEL);
            this.fetchEndpoints(endpointInput.value, endpointList);
        }
        else {
            endpointList.style.display = 'none';
        }
    }

    private endpointClicked(e: any) {
        let endpoint: HTMLLIElement = (e.currentTarget as HTMLLIElement);
        let endpointList: HTMLUListElement = (endpoint.parentElement as HTMLUListElement);

        //TODO make a utililty function for these
        let globusGroup = endpoint.parentElement.parentElement.parentElement;
        let endpointInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_ENDPOINT_INPUT)[0] as HTMLInputElement);
        let directoryGroup: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_GROUP)[0] as HTMLDivElement);
        let dirList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_LIST)[0] as HTMLUListElement);
        let dirPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);

        endpoint.classList.toggle(GLOBUS_OPEN);
        endpointInput.value = endpoint.title;
        endpointList.style.display = 'none';
        directoryGroup.style.display = 'block';

        this.retrieveDirectories(dirPathInput, dirList);
    }

    private fetchDirectories(dirPath: string, dirList: HTMLUListElement) {
        let globusGroup = dirList.parentElement.parentElement.parentElement;
        let endpoint: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_OPEN)[0] as HTMLDivElement);
        // Activate endpoint fetch -> "autoactivate"
        return new Promise<void>((resolve) => {
            activateEndpoint(endpoint.id).then(() => {
                listDirectoryContents(endpoint.id, dirPath).then(data => {
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
                directory.title = directoryData.name;
                directory.type = directoryData.type;

                // TODO Add last date modified with moment.js
                let name: HTMLDivElement = document.createElement('div');
                let size: HTMLDivElement = document.createElement('div');

                name.textContent = directoryData.name;
                name.className = GLOBUS_LIST_ITEM_TITLE;

                size.textContent = `${directoryData.size} B`;

                directory.appendChild(name);
                directory.appendChild(size);

                directory.addEventListener("click", this.directoryClicked.bind(this));
                directory.addEventListener("dblclick", this.directoryDblClicked.bind(this));
                dirList.appendChild(directory);
            }
        }
        else {
            let errorCode: HTMLLIElement = document.createElement('li');
            errorCode.className = `${GLOBUS_LIST_ITEM} ${GLOBUS_PERMISSION_DENIED}`;
            console.log(data.code);
            let code = ERROR_CODES[data.code];
            if (code) {
                errorCode.textContent = code;
            }
            else {
                errorCode.textContent = 'Unknown Error';
            }
            dirList.appendChild(errorCode);
        }
    }

    private retrieveDirectories(dirPathInput: HTMLInputElement, dirList: HTMLUListElement) {
        if (dirPathInput.value.length === 0) {
            dirPathInput.value = '/~/';
        }
        removeChildren(dirList);
        LOADING_LABEL.textContent = 'Retrieving Directories...';
        dirList.appendChild(LOADING_ICON);
        dirList.appendChild(LOADING_LABEL);
        this.fetchDirectories(dirPathInput.value, dirList).then(() => {
            dirList.removeChild(LOADING_ICON);
            dirList.removeChild(LOADING_LABEL);
        });
    }

    private directoryClicked(e: any) {
        let globusGroup = e.currentTarget.parentElement.parentElement.parentElement.parentElement;
        let directory = (e.currentTarget as HTMLLIElement);
        let itemList =  directory.parentElement.children;
        if (!e.ctrlKey) {
            for (let i = 0; i < itemList.length; i++) {
                if (itemList[i].classList.contains(GLOBUS_SELECTED)) {
                    itemList[i].classList.remove(GLOBUS_SELECTED);
                }
            }
        }
        // TODO shiftkey

        directory.classList.toggle(GLOBUS_SELECTED);

        // TODO Use Observable instead
        let menuSelect: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_MENU_SELECT)[0] as HTMLDivElement);
        globusGroup.getElementsByClassName(GLOBUS_SELECTED).length === 0 ?
            menuSelect.textContent = 'select all' :
            menuSelect.textContent = 'select none';
    }

    private directoryDblClicked(e: any) {
        let directory: HTMLLIElement = (e.currentTarget as HTMLLIElement);
        let dirList: HTMLUListElement = (directory.parentElement as HTMLUListElement);

        let globusGroup = directory.parentElement.parentElement.parentElement;
        let dirPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);

        switch (directory.type) {
            case 'dir': {
                dirPathInput.value += `${directory.title}/`;
                this.retrieveDirectories(dirPathInput, dirList);
                break;
            }
            case 'file': {
                directory.classList.toggle(GLOBUS_SELECTED);
                break;
            }
        }
    }

    private createHTMLElements() {
        /* -------------<Endpoint search>------------- */

        // Search Input. Shown
        let endpointInput: HTMLInputElement = document.createElement('input');
        endpointInput.className = `${GLOBUS_INPUT} ${GLOBUS_ENDPOINT_INPUT} ${GLOBUS_BORDER}`;
        endpointInput.placeholder = 'Search collections';

        // Endpoint List. Hidden
        let endpointList: HTMLUListElement = document.createElement('ul');
        endpointList.className = `${GLOBUS_LIST} ${GLOBUS_ENDPOINT_LIST} ${GLOBUS_BORDER}`;
        endpointList.style.display = 'none';

        // Search Input container for adding extra elements
        let endpointGroup: HTMLDivElement = document.createElement('div');
        endpointGroup.className = `${GLOBUS_INPUT_GROUP} ${GLOBUS_ENDPOINT_GROUP} ${GLOBUS_BORDER}`;
        endpointGroup.appendChild(endpointInput);
        endpointGroup.appendChild(endpointList);

        /* -------------</Endpoint search>------------- */



        /* -------------<DirPath search>------------- */

        // DirPath Input. Hidden
        let dirPathInput: HTMLInputElement = document.createElement('input');
        dirPathInput.className = `${GLOBUS_INPUT} ${GLOBUS_DIR_PATH_INPUT} ${GLOBUS_BORDER}`;
        dirPathInput.value = '/~/';

        let menuSelect: HTMLDivElement = document.createElement('div');
        menuSelect.className = `${GLOBUS_MENU_BTN} ${GLOBUS_MENU_SELECT}`;
        menuSelect.textContent = 'select all';
        let menuUpFolder: HTMLDivElement = document.createElement('div');
        menuUpFolder.className = `${GLOBUS_MENU_BTN} ${GLOBUS_MENU_UP_FOLDER}`;
        menuUpFolder.textContent = '';
        let menuRefresh: HTMLDivElement = document.createElement('div');
        menuRefresh.className = `${GLOBUS_MENU_BTN} ${GLOBUS_MENU_REFRESH}`;
        menuRefresh.textContent = '';
        let menuTransfer: HTMLDivElement = document.createElement('div');
        menuTransfer.className = `${GLOBUS_MENU_BTN} ${GLOBUS_MENU_TRANSFER}`;
        menuTransfer.textContent = 'transfer';

        let dirMenu = document.createElement('div');
        dirMenu.className = `${GLOBUS_DIR_MENU} ${GLOBUS_BORDER}`;
        dirMenu.appendChild(menuSelect);
        dirMenu.appendChild(menuUpFolder);
        dirMenu.appendChild(menuRefresh);
        dirMenu.appendChild(menuTransfer);

        let dirList: HTMLUListElement = document.createElement('ul');
        dirList.className = `${GLOBUS_LIST} ${GLOBUS_DIR_LIST} ${GLOBUS_BORDER}`;

        // Path Input container for adding extra elements
        let directoryGroup = document.createElement('div');
        directoryGroup.className = `${GLOBUS_INPUT_GROUP} ${GLOBUS_DIR_GROUP} ${GLOBUS_BORDER}`;
        directoryGroup.appendChild(dirPathInput);
        directoryGroup.appendChild(dirMenu);
        directoryGroup.appendChild(dirList);
        directoryGroup.style.display = 'none';

        /* -------------</DirPath search>------------- */


        // Add both groups to searchGroup
        this.searchGroup = document.createElement('div');
        this.searchGroup.className = GLOBUS_SEARCH_GROUP;
        this.searchGroup.appendChild(endpointGroup);
        this.searchGroup.appendChild(directoryGroup);
        this.searchGroup.addEventListener('keyup', this.onKeyUpEndpointInputHandler.bind(this));
        this.searchGroup.addEventListener('change', this.onChangeDirPathInputHandler.bind(this));
        this.searchGroup.addEventListener('click', this.onClickDirMenuButtonHandler.bind(this));
        this.searchGroup.style.display = 'block';

        let sourceHeader = document.createElement('div');
        sourceHeader.textContent = 'Source';
        sourceHeader.className = `${GLOBUS_HEADER} ${GLOBUS_BORDER}`;
        sourceHeader.addEventListener('click', this.onClickHeaderHandler.bind(this));
        let sourceInfo = document.createElement('div');
        sourceInfo.className = `${GLOBUS_SEARCH_INFO} ${GLOBUS_BORDER}`;
        sourceInfo.style.display = 'none';
        this.sourceGroup = document.createElement('div');
        this.sourceGroup.appendChild(sourceHeader);
        this.sourceGroup.appendChild(sourceInfo);
        this.sourceGroup.style.display = 'none';

        let destinationHeader = document.createElement('div');
        destinationHeader.textContent = 'Destination';
        destinationHeader.className = `${GLOBUS_HEADER} ${GLOBUS_BORDER}`;
        destinationHeader.addEventListener('click', this.onClickHeaderHandler.bind(this));
        let destinationInfo = document.createElement('div');
        destinationInfo.className = `${GLOBUS_SEARCH_INFO} ${GLOBUS_BORDER}`;
        destinationInfo.style.display = 'none';
        let transferResult = document.createElement('div');
        transferResult.className = `${GLOBUS_TRANSFER_RESULT} ${GLOBUS_BORDER}`;
        transferResult.style.display = 'none';
        transferResult.onclick = () => transferResult.style.display = 'none';
        let startTransfer = document.createElement('button');
        startTransfer.textContent = 'Start Transfer';
        startTransfer.className = `jp-mod-styled jp-mod-accept ${GLOBUS_BUTTON} ${GLOBUS_START_TRANSFER_BUTTON}`;
        let searchGroupClone = this.searchGroup.cloneNode(true);
        this.destinationGroup = document.createElement('div');
        this.destinationGroup.appendChild(destinationHeader);
        this.destinationGroup.appendChild(destinationInfo);
        this.destinationGroup.appendChild(searchGroupClone);
        this.destinationGroup.appendChild(transferResult);
        this.destinationGroup.appendChild(startTransfer);
        this.destinationGroup.addEventListener('click', this.onClickStartTransferHandler.bind(this));
        this.destinationGroup.addEventListener('keyup', this.onKeyUpEndpointInputHandler.bind(this));
        this.destinationGroup.addEventListener('change', this.onChangeDirPathInputHandler.bind(this));
        this.destinationGroup.addEventListener('click', this.onClickDirMenuButtonHandler.bind(this));
        this.destinationGroup.style.display = 'none';

        this.node.appendChild(this.searchGroup);
        this.node.appendChild(this.sourceGroup);
        this.node.appendChild(this.destinationGroup);
    }

    // TODO handle quick successive calls as only one call. Timeout kinda solves it but it still feels buggy sometimes
    private onKeyUpEndpointInputHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_ENDPOINT_INPUT}`)) {
            let globusGroup = e.target.parentElement.parentElement;
            let dirPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);
            let directoryGroup: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_GROUP)[0] as HTMLDivElement);
            let endpointList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_ENDPOINT_LIST)[0] as HTMLUListElement);

            dirPathInput.value = '/~/';
            directoryGroup.style.display = 'none';

            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.retrieveEndpoints(e.target, endpointList), 300);
        }
    }

    private onChangeDirPathInputHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_DIR_PATH_INPUT}`)) {
            let globusGroup = e.target.parentElement.parentElement.parentElement;
            let dirList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_LIST)[0] as HTMLUListElement);
            this.retrieveDirectories(e.target, dirList);
        }
    }

    private onClickDirMenuButtonHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_MENU_BTN}`)) {
            let globusGroup = e.target.parentElement.parentElement.parentElement.parentElement;
            let dirPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);
            let dirList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_LIST)[0] as HTMLUListElement);
            let header: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_HEADER)[0] as HTMLDivElement);

            if (e.target.matches(`.${GLOBUS_MENU_SELECT}`)) {
                let itemList =  dirList.children;
                if (e.target.textContent === 'select all') {
                    for (let i = 0; i < itemList.length; i++) {
                        if (!itemList[i].classList.contains(GLOBUS_SELECTED)) {
                            itemList[i].classList.add(GLOBUS_SELECTED);
                        }
                    }
                    e.target.textContent = 'select none';
                }
                else {
                    for (let i = 0; i < itemList.length; i++) {
                        if (itemList[i].classList.contains(GLOBUS_SELECTED)) {
                            itemList[i].classList.remove(GLOBUS_SELECTED);
                        }
                    }
                    e.target.textContent = 'select all';
                }
            }
            else if (e.target.matches(`.${GLOBUS_MENU_UP_FOLDER}`)) {
                let splits = dirPathInput.value.split('/');
                let fileName = splits[splits.length - 2];
                dirPathInput.value = dirPathInput.value.slice(0, -(fileName.length+1));
                this.retrieveDirectories(dirPathInput, dirList);
            }
            else if (e.target.matches(`.${GLOBUS_MENU_REFRESH}`)) {
                this.retrieveDirectories(dirPathInput, dirList);
            }
            else if (e.target.matches(`.${GLOBUS_MENU_TRANSFER}`)) {
                this.sourceGroup.appendChild(this.searchGroup);
                this.sourceGroup.style.display = 'block';
                this.destinationGroup.style.display = 'block';
                this.setGCPDestination();
                this.onClickHeaderHandler({target: header});
            }
        }
    }

    private onClickHeaderHandler(e: any) {
        let globusGroup = e.target.parentElement;
        let infoDiv: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_SEARCH_INFO)[0] as HTMLDivElement);
        let searchGroup: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_SEARCH_GROUP)[0] as HTMLDivElement);

        if (searchGroup.style.display === 'block') {
            let endpointInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_ENDPOINT_INPUT)[0] as HTMLInputElement);
            let dirPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);

            // TODO Use Observable instead
            if (endpointInput.value.length !== 0) {
                infoDiv.textContent = `${endpointInput.value}: ${dirPathInput.value}`;
                if (e.target.textContent === 'Source') {
                    infoDiv.textContent += `\n${globusGroup.getElementsByClassName(GLOBUS_SELECTED).length} file(s) selected`;
                }
            }
            else {
                infoDiv.textContent = 'No endpoint selected'
            }

            searchGroup.style.display = 'none';
            infoDiv.style.display = 'block';
        }
        else {
            searchGroup.style.display = 'block';
            infoDiv.style.display = 'none';
        }

        e.target.classList.toggle('active');
    }

    private onClickStartTransferHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_START_TRANSFER_BUTTON}`)) {
            let globusGroup = this.sourceGroup;
            let sourcePathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);
            let sourceEndpoint: HTMLLIElement = (globusGroup.getElementsByClassName(GLOBUS_OPEN)[0] as HTMLLIElement);

            globusGroup = this.destinationGroup;
            let destinationPathInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_DIR_PATH_INPUT)[0] as HTMLInputElement);
            let destinationEndpoint: HTMLLIElement = (globusGroup.getElementsByClassName(GLOBUS_OPEN)[0] as HTMLLIElement);
            let transferResult: HTMLDivElement = (globusGroup.getElementsByClassName(GLOBUS_TRANSFER_RESULT)[0] as HTMLDivElement);

            transferResult.textContent = '';
            transferResult.style.background = 'transparent';
            transferResult.style.display = 'block';
            transferResult.appendChild(LOADING_ICON);

            let selectedElements = this.sourceGroup.getElementsByClassName(GLOBUS_SELECTED);

            let items: any = [];

            for (let i = 0; i < selectedElements.length; i++) {
                let file = (selectedElements[i] as HTMLLIElement) ;
                let transferItem: any = {
                    'DATA_TYPE': 'transfer_item',
                    'source_path': `${sourcePathInput.value}${file.title}`,
                    'destination_path': `${destinationPathInput.value}${file.title}`,
                    'recursive': file.type === 'dir'
                };

                items.push(transferItem);
            }

            // TODO better error handling
            if (!sourceEndpoint || !destinationEndpoint) {
                transferResult.removeChild(LOADING_ICON);
                transferResult.textContent = 'Both endpoints must be selected to start transfer';
                transferResult.style.background = '#e18787';
                transferResult.style.color = '#340d0d';
                return;
            }

            transferFile(items, sourceEndpoint.id, destinationEndpoint.id)
                .then(data => {
                    transferResult.removeChild(LOADING_ICON);
                    transferResult.textContent = data.message;
                    transferResult.style.background = '#a6e9a6';
                    transferResult.style.color = '#0d340d';
                })
                .catch(error => {
                    transferResult.removeChild(LOADING_ICON);
                    transferResult.textContent = error.message;
                    transferResult.style.background = '#e18787';
                    transferResult.style.color = '#340d0d';
                });
        }
    }

    onUpdateRequest() {
        removeChildren(this.node);
        this.createHTMLElements();
    }

    private setGCPDestination() {
        let globusGroup = this.destinationGroup;
        let endpointInput: HTMLInputElement = (globusGroup.getElementsByClassName(GLOBUS_ENDPOINT_INPUT)[0] as HTMLInputElement);
        let endpointList: HTMLUListElement = (globusGroup.getElementsByClassName(GLOBUS_ENDPOINT_LIST)[0] as HTMLUListElement);

        endpointInput.value = 'Your GCP Endpoint';
        endpointList.style.display = 'block';

        endpointList.appendChild(LOADING_ICON);
        endpointList.appendChild(LOADING_LABEL);
        this.fetchEndpoints(GCP_ENDPOINT_ID, endpointList);
    }
}