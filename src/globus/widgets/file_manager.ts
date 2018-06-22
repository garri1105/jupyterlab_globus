import {Widget} from '@phosphor/widgets';
import {activateEndpoint, deleteFile, endpointSearch, listDirectoryContents, transferFile} from "../client";
import Timer = NodeJS.Timer;
import {GCP_ENDPOINT_ID} from "./globus_connect_personal";
import {
    LOADING_LABEL, LOADING_ICON, removeChildren, GLOBUS_LIST_ITEM,
    GLOBUS_LIST_ITEM_TITLE, GLOBUS_OPEN, GLOBUS_SELECTED, GLOBUS_BORDER,
    GLOBUS_LIST, GLOBUS_INPUT, GLOBUS_GROUP, GLOBUS_HEADER, GLOBUS_FAIL, GLOBUS_SUCCESS,
    getGlobusParentGroup, getGlobusElement, GLOBUS_MENU_BTN, GLOBUS_MENU, displayError, GLOBUS_BUTTON,
    GLOBUS_DISPLAY_FLEX, GLOBUS_LIST_ITEM_SUBTITLE, GLOBUS_ACTIVE
} from "../../utils";


// TODO Add extra options. Advanced filtering, Search my endpoints, etc.
// TODO when filemanager overflows, layout getst screwed up
/**
 * CSS classes
 */
const GLOBUS_FILE_MANAGER = 'jp-Globus-file-manager';
const FILEMANAGER_ENDPOINT_GROUP = 'jp-FileManager-endpointGroup';
const FILEMANAGER_ENDPOINT_INPUT = 'jp-FileManager-endpointInput';
const FILEMANAGER_ENDPOINT_LIST = 'jp-FileManager-endpointList';
const FILEMANAGER_DIR_GROUP = 'jp-FileManager-dirGroup';
const FILEMANAGER_DIR_PATH_INPUT = 'jp-FileManager-dirPathInput';
const FILEMANAGER_DIR_LIST = 'jp-FileManager-dirList';
const FILEMANAGER_DIR_OPTIONS = 'jp-FileManager-dirOptions';
const FILEMANAGER_DIR_MENU = 'jp-FileManager-dirMenu';
const FILEMANAGER_MENU_SELECT = 'jp-FileManager-menuSelect';
const FILEMANAGER_MENU_UP_FOLDER = 'jp-FileManager-menuUpFolder';
const FILEMANAGER_MENU_REFRESH = 'jp-FileManager-menuRefresh';
const FILEMANAGER_MENU_SORT = 'jp-FileManager-menuSort';
const FILEMANAGER_MENU_OPTIONS = 'jp-FileManager-menuOptions';
const FILEMANAGER_MENU_OPTION = 'jp-FileManager-menuOption';
const FILEMANAGER_OPTION_SHARE = 'jp-FileManager-optionShare';
const FILEMANAGER_OPTION_TRANSFER = 'jp-FileManager-optionTransfer';
const FILEMANAGER_OPTION_NEWFOLDER = 'jp-FileManager-optionNewFolder';
const FILEMANAGER_OPTION_RENAME = 'jp-FileManager-optionRename';
const FILEMANAGER_OPTION_DELETE = 'jp-FileManager-optionDelete';
const FILEMANAGER_SEARCH_INFO = 'jp-FileManager-searchInfo';
const FILEMANAGER_SEARCH_GROUP = 'jp-FileManager-searchGroup';
const FILEMANAGER_TRANSFER_RESULT = 'jp-FileManager-transferResult';
const FILEMANAGER_START_TRANSFER_BTN = 'jp-FileManager-startTransferBtn';
const FILEMANAGER_FILE_TYPE = 'jp-FileManager-fileType';
const FILEMANAGER_DIR_TYPE = 'jp-FileManager-dirType';

export const FILE_MANAGER = 'globus-file-manager';

const ITEM_TYPE: any = {
    'dir': FILEMANAGER_DIR_TYPE,
    'file': FILEMANAGER_FILE_TYPE
};

/**
 * Widget for hosting the Globus File Manager.
 */
export class GlobusFileManager extends Widget {
    private searchGroup: HTMLDivElement;
    private originalGroup: HTMLDivElement;
    private sourceGroup: HTMLDivElement;
    private destinationGroup: HTMLDivElement;
    private startTransferBtn: HTMLButtonElement;
    private timeout: Timer;

    constructor() {
        super();
        this.id = FILE_MANAGER;
        this.addClass(GLOBUS_FILE_MANAGER);

        this.title.label = 'File Manager';

        this.update();
    }

    onUpdateRequest() {
        removeChildren(this.node);
        this.createHTMLElements();
    }

    private fetchEndpoints(query: string, endpointList: HTMLUListElement) {
        return new Promise<void>((resolve) => {
            endpointSearch(query).then(data => {
                if (data.DATA.length > 0) {
                    this.displayEndpoints(data, endpointList);
                }
                else {
                    displayError({customMessage: 'No endpoints found'}, endpointList);
                }
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
            owner.className = GLOBUS_LIST_ITEM_SUBTITLE;
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

            removeChildren(endpointList);

            LOADING_LABEL.textContent = 'Loading Collections...';
            endpointList.appendChild(LOADING_ICON);
            endpointList.appendChild(LOADING_LABEL);
            this.fetchEndpoints(endpointInput.value, endpointList).then(() => {
                endpointList.removeChild(LOADING_ICON);
                endpointList.removeChild(LOADING_LABEL);
            });
        }
        else {
            endpointList.style.display = 'none';
        }
    }

    private endpointClicked(e: any) {
        let endpoint: HTMLElement = e.currentTarget;
        let endpointList: HTMLElement = endpoint.parentElement;

        let globusParentGroup: HTMLElement = getGlobusParentGroup(endpoint);
        let endpointInput: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_INPUT);
        let directoryGroup: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_GROUP);
        let dirList: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_LIST);
        let dirPathInput: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT);

        endpoint.classList.toggle(GLOBUS_OPEN);
        (endpointInput as HTMLInputElement).value = endpoint.title;
        endpointList.style.display = 'none';
        directoryGroup.style.display = 'flex';

        this.retrieveDirectories(dirPathInput as HTMLInputElement, dirList as HTMLUListElement);
    }

    private fetchDirectories(dirPath: string, dirList: HTMLUListElement) {
        let globusParentGroup: HTMLElement = getGlobusParentGroup(dirList);
        let endpoint: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_OPEN);

        // Activate endpoint fetch -> "autoactivate"
        return new Promise<void>((resolve) => {
            activateEndpoint(endpoint.id).then(() => {
                listDirectoryContents(endpoint.id, dirPath)
                    .then(data => {
                        this.displayDirectories(data, dirList);
                    }).catch(e => {
                        displayError(e, dirList);
                    }).then(() => resolve());
            });
        });
    }

    private displayDirectories(data: any, dirList: HTMLUListElement) {
        for (let i = 0; i < data.DATA.length; i++) {
            let directoryData = data.DATA[i];

            let directory: HTMLLIElement = document.createElement('li');
            directory.className = `${GLOBUS_LIST_ITEM} ${ITEM_TYPE[directoryData.type]}`;
            directory.title = directoryData.name;
            directory.type = directoryData.type;

            // TODO Add last date modified with moment.js
            let name: HTMLDivElement = document.createElement('div');
            name.textContent = directoryData.name;
            name.className = GLOBUS_LIST_ITEM_TITLE;

            // TODO Convert to KB
            let size: HTMLDivElement = document.createElement('div');
            size.className = GLOBUS_LIST_ITEM_SUBTITLE;
            size.textContent = `${directoryData.size} B`;

            directory.appendChild(name);
            directory.appendChild(size);

            directory.addEventListener("click", this.directoryClicked.bind(this));
            directory.addEventListener("dblclick", this.directoryDblClicked.bind(this));
            dirList.appendChild(directory);
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
        let directory: HTMLLIElement = e.currentTarget;
        let globusParentGroup: HTMLElement = getGlobusParentGroup(directory);

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
        let menuSelect: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_MENU_SELECT);
        globusParentGroup.getElementsByClassName(GLOBUS_SELECTED).length === 0 ?
            menuSelect.textContent = 'select all' :
            menuSelect.textContent = 'select none';
    }

    private directoryDblClicked(e: any) {
        let directory: HTMLLIElement = e.currentTarget;
        let dirList: HTMLElement = directory.parentElement;

        let globusParentGroup: HTMLElement = getGlobusParentGroup(directory);
        let dirPathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT) as HTMLInputElement;

        switch (directory.type) {
            case 'dir': {
                dirPathInput.value += `${directory.title}/`;
                this.retrieveDirectories(dirPathInput, dirList as HTMLUListElement);
                break;
            }
            case 'file': {
                directory.classList.toggle(GLOBUS_SELECTED);
                break;
            }
        }
    }

    // TODO handle quick successive calls as only one call. Timeout kinda solves it but it still feels buggy sometimes
    private onKeyUpEndpointInputHandler(e: any) {
        if (e.target.matches(`.${FILEMANAGER_ENDPOINT_INPUT}`)) {
            let globusParentGroup: HTMLElement = getGlobusParentGroup(e.target);
            let dirPathInput: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT);
            let directoryGroup: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_GROUP);
            let endpointList: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_LIST);

            (dirPathInput as HTMLInputElement).value = '/~/';
            directoryGroup.style.display = 'none';

            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.retrieveEndpoints(e.target, endpointList as HTMLUListElement), 300);
        }
    }

    private onChangeDirPathInputHandler(e: any) {
        if (e.target.matches(`.${FILEMANAGER_DIR_PATH_INPUT}`)) {
            let globusParentGroup: HTMLElement = getGlobusParentGroup(e.target);
            let dirList: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_LIST);
            this.retrieveDirectories(e.target, dirList as HTMLUListElement);
        }
    }

    private onClickDirMenuButtonHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_MENU_BTN}`)) {
            let globusParentGroup: HTMLElement = getGlobusParentGroup(e.target);
            let dirList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_LIST) as HTMLUListElement;
            let dirOptions: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_OPTIONS) as HTMLUListElement;
            let dirPathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT) as HTMLInputElement;

            if (e.target.matches(`.${FILEMANAGER_MENU_SELECT}`)) {
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
            else if (e.target.matches(`.${FILEMANAGER_MENU_UP_FOLDER}`)) {
                let splits = dirPathInput.value.split('/');
                let fileName = splits[splits.length - 2];
                dirPathInput.value = dirPathInput.value.slice(0, -(fileName.length+1));
                this.retrieveDirectories(dirPathInput, dirList);
            }
            else if (e.target.matches(`.${FILEMANAGER_MENU_REFRESH}`)) {
                this.retrieveDirectories(dirPathInput, dirList);
            }
            else if (e.target.matches(`.${FILEMANAGER_MENU_OPTIONS}`)) {
                if (dirOptions.style.display === 'block') {
                    dirList.style.display = 'block';
                    dirOptions.style.display = 'none';
                }
                else {
                    dirList.style.display = 'none';
                    dirOptions.style.display = 'block';
                }
            }
        }
    }

    private onClickMenuOptionHandler(e: any) {
        if (e.target.matches(`.${FILEMANAGER_MENU_OPTION}`)) {
            let globusParentGroup = getGlobusParentGroup(e.target);
            let dirPathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT) as HTMLInputElement;
            let dirList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_LIST) as HTMLUListElement;
            let dirOptions: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_OPTIONS) as HTMLUListElement;

            dirList.style.display = 'block';
            dirOptions.style.display = 'none';

            if (e.target.matches(`.${FILEMANAGER_OPTION_TRANSFER}`)) {
                this.sourceGroup.appendChild(this.searchGroup);
                this.sourceGroup.style.display = 'flex';
                this.destinationGroup.style.display = 'flex';
                this.startTransferBtn.style.display = 'block';
                this.originalGroup.style.display = 'none';
                this.setGCPDestination();
                this.onClickHeaderHandler({target: getGlobusElement(this.searchGroup.parentElement, GLOBUS_HEADER)});
            }
            else if (e.target.matches(`.${FILEMANAGER_OPTION_DELETE}`)) {
                this.deleteSelected(e.target).then(r => {this.retrieveDirectories(dirPathInput, dirList); console.log(r)}).catch(e => console.log(e));
            }
        }
    }

    private onClickHeaderHandler(e: any) {
        let globusParentGroup: HTMLElement = getGlobusParentGroup(e.target);
        let infoDiv: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_SEARCH_INFO);
        let searchGroup: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_SEARCH_GROUP);

        if (searchGroup.style.display === 'flex') {
            let endpointInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_INPUT) as HTMLInputElement;
            let dirPathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT) as HTMLInputElement;

            // TODO Use Observable instead
            if (endpointInput.value.length !== 0) {
                infoDiv.textContent = `${endpointInput.value}: ${dirPathInput.value}`;
                if (e.target.textContent === 'Source') {
                    infoDiv.textContent += `\n${globusParentGroup.getElementsByClassName(GLOBUS_SELECTED).length} file(s) selected`;
                }
            }
            else {
                infoDiv.textContent = 'No endpoint selected'
            }

            searchGroup.style.display = 'none';
            infoDiv.style.display = 'block';
        }
        else {
            searchGroup.style.display = 'flex';
            infoDiv.style.display = 'none';
        }

        e.target.classList.toggle(GLOBUS_ACTIVE);
    }

    private startTransfer() {
        let globusParentGroup = this.sourceGroup;
        let sourcePathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT) as HTMLInputElement;
        let sourceEndpoint: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_OPEN);

        globusParentGroup = this.destinationGroup;
        let destinationPathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT) as HTMLInputElement;
        let destinationEndpoint: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_OPEN);
        let transferResult: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_TRANSFER_RESULT);

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
        transferResult.style.display = 'block';
        if (sourceEndpoint && destinationEndpoint) {
            transferResult.textContent = '';
            transferResult.className = `${FILEMANAGER_TRANSFER_RESULT} ${GLOBUS_BORDER}`;
            transferResult.appendChild(LOADING_ICON);
            transferFile(items, sourceEndpoint.id, destinationEndpoint.id)
                .then(data => {
                    transferResult.textContent = data.message;
                    transferResult.classList.add(GLOBUS_SUCCESS)
                }).catch(e => {
                    transferResult.textContent = e.message;
                    transferResult.classList.add(GLOBUS_FAIL);
                });
        }
        else {
            transferResult.textContent = 'Both endpoints must be selected to start transfer';
            transferResult.classList.add(GLOBUS_FAIL);
        }
    }

    private deleteSelected(target: HTMLElement) {
        let globusParentGroup = getGlobusParentGroup(target);
        let pathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_PATH_INPUT) as HTMLInputElement;
        let endpoint: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_OPEN);

        let selectedElements = globusParentGroup.getElementsByClassName(GLOBUS_SELECTED);

        let items: any = [];
        let recursive: boolean = false;

        console.log(selectedElements);
        for (let i = 0; i < selectedElements.length; i++) {
            let file = (selectedElements[i] as HTMLLIElement) ;
            let deleteItem: any = {
                'DATA_TYPE': 'delete_item',
                'path': `${pathInput.value}${file.title}`,
            };

            if (file.type === 'dir') {
                recursive = true;
            }

            items.push(deleteItem);
        }

        return deleteFile(items, endpoint.id, recursive);
    }

    private setGCPDestination() {
        let globusParentGroup = this.destinationGroup;
        let endpointInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_INPUT) as HTMLInputElement;
        let endpointList: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_LIST);

        endpointInput.value = 'Your GCP Endpoint';
        endpointList.style.display = 'block';

        endpointList.appendChild(LOADING_ICON);
        endpointList.appendChild(LOADING_LABEL);
        this.fetchEndpoints(GCP_ENDPOINT_ID, endpointList as HTMLUListElement).then(() => {
            endpointList.removeChild(LOADING_ICON);
            endpointList.removeChild(LOADING_LABEL);
        });
    }


    private createHTMLElements() {
        /* ------------- <Endpoint search> ------------- */

        // Search Input. Shown
        let endpointInput: HTMLInputElement = document.createElement('input');
        endpointInput.className = `${GLOBUS_INPUT} ${FILEMANAGER_ENDPOINT_INPUT} ${GLOBUS_BORDER}`;
        endpointInput.placeholder = 'Search collections';

        // Endpoint List. Hidden
        let endpointList: HTMLUListElement = document.createElement('ul');
        endpointList.className = `${GLOBUS_LIST} ${FILEMANAGER_ENDPOINT_LIST} ${GLOBUS_BORDER}`;
        endpointList.style.display = 'none';

        // Search Input container for adding extra elements
        let endpointGroup: HTMLDivElement = document.createElement('div');
        endpointGroup.className = `${GLOBUS_DISPLAY_FLEX} ${FILEMANAGER_ENDPOINT_GROUP}`;
        endpointGroup.appendChild(endpointInput);
        endpointGroup.appendChild(endpointList);
        endpointGroup.style.display = 'flex';

        /* ------------- </Endpoint search> ------------- */


        /* ------------- <DirPath search> ------------- */

        // DirPath Input. Hidden
        let dirPathInput: HTMLInputElement = document.createElement('input');
        dirPathInput.className = `${GLOBUS_INPUT} ${FILEMANAGER_DIR_PATH_INPUT} ${GLOBUS_BORDER}`;
        dirPathInput.value = '/~/';

        let menuSelect: HTMLDivElement = document.createElement('div');
        menuSelect.className = `${GLOBUS_MENU_BTN} ${FILEMANAGER_MENU_SELECT}`;
        menuSelect.textContent = 'select all';
        let menuUpFolder: HTMLDivElement = document.createElement('div');
        menuUpFolder.className = `${GLOBUS_MENU_BTN} ${FILEMANAGER_MENU_UP_FOLDER}`;

        let menuRefresh: HTMLDivElement = document.createElement('div');
        menuRefresh.className = `${GLOBUS_MENU_BTN} ${FILEMANAGER_MENU_REFRESH}`;

        let menuSort: HTMLDivElement = document.createElement('div');
        menuSort.className = `${GLOBUS_MENU_BTN} ${FILEMANAGER_MENU_SORT}`;
        menuSort.textContent = 'Sort';

        let menuOptions: HTMLDivElement = document.createElement('div');
        menuOptions.className = `${GLOBUS_MENU_BTN} ${FILEMANAGER_MENU_OPTIONS}`;

        let dirMenu = document.createElement('div');
        dirMenu.className = `${GLOBUS_BORDER} ${GLOBUS_MENU} ${FILEMANAGER_DIR_MENU}`;
        dirMenu.appendChild(menuSelect);
        dirMenu.appendChild(menuUpFolder);
        dirMenu.appendChild(menuRefresh);
        dirMenu.appendChild(menuSort);
        dirMenu.appendChild(menuOptions);

        let dirList: HTMLUListElement = document.createElement('ul');
        dirList.className = `${GLOBUS_LIST} ${FILEMANAGER_DIR_LIST} ${GLOBUS_BORDER}`;

        let shareOption = document.createElement('li');
        shareOption.className = `${GLOBUS_LIST_ITEM} ${FILEMANAGER_MENU_OPTION} ${FILEMANAGER_OPTION_SHARE}`;
        shareOption.textContent = 'Share';
        let transferOption = document.createElement('li');
        transferOption.className = `${GLOBUS_LIST_ITEM} ${FILEMANAGER_MENU_OPTION} ${FILEMANAGER_OPTION_TRANSFER}`;
        transferOption.textContent = 'Transfer';
        let newFolderOption = document.createElement('li');
        newFolderOption.className = `${GLOBUS_LIST_ITEM} ${FILEMANAGER_MENU_OPTION} ${FILEMANAGER_OPTION_NEWFOLDER}`;
        newFolderOption.textContent = 'New folder';
        let renameOption = document.createElement('li');
        renameOption.className = `${GLOBUS_LIST_ITEM} ${FILEMANAGER_MENU_OPTION} ${FILEMANAGER_OPTION_RENAME}`;
        renameOption.textContent = 'Rename';
        let deleteOption = document.createElement('li');
        deleteOption.className = `${GLOBUS_LIST_ITEM} ${FILEMANAGER_MENU_OPTION} ${FILEMANAGER_OPTION_DELETE}`;
        deleteOption.textContent = 'Delete';
        let dirOptions: HTMLUListElement = document.createElement('ul');
        dirOptions.className = `${GLOBUS_LIST} ${FILEMANAGER_DIR_OPTIONS} ${GLOBUS_BORDER}`;
        dirOptions.appendChild(shareOption);
        dirOptions.appendChild(transferOption);
        dirOptions.appendChild(newFolderOption);
        dirOptions.appendChild(renameOption);
        dirOptions.appendChild(deleteOption);
        dirOptions.style.display = 'none';

        // Path Input container for adding extra elements
        let directoryGroup = document.createElement('div');
        directoryGroup.className = `${GLOBUS_DISPLAY_FLEX} ${FILEMANAGER_DIR_GROUP}`;
        directoryGroup.appendChild(dirPathInput);
        directoryGroup.appendChild(dirMenu);
        directoryGroup.appendChild(dirList);
        directoryGroup.appendChild(dirOptions);
        directoryGroup.style.display = 'none';

        /* ------------- </DirPath search> ------------- */


        /* ------------- <searchGroup> ------------- */

        this.searchGroup = document.createElement('div');
        this.searchGroup.className = `${GLOBUS_DISPLAY_FLEX} ${FILEMANAGER_SEARCH_GROUP}`;
        this.searchGroup.appendChild(endpointGroup);
        this.searchGroup.appendChild(directoryGroup);
        this.searchGroup.addEventListener('keyup', this.onKeyUpEndpointInputHandler.bind(this));
        this.searchGroup.addEventListener('change', this.onChangeDirPathInputHandler.bind(this));
        this.searchGroup.addEventListener('click', this.onClickDirMenuButtonHandler.bind(this));
        this.searchGroup.addEventListener('click', this.onClickMenuOptionHandler.bind(this));
        this.searchGroup.style.display = 'flex';

        /* -------------</searchGroup>------------- */


        /* ------------- <originalGroup> ------------- */
        /* First search screen */
        this.originalGroup = document.createElement('div');
        this.originalGroup.className = GLOBUS_GROUP;
        this.originalGroup.appendChild(this.searchGroup);

        /* ------------- </originalGroup> ------------- */


        /* ------------- <sourceGroup> ------------- */
        /* Source screen. Hidden */
        let sourceHeader = document.createElement('div');
        sourceHeader.textContent = 'Source';
        sourceHeader.className = `${GLOBUS_HEADER} ${GLOBUS_BORDER}`;
        sourceHeader.addEventListener('click', this.onClickHeaderHandler.bind(this));
        let sourceInfo = document.createElement('div');
        sourceInfo.className = `${FILEMANAGER_SEARCH_INFO} ${GLOBUS_BORDER}`;
        sourceInfo.style.display = 'none';
        this.sourceGroup = document.createElement('div');
        this.sourceGroup.className = GLOBUS_GROUP;
        this.sourceGroup.appendChild(sourceHeader);
        this.sourceGroup.appendChild(sourceInfo);
        this.sourceGroup.style.display = 'none';

        /* ------------- <sourceGroup> ------------- */


        /* ------------- <destinationGroup> ------------- */
        /* Destination screen. Hidden */
        let destinationHeader = document.createElement('div');
        destinationHeader.textContent = 'Destination';
        destinationHeader.className = `${GLOBUS_HEADER} ${GLOBUS_BORDER}`;
        destinationHeader.addEventListener('click', this.onClickHeaderHandler.bind(this));
        let destinationInfo = document.createElement('div');
        destinationInfo.className = `${FILEMANAGER_SEARCH_INFO} ${GLOBUS_BORDER}`;
        destinationInfo.style.display = 'none';
        let transferResult = document.createElement('div');
        transferResult.className = `${FILEMANAGER_TRANSFER_RESULT} ${GLOBUS_BORDER}`;
        transferResult.style.display = 'none';
        transferResult.onclick = () => transferResult.style.display = 'none';
        let searchGroupClone = this.searchGroup.cloneNode(true);
        this.destinationGroup = document.createElement('div');
        this.destinationGroup.className = GLOBUS_GROUP;
        this.destinationGroup.appendChild(destinationHeader);
        this.destinationGroup.appendChild(destinationInfo);
        this.destinationGroup.appendChild(searchGroupClone);
        this.destinationGroup.appendChild(transferResult);
        this.destinationGroup.addEventListener('keyup', this.onKeyUpEndpointInputHandler.bind(this));
        this.destinationGroup.addEventListener('change', this.onChangeDirPathInputHandler.bind(this));
        this.destinationGroup.addEventListener('click', this.onClickDirMenuButtonHandler.bind(this));
        this.destinationGroup.addEventListener('click', this.onClickMenuOptionHandler.bind(this));
        this.destinationGroup.style.display = 'none';

        /* ------------- </destinationGroup> ------------- */

        this.startTransferBtn = document.createElement('button');
        this.startTransferBtn.textContent = 'TRANSFER';
        this.startTransferBtn.className = `${GLOBUS_BUTTON} ${FILEMANAGER_START_TRANSFER_BTN}`;
        this.startTransferBtn.style.display = 'none';
        this.startTransferBtn.addEventListener('click', this.startTransfer.bind(this));

        this.node.appendChild(this.originalGroup);
        this.node.appendChild(this.sourceGroup);
        this.node.appendChild(this.destinationGroup);
        this.node.appendChild(this.startTransferBtn);
    }
}