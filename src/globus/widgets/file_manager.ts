import {Widget} from '@phosphor/widgets';
import {
    activateEndpoint,
    endpointSearch, endpointSearchById,
    listDirectoryContents,
    requestSubmissionId,
    submitOperation,
    submitTask
} from "../api/transfer";
import {
    GlobusDeleteItem,
    GlobusDeleteTask,
    GlobusEndpointItem,
    GlobusEndpointList,
    GlobusFileItem,
    GlobusFileList,
    GlobusNewDirectoryOperation,
    GlobusRenameOperation,
    GlobusSubmissionId,
    GlobusTransferItem,
    GlobusTransferTask
} from "../api/models";
import Timer = NodeJS.Timer;
import {GCP_ENDPOINT_ID} from "./globus_connect_personal";
import {
    LOADING_LABEL,
    LOADING_ICON,
    GLOBUS_LIST_ITEM,
    GLOBUS_LIST_ITEM_TITLE,
    GLOBUS_OPEN,
    GLOBUS_SELECTED,
    GLOBUS_BORDER,
    GLOBUS_LIST,
    GLOBUS_INPUT,
    GLOBUS_PARENT_GROUP,
    GLOBUS_HEADER,
    GLOBUS_FAIL,
    GLOBUS_SUCCESS,
    GLOBUS_MENU_BTN,
    GLOBUS_MENU,
    GLOBUS_BUTTON,
    GLOBUS_DISPLAY_FLEX,
    GLOBUS_LIST_ITEM_SUBTITLE,
    GLOBUS_ACTIVE,
    GLOBUS_DISABLED,
    convertBytes,
    removeChildren,
    getGlobusParentGroup,
    getGlobusElement,
    displayError,
    sortList, isEndpointId, GLOBUS_FETCH_ERROR
} from "../../utils";
import {BehaviorSubject} from "rxjs/internal/BehaviorSubject";
import * as moment from 'moment';
import * as $ from 'jquery';

// TODO Uncomment share option when it is supported

/**
 * CSS classes
 */
const GLOBUS_FILE_MANAGER = 'jp-Globus-file-manager';
const FILEMANAGER_ENDPOINT_GROUP = 'jp-FileManager-endpointGroup';
const FILEMANAGER_ENDPOINT_INPUT = 'jp-FileManager-endpointInput';
const FILEMANAGER_ENDPOINT_LIST = 'jp-FileManager-endpointList';
const FILEMANAGER_DIR_GROUP = 'jp-FileManager-dirGroup';
const FILEMANAGER_DIR_OPTIONS = 'jp-FileManager-dirOptions';
const FILEMANAGER_DIR_MENU = 'jp-FileManager-dirMenu';
const FILEMANAGER_FILE_PATH_INPUT = 'jp-FileManager-filePathInput';
const FILEMANAGER_FILE_LIST = 'jp-FileManager-fileList';
const FILEMANAGER_MENU_SELECT = 'jp-FileManager-menuSelect';
const FILEMANAGER_MENU_UP_FOLDER = 'jp-FileManager-menuUpFolder';
const FILEMANAGER_MENU_REFRESH = 'jp-FileManager-menuRefresh';
const FILEMANAGER_MENU_SORT = 'jp-FileManager-menuSort';
const FILEMANAGER_MENU_OPTIONS = 'jp-FileManager-menuOptions';
const FILEMANAGER_MENU_OPTION = 'jp-FileManager-menuOption';
// const FILEMANAGER_OPTION_SHARE = 'jp-FileManager-optionShare'; TODO uncomment when supported
const FILEMANAGER_OPTION_TRANSFER = 'jp-FileManager-optionTransfer';
const FILEMANAGER_OPTION_NEWFOLDER = 'jp-FileManager-optionNewFolder';
const FILEMANAGER_OPTION_RENAME = 'jp-FileManager-optionRename';
const FILEMANAGER_OPTION_DELETE = 'jp-FileManager-optionDelete';
const FILEMANAGER_SEARCH_INFO = 'jp-FileManager-searchInfo';
const FILEMANAGER_SEARCH_GROUP = 'jp-FileManager-searchGroup';
const FILEMANAGER_FILE_TYPE = 'jp-FileManager-fileType';
const FILEMANAGER_DIR_TYPE = 'jp-FileManager-dirType';
const FILEMANAGER_TRANSFER_RESULT = 'jp-FileManager-transferResult';
const FILEMANAGER_START_TRANSFER_BTN = 'jp-FileManager-startTransferBtn';
const FILEMANAGER_TRANSFER_OPTIONS_BTN = 'jp-FileManager-transferOptionsBtn';
const FILEMANAGER_TRANSFER_OPTIONS = 'jp-FileManager-transferOptions';
const FILEMANAGER_NEWDIR = 'jp-FileManager-newDir';
const FILEMANAGER_NEWDIR_INPUT = 'jp-FileManager-newDirInput';
const FILEMANAGER_NEWDIR_ACCEPT = 'jp-FileManager-newDirAccept';
const FILEMANAGER_NEWDIR_CANCEL = 'jp-FileManager-newDirCancel';
const FILEMANAGER_SORT_OPTIONS = 'jp-FileManager-sortOptions';
const FILEMANAGER_SORT_BUTTON = 'jp-FileManager-sortButton';
const FILEMANAGER_SORT_GROUP = 'jp-FileManager-sortGroup';

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
    private transferGroup: HTMLFormElement;
    private parentGroup$: BehaviorSubject<HTMLElement>;
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
            if (isEndpointId(query)) {
                endpointSearchById(query).then(data => {
                    let dataList: GlobusEndpointList = {
                        DATA_TYPE: "endpoint_list",
                        DATA: [data],
                        has_next_page: false,
                        limit: 10,
                        offset: 0
                    };
                    resolve();
                    this.displayEndpoints(dataList, endpointList);
                }).catch(e => {
                    console.log(e);
                    displayError({customMessage: 'No endpoints found'}, endpointList);
                    resolve();
                });
            }
            else {
                endpointSearch(query).then(data => {
                    if (data.DATA.length > 0) {
                        this.displayEndpoints(data, endpointList);
                    }
                    else {
                        displayError({customMessage: 'No endpoints found'}, endpointList);
                    }
                    resolve();
                });
            }
        });
    }

    private displayEndpoints(data: GlobusEndpointList, endpointList: HTMLUListElement) {
        for (let i = 0; i < data.DATA.length; i++) {
            let endpointData = data.DATA[i];

            let endpoint: HTMLLIElement = document.createElement('li');
            endpoint.className = GLOBUS_LIST_ITEM;
            endpoint.id = endpointData.id;

            $.data<GlobusEndpointItem>(endpoint, 'data', endpointData);

            let name: HTMLDivElement = document.createElement('div');
            name.textContent = name.title = endpointData.display_name ? endpointData.display_name : endpointData.canonical_name;
            name.className = GLOBUS_LIST_ITEM_TITLE;

            let owner: HTMLDivElement = document.createElement('div');
            owner.className = GLOBUS_LIST_ITEM_SUBTITLE;
            owner.textContent = owner.title = endpointData.owner_string;

            endpoint.appendChild(name);
            endpoint.appendChild(owner);

            endpoint.addEventListener("click", this.endpointClicked.bind(this));
            endpointList.appendChild(endpoint);
        }
    }

    private retrieveEndpoints(endpointInput: HTMLInputElement, endpointList: HTMLUListElement) {
        return new Promise<void>((resolve) => {
            if (endpointInput.value.length > 0) {
                endpointList.style.display = 'block';

                removeChildren(endpointList);

                LOADING_LABEL.textContent = 'Loading Collections...';
                endpointList.appendChild(LOADING_ICON);
                endpointList.appendChild(LOADING_LABEL);
                this.fetchEndpoints(endpointInput.value, endpointList).then(() => {
                    if (endpointList.contains(LOADING_ICON) && endpointList.contains(LOADING_LABEL)) {
                        endpointList.removeChild(LOADING_ICON);
                        endpointList.removeChild(LOADING_LABEL);
                    }
                    resolve();
                });
            }
            else {
                endpointList.style.display = 'none';
                resolve();
            }
        })
    }

    private endpointClicked(e: any) {
        let endpoint: HTMLElement = e.currentTarget;
        let endpointList: HTMLElement = endpoint.parentElement;

        let globusParentGroup: HTMLElement = getGlobusParentGroup(endpoint);
        let endpointInput: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_INPUT);
        let directoryGroup: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_GROUP);
        let fileList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_LIST) as HTMLUListElement;
        let filePathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;

        endpoint.classList.toggle(GLOBUS_OPEN);
        (endpointInput as HTMLInputElement).value = (endpoint.firstChild as HTMLElement).title;
        endpointList.style.display = 'none';
        directoryGroup.style.display = 'flex';

        return this.retrieveDirectoryContents(filePathInput, fileList);
    }

    private fetchDirectoryContents(dirPath: string, fileList: HTMLUListElement) {
        let globusParentGroup: HTMLElement = getGlobusParentGroup(fileList);
        let endpoint: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_OPEN);

        // Activate endpoint fetch -> "autoactivate"
        return new Promise<void>((resolve) => {
            activateEndpoint(endpoint.id).then(() => {
                listDirectoryContents(endpoint.id, dirPath)
                    .then(data => {
                        this.displayDirectoryContents(data, fileList);
                    }).catch(e => {
                        displayError(e, fileList);
                    }).then(() => resolve());
            });
        });
    }

    private displayDirectoryContents(data: GlobusFileList, fileList: HTMLUListElement) {
        for (let i = 0; i < data.DATA.length; i++) {
            let fileData = data.DATA[i];

            let file: HTMLLIElement = document.createElement('li');
            file.className = `${GLOBUS_LIST_ITEM} ${ITEM_TYPE[fileData.type]}`;

            $.data<GlobusFileItem>(file, 'data', fileData);

            let name: HTMLDivElement = document.createElement('div');
            name.textContent = name.title = fileData.name;
            name.className = GLOBUS_LIST_ITEM_TITLE;

            let date: HTMLDivElement = document.createElement('div');
            date.className = GLOBUS_LIST_ITEM_SUBTITLE;
            date.textContent = date.title = `${moment(fileData.last_modified).format('MM/DD/YYYY hh:mm a')}`;

            let size: HTMLDivElement = document.createElement('div');
            size.className = GLOBUS_LIST_ITEM_SUBTITLE;
            size.textContent = size.title = `${convertBytes(fileData.size)}`;

            file.appendChild(name);
            file.appendChild(date);
            file.appendChild(size);

            file.addEventListener("click", this.fileClicked.bind(this));
            file.addEventListener("dblclick", this.fileDblClicked.bind(this));
            fileList.appendChild(file);
        }
    }

    private retrieveDirectoryContents(filePathInput: HTMLInputElement, fileList: HTMLUListElement) {
        if (filePathInput.value.length === 0) {
            filePathInput.value = '/~/';
        }

        return new Promise<void>((resolve) => {
            removeChildren(fileList);
            LOADING_LABEL.textContent = 'Retrieving Directories...';
            fileList.appendChild(LOADING_ICON);
            fileList.appendChild(LOADING_LABEL);
            this.fetchDirectoryContents(filePathInput.value, fileList).then(() => {
                if (fileList.contains(LOADING_ICON) && fileList.contains(LOADING_LABEL)) {
                    fileList.removeChild(LOADING_ICON);
                    fileList.removeChild(LOADING_LABEL);
                }
                resolve();
            });
        });
    }

    private fileClicked(e: any) {
        let file: HTMLLIElement = e.currentTarget;

        let itemList =  file.parentElement.children;
        if (!e.ctrlKey) {
            for (let i = 0; i < itemList.length; i++) {
                if (itemList[i].classList.contains(GLOBUS_SELECTED)) {
                    itemList[i].classList.remove(GLOBUS_SELECTED);
                }
            }
        }
        // TODO shiftkey

        file.classList.toggle(GLOBUS_SELECTED);
    }

    private fileDblClicked(e: any) {
        let file: HTMLLIElement = e.currentTarget;
        let fileData: GlobusFileItem = $.data(file, 'data');
        let fileList: HTMLUListElement = file.parentElement as HTMLUListElement;

        let globusParentGroup: HTMLElement = getGlobusParentGroup(file);
        let filePathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;

        switch (fileData.type) {
            case 'dir': {
                filePathInput.value += `${fileData.name}/`;
                this.retrieveDirectoryContents(filePathInput, fileList);
                break;
            }
            case 'file': {
                file.classList.toggle(GLOBUS_SELECTED);
                break;
            }
        }
    }

    private onKeyUpEndpointInputHandler(e: any) {
        if (e.target.matches(`.${FILEMANAGER_ENDPOINT_INPUT}`)) {
            let globusParentGroup: HTMLElement = getGlobusParentGroup(e.target);
            let filePathInput: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT);
            let directoryGroup: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_GROUP);
            let endpointList: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_LIST);

            (filePathInput as HTMLInputElement).value = '/~/';
            directoryGroup.style.display = 'none';

            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.retrieveEndpoints(e.target, endpointList as HTMLUListElement), 300);
        }
    }

    private onChangeFilePathInputHandler(e: any) {
        if (e.target.matches(`.${FILEMANAGER_FILE_PATH_INPUT}`)) {
            let globusParentGroup: HTMLElement = getGlobusParentGroup(e.target);
            let fileList: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_LIST);

            this.retrieveDirectoryContents(e.target, fileList as HTMLUListElement);
        }
    }

    private onClickDirMenuButtonHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_MENU_BTN}`)) {
            let globusParentGroup: HTMLElement = getGlobusParentGroup(e.target);
            let fileList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_LIST) as HTMLUListElement;
            let dirOptions: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_OPTIONS) as HTMLUListElement;
            let filePathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;

            if (e.target.matches(`.${FILEMANAGER_MENU_SELECT}`)) {
                let itemList =  fileList.children;
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
                let splits = filePathInput.value.split('/');
                let fileName = splits[splits.length - 2];
                filePathInput.value = filePathInput.value.slice(0, -(fileName.length+1));

                this.retrieveDirectoryContents(filePathInput, fileList);
            }
            else if (e.target.matches(`.${FILEMANAGER_MENU_REFRESH}`)) {
                this.retrieveDirectoryContents(filePathInput, fileList);
            }
            else if (e.target.matches(`.${FILEMANAGER_MENU_SORT}`)) {
                e.target.classList.toggle(GLOBUS_ACTIVE);
                let sortGroup = getGlobusElement(globusParentGroup, FILEMANAGER_SORT_GROUP);
                if (e.target.classList.contains(GLOBUS_ACTIVE)) {
                    sortGroup.style.display = 'flex';
                }
                else {
                    sortGroup.style.display = 'none';
                }
            }
            else if (e.target.matches(`.${FILEMANAGER_MENU_OPTIONS}`)) {
                dirOptions.hidden = !dirOptions.hidden;
            }
        }
    }

    private onClickMenuOptionHandler(e: any) {
        let globusParentGroup = getGlobusParentGroup(e.target);
        let dirOptions: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_DIR_OPTIONS) as HTMLUListElement;

        if (e.target.matches(`.${FILEMANAGER_MENU_OPTION}`)) {
            let filePathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;
            let fileList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_LIST) as HTMLUListElement;

            dirOptions.hidden = true;

            if (e.target.matches(`.${FILEMANAGER_OPTION_TRANSFER}`)) {
                this.sourceGroup.appendChild(this.searchGroup);
                this.parentGroup$.next(this.sourceGroup);
                this.sourceGroup.style.display = 'flex';
                this.destinationGroup.style.display = 'flex';
                this.transferGroup.style.display = 'flex';
                this.originalGroup.style.display = 'none';
                this.setGCPDestination();
                this.onClickHeaderHandler({target: getGlobusElement(this.searchGroup.parentElement, GLOBUS_HEADER)});
            }
            else if (e.target.matches(`.${FILEMANAGER_OPTION_DELETE}`)) {
                this.deleteSelected(globusParentGroup).then(r => {this.retrieveDirectoryContents(filePathInput, fileList); console.log(r)}).catch(e => console.log(e));
            }
            else if (e.target.matches(`.${FILEMANAGER_OPTION_NEWFOLDER}`)) {
                this.createNewDirectory(globusParentGroup);
            }
            else if (e.target.matches(`.${FILEMANAGER_OPTION_RENAME}`)) {
                this.renameFile(globusParentGroup);
            }
        }
        else if (!e.target.matches(`.${FILEMANAGER_MENU_OPTIONS}`)) {
            dirOptions.hidden = true;
        }
    }

    private onClickHeaderHandler(e: any) {
        let globusParentGroup: HTMLElement = getGlobusParentGroup(e.target);
        let infoDiv: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_SEARCH_INFO);
        let searchGroup: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_SEARCH_GROUP);

        if (searchGroup.style.display === 'flex') {
            searchGroup.style.display = 'none';
            infoDiv.style.display = 'block';
        }
        else {
            searchGroup.style.display = 'flex';
            infoDiv.style.display = 'none';
        }

        e.target.classList.toggle(GLOBUS_ACTIVE);
    }

    private onClickGlobusGroupHandler(e: any) {
        this.parentGroup$.next(e.currentTarget);
    }

    private async startTransfer(e: any) {
        let sourcePathInput: HTMLInputElement = getGlobusElement(this.sourceGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;
        let sourceEndpoint: HTMLElement = getGlobusElement(this.sourceGroup, GLOBUS_OPEN);

        let destinationPathInput: HTMLInputElement = getGlobusElement(this.destinationGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;
        let destinationEndpoint: HTMLElement = getGlobusElement(this.destinationGroup, GLOBUS_OPEN);
        let transferResult: HTMLElement = getGlobusElement(this.transferGroup, FILEMANAGER_TRANSFER_RESULT);

        transferResult.style.display = 'block';
        transferResult.textContent = '';
        transferResult.className = `${FILEMANAGER_TRANSFER_RESULT} ${GLOBUS_BORDER}`;
        transferResult.appendChild(LOADING_ICON);

        if (!sourceEndpoint || !destinationEndpoint) {
            transferResult.textContent = 'Both endpoints must be selected to start transfer';
            transferResult.classList.add(GLOBUS_FAIL);
            return;
        }

        let selectedElements = this.sourceGroup.getElementsByClassName(GLOBUS_SELECTED);

        let items: GlobusTransferItem[] = [];

        for (let i = 0; i < selectedElements.length; i++) {
            let file = (selectedElements[i] as HTMLLIElement);
            let fileData: GlobusFileItem = $.data(file, 'data');
            console.log(fileData);
            let transferItem: GlobusTransferItem = {
                'DATA_TYPE': 'transfer_item',
                'source_path': `${sourcePathInput.value}${fileData.name}`,
                'destination_path': `${destinationPathInput.value}${fileData.name}`,
                'recursive': fileData.type === 'dir'
            };

            items.push(transferItem);
        }

        let options = {};
        [].reduce.call(e.target.parentElement.elements, (data: any, element: any) => {
            if (element.type === 'checkbox') {
                data[element.name] = element.checked;
            }
            else {
                data[element.name] = element.value;
            }
            return data;
        }, options);

        let submissionId: GlobusSubmissionId = await requestSubmissionId();

        let taskTransfer: GlobusTransferTask = {
            DATA_TYPE: 'transfer',
            submission_id: submissionId.value,
            source_endpoint: sourceEndpoint.id,
            destination_endpoint: destinationEndpoint.id,
            DATA: items,
            notify_on_succeeded: false,
            notify_on_failed: false,
            ...options
        };

        console.log(taskTransfer);
        submitTask(taskTransfer).then(data => {
            transferResult.textContent = data.message;
            transferResult.classList.add(GLOBUS_SUCCESS)
        }).catch(e => {
            console.log(e);
            transferResult.textContent = e.message;
            transferResult.classList.add(GLOBUS_FAIL);
        });
    }

    private sortFiles(e: any) {
        let globusParentGroup = getGlobusParentGroup(e.target);
        let fileList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_LIST) as HTMLUListElement;
        let sortOptions: HTMLSelectElement = getGlobusElement(globusParentGroup, FILEMANAGER_SORT_OPTIONS) as HTMLSelectElement;
        let sortButton: HTMLButtonElement = getGlobusElement(globusParentGroup, FILEMANAGER_SORT_BUTTON) as HTMLButtonElement;

        if (e.target.matches(`.${FILEMANAGER_SORT_BUTTON}`)) {
            sortButton.classList.toggle(GLOBUS_ACTIVE);
        }
        else if (e.target.matches(`.${FILEMANAGER_SORT_OPTIONS}`)) {
            sortButton.classList.remove(GLOBUS_ACTIVE);
        }

        sortList(fileList, sortOptions.options[sortOptions.selectedIndex].value);
    }

    private toggleElementVisibility(element: HTMLElement, e: any) {
        e.target.classList.toggle(GLOBUS_ACTIVE);
        if (element.style.display === 'none') {
            element.style.display = 'block';
        }
        else {
            element.style.display = 'none';
        }
    }

    private async deleteSelected(globusParentGroup: HTMLElement) {
        let pathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;
        let endpoint: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_OPEN);

        let selectedElements = globusParentGroup.getElementsByClassName(GLOBUS_SELECTED);

        let items: GlobusDeleteItem[] = [];
        let recursive: boolean = false;
        let submissionId = await requestSubmissionId();

        for (let i = 0; i < selectedElements.length; i++) {
            let file = (selectedElements[i] as HTMLLIElement) ;
            let fileData: GlobusFileItem = $.data(file, 'data');
            let deleteItem: GlobusDeleteItem = {
                DATA_TYPE: 'delete_item',
                path: `${pathInput.value}${fileData.name}`,
            };

            if (fileData.type === 'dir') {
                recursive = true;
            }

            items.push(deleteItem);
        }

        let taskDelete: GlobusDeleteTask = {
            DATA_TYPE: 'delete',
            endpoint: endpoint.id,
            recursive: recursive,
            DATA: items,
            submission_id: submissionId.value,
            notify_on_succeeded: false,
            notify_on_failed: false
        };

        return submitTask(taskDelete);
    }

    private createNewDirectory(globusParentGroup: HTMLElement) {
        let fileList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_LIST) as HTMLUListElement;
        let filePathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;
        let endpoint: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_OPEN);
        let newDir: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_NEWDIR);

        if (newDir) {
            return;
        }

        let newDirectory: HTMLLIElement = document.createElement('li');
        newDirectory.className = `${GLOBUS_LIST_ITEM} ${FILEMANAGER_DIR_TYPE} ${FILEMANAGER_NEWDIR}`;

        let nameInput: HTMLInputElement = document.createElement('input');
        nameInput.placeholder = 'New Folder';
        nameInput.className = `${GLOBUS_INPUT} ${GLOBUS_BORDER} ${FILEMANAGER_NEWDIR_INPUT}`;
        nameInput.focus();
        let acceptButton: HTMLDivElement = document.createElement('div');
        acceptButton.className = `${FILEMANAGER_NEWDIR_ACCEPT}`;
        acceptButton.addEventListener('click', () => {
            let operation: GlobusNewDirectoryOperation = {
                DATA_TYPE: 'mkdir',
                path: `${filePathInput.value}${nameInput.value}`
            };
            submitOperation(endpoint.id,  operation).then(r => {
                this.retrieveDirectoryContents(filePathInput, fileList);
                console.log(r);
            }).catch(e => console.log(e));
        });
        let cancelButton: HTMLDivElement = document.createElement('div');
        cancelButton.className = `${FILEMANAGER_NEWDIR_CANCEL}`;
        cancelButton.addEventListener('click', () => {
            fileList.removeChild(newDirectory);
        });

        newDirectory.appendChild(nameInput);
        newDirectory.appendChild(acceptButton);
        newDirectory.appendChild(cancelButton);

        fileList.insertBefore(newDirectory, fileList.childNodes[0]);
    }

    private renameFile(globusParentGroup: HTMLElement) {
        let fileList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_LIST) as HTMLUListElement;
        let filePathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;
        let selected: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_SELECTED);
        let endpoint: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_OPEN);

        let nameElement = selected.firstChild;

        let nameInput: HTMLInputElement = document.createElement('input');
        nameInput.value = nameElement.textContent;
        nameInput.style.color = 'black';
        nameInput.addEventListener('change', () => {
            let operation: GlobusRenameOperation = {
                DATA_TYPE: 'rename',
                old_path: `${filePathInput.value}${nameElement.textContent}`,
                new_path: `${filePathInput.value}${nameInput.value}`
            };
            submitOperation(endpoint.id, operation).then(r => {
                nameElement.textContent = nameInput.value;
                console.log(r);
            }).catch(e => {
                this.retrieveDirectoryContents(filePathInput, fileList);
            });

            selected.removeChild(nameInput);
            (nameElement as HTMLElement).style.display = 'block';
        });
        nameInput.focus();
        (nameElement as HTMLElement).style.display = 'none';
        selected.insertBefore(nameInput, nameElement);
    };

    private setGCPDestination() {
        let endpointInput: HTMLInputElement = getGlobusElement(this.destinationGroup, FILEMANAGER_ENDPOINT_INPUT) as HTMLInputElement;
        let endpointList: HTMLUListElement = getGlobusElement(this.destinationGroup, FILEMANAGER_ENDPOINT_LIST) as HTMLUListElement;

        endpointInput.value = 'Your GCP Endpoint';
        endpointList.style.display = 'block';

        endpointList.appendChild(LOADING_ICON);
        endpointList.appendChild(LOADING_LABEL);
        this.fetchEndpoints(GCP_ENDPOINT_ID, endpointList).then(() => {
            endpointList.removeChild(LOADING_ICON);
            endpointList.removeChild(LOADING_LABEL);
        });

        this.parentGroup$.next(this.destinationGroup);
    }

    // TODO break up into classes
    private createHTMLElements() {
        /* ------------- <endpointSearch> ------------- */

        let endpointInput: HTMLInputElement = document.createElement('input');
        endpointInput.className = `${GLOBUS_INPUT} ${FILEMANAGER_ENDPOINT_INPUT} ${GLOBUS_BORDER}`;
        endpointInput.placeholder = 'Search collections';

        let endpointList: HTMLUListElement = document.createElement('ul');
        endpointList.className = `${GLOBUS_LIST} ${FILEMANAGER_ENDPOINT_LIST} ${GLOBUS_BORDER}`;
        endpointList.style.display = 'none';

        let endpointGroup: HTMLDivElement = document.createElement('div');
        endpointGroup.className = `${GLOBUS_DISPLAY_FLEX} ${FILEMANAGER_ENDPOINT_GROUP}`;
        endpointGroup.appendChild(endpointInput);
        endpointGroup.appendChild(endpointList);
        endpointGroup.style.display = 'flex';

        /* ------------- </endpointSearch> ------------- */


        /* ------------- <dirSearch> ------------- */

        // DirPath Input. Hidden
        let filePathInput: HTMLInputElement = document.createElement('input');
        filePathInput.className = `${GLOBUS_INPUT} ${FILEMANAGER_FILE_PATH_INPUT} ${GLOBUS_BORDER}`;
        filePathInput.value = '/~/';

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

        let optionPlaceholder: HTMLOptionElement = document.createElement('option');
        optionPlaceholder.textContent = 'Sort By';
        optionPlaceholder.disabled = true;
        optionPlaceholder.selected = true;

        let optionName: HTMLOptionElement = document.createElement('option');
        optionName.textContent = 'Name';
        optionName.value = 'name';

        let optionLastModified: HTMLOptionElement = document.createElement('option');
        optionLastModified.textContent = 'Last Modified';
        optionLastModified.value = 'date';

        let optionSize: HTMLOptionElement = document.createElement('option');
        optionSize.textContent = 'Size';
        optionSize.value = 'size';

        let optionType: HTMLOptionElement = document.createElement('option');
        optionType.textContent = 'Type';
        optionType.value = 'type';

        let sortOptions: HTMLSelectElement = document.createElement('select');
        sortOptions.className = `${FILEMANAGER_SORT_OPTIONS} ${GLOBUS_BORDER}`;
        sortOptions.addEventListener('change', this.sortFiles);
        sortOptions.appendChild(optionPlaceholder);
        sortOptions.appendChild(optionName);
        sortOptions.appendChild(optionLastModified);
        sortOptions.appendChild(optionSize);
        sortOptions.appendChild(optionType);

        let sortButton: HTMLDivElement = document.createElement('div');
        sortButton.className = `${FILEMANAGER_SORT_BUTTON} ${GLOBUS_BORDER}`;
        sortButton.addEventListener('click', this.sortFiles);

        let sortGroup: HTMLDivElement = document.createElement('div');
        sortGroup.className = `${FILEMANAGER_SORT_GROUP}`;
        sortGroup.appendChild(sortOptions);
        sortGroup.appendChild(sortButton);
        sortGroup.style.display = 'none';

        let fileList: HTMLUListElement = document.createElement('ul');
        fileList.className = `${GLOBUS_LIST} ${FILEMANAGER_FILE_LIST} ${GLOBUS_BORDER}`;

        // let shareOption = document.createElement('li'); TODO uncomment when supported
        // shareOption.className = `${GLOBUS_LIST_ITEM} ${FILEMANAGER_MENU_OPTION} ${FILEMANAGER_OPTION_SHARE}`;
        // shareOption.textContent = 'Share';

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
        // dirOptions.appendChild(shareOption);
        dirOptions.appendChild(transferOption);
        dirOptions.appendChild(newFolderOption);
        dirOptions.appendChild(renameOption);
        dirOptions.appendChild(deleteOption);
        dirOptions.hidden = true;

        let directoryGroup = document.createElement('div');
        directoryGroup.className = `${GLOBUS_DISPLAY_FLEX} ${FILEMANAGER_DIR_GROUP}`;
        directoryGroup.appendChild(filePathInput);
        directoryGroup.appendChild(dirMenu);
        directoryGroup.appendChild(sortGroup);
        directoryGroup.appendChild(fileList);
        directoryGroup.appendChild(dirOptions);
        directoryGroup.style.display = 'none';

        /* ------------- </dirSearch> ------------- */


        /* ------------- <searchGroup> ------------- */

        this.searchGroup = document.createElement('div');
        this.searchGroup.className = `${GLOBUS_DISPLAY_FLEX} ${FILEMANAGER_SEARCH_GROUP}`;
        this.searchGroup.appendChild(endpointGroup);
        this.searchGroup.appendChild(directoryGroup);
        this.searchGroup.addEventListener('keyup', this.onKeyUpEndpointInputHandler.bind(this));
        this.searchGroup.addEventListener('change', this.onChangeFilePathInputHandler.bind(this));
        this.searchGroup.addEventListener('click', this.onClickDirMenuButtonHandler.bind(this));
        this.searchGroup.addEventListener('click', this.onClickMenuOptionHandler.bind(this));
        this.searchGroup.style.display = 'flex';

        /* -------------</searchGroup>------------- */


        /* ------------- <originalGroup> ------------- */

        this.originalGroup = document.createElement('div');
        this.originalGroup.className = GLOBUS_PARENT_GROUP;
        this.originalGroup.appendChild(this.searchGroup);
        this.originalGroup.addEventListener('click', this.onClickGlobusGroupHandler.bind(this));

        /* ------------- </originalGroup> ------------- */


        /* ------------- <sourceGroup> ------------- */
        /* Source screen. Hidden */
        let sourceHeader = document.createElement('div');
        sourceHeader.textContent = 'Source';
        sourceHeader.className = `${GLOBUS_HEADER} ${GLOBUS_BORDER}`;
        sourceHeader.addEventListener('click', this.onClickHeaderHandler);
        let sourceInfo = document.createElement('div');
        sourceInfo.className = `${FILEMANAGER_SEARCH_INFO} ${GLOBUS_BORDER}`;
        sourceInfo.style.display = 'none';
        this.sourceGroup = document.createElement('div');
        this.sourceGroup.className = GLOBUS_PARENT_GROUP;
        this.sourceGroup.appendChild(sourceHeader);
        this.sourceGroup.appendChild(sourceInfo);
        this.sourceGroup.addEventListener('click', this.onClickGlobusGroupHandler.bind(this));
        this.sourceGroup.style.display = 'none';

        /* ------------- <sourceGroup> ------------- */


        /* ------------- <destinationGroup> ------------- */

        this.destinationGroup = this.sourceGroup.cloneNode(true) as HTMLDivElement;
        this.destinationGroup.appendChild(this.searchGroup.cloneNode(true));
        let destinationHeader = getGlobusElement(this.destinationGroup, GLOBUS_HEADER);
        destinationHeader.textContent = 'Destination';
        destinationHeader.addEventListener('click', this.onClickHeaderHandler);
        let destinationMenuOptions = getGlobusElement(this.destinationGroup, FILEMANAGER_MENU_OPTIONS);
        destinationMenuOptions.style.display = 'none';
        this.destinationGroup.addEventListener('keyup', this.onKeyUpEndpointInputHandler.bind(this));
        this.destinationGroup.addEventListener('change', this.onChangeFilePathInputHandler.bind(this));
        this.destinationGroup.addEventListener('click', this.onClickDirMenuButtonHandler.bind(this));
        this.destinationGroup.addEventListener('click', this.onClickMenuOptionHandler.bind(this));
        this.destinationGroup.addEventListener('click', this.onClickGlobusGroupHandler.bind(this));
        this.destinationGroup.style.display = 'none';

        /* ------------- </destinationGroup> ------------- */


        /* ------------- <transferGroup> ------------- */

        let transferResult = document.createElement('div');
        transferResult.className = `${FILEMANAGER_TRANSFER_RESULT} ${GLOBUS_BORDER}`;
        transferResult.style.display = 'none';
        transferResult.addEventListener('click', () => transferResult.style.display = 'none');
        let startTransferBtn = document.createElement('div');
        startTransferBtn.textContent = 'Start';
        startTransferBtn.className = `${GLOBUS_BUTTON} ${FILEMANAGER_START_TRANSFER_BTN}`;
        startTransferBtn.addEventListener('click', this.startTransfer.bind(this));

        let optionTransferNameInput: HTMLInputElement = document.createElement('input');
        optionTransferNameInput.name = 'label';

        let optionTransferNameLabel: HTMLLabelElement = document.createElement('label');
        optionTransferNameLabel.textContent = 'sync - only transfer new or changed files\n';
        optionTransferNameLabel.insertBefore(optionTransferNameInput, optionTransferNameLabel.childNodes[0]);

        let optionSyncSelect1: HTMLOptionElement = document.createElement('option');
        optionSyncSelect1.value = '3';
        optionSyncSelect1.textContent = 'checksum is different';

        let optionSyncSelect2: HTMLOptionElement = document.createElement('option');
        optionSyncSelect2.value = '0';
        optionSyncSelect2.textContent = 'file does not exist on destination';

        let optionSyncSelect3: HTMLOptionElement = document.createElement('option');
        optionSyncSelect3.value = '1';
        optionSyncSelect3.textContent = 'file size is different';

        let optionSyncSelect4: HTMLOptionElement = document.createElement('option');
        optionSyncSelect4.value = '2';
        optionSyncSelect4.textContent = 'modification time is newer';

        let optionSyncInput: HTMLSelectElement = document.createElement('select');
        optionSyncInput.name = 'sync_level';
        optionSyncInput.appendChild(optionSyncSelect1);
        optionSyncInput.appendChild(optionSyncSelect2);
        optionSyncInput.appendChild(optionSyncSelect3);
        optionSyncInput.appendChild(optionSyncSelect4);
        optionSyncInput.style.display = 'none';

        let optionSyncCheckbox: HTMLInputElement = document.createElement('input');
        optionSyncCheckbox.type = 'checkbox';
        optionSyncCheckbox.addEventListener('change', this.toggleElementVisibility.bind(this, optionSyncInput));

        let optionSyncLabel: HTMLLabelElement = document.createElement('label');
        optionSyncLabel.textContent = 'sync - only transfer new or changed files\n';
        optionSyncLabel.insertBefore(optionSyncCheckbox, optionSyncLabel.childNodes[0]);
        optionSyncLabel.appendChild(optionSyncInput);

        let optionDeleteInput: HTMLInputElement = document.createElement('input');
        optionDeleteInput.type = 'checkbox';
        optionDeleteInput.name = 'delete_destination_extra';

        let optionDeleteLabel: HTMLLabelElement = document.createElement('label');
        optionDeleteLabel.textContent = 'delete files on destination that do not exist on source\n';
        optionDeleteLabel.insertBefore(optionDeleteInput, optionDeleteLabel.childNodes[0]);

        let optionPreserveInput: HTMLInputElement = document.createElement('input');
        optionPreserveInput.type = 'checkbox';
        optionPreserveInput.name = 'preserve_timestamp';

        let optionPreserveLabel: HTMLLabelElement = document.createElement('label');
        optionPreserveLabel.textContent = 'preserve source file modification times\n';
        optionPreserveLabel.insertBefore(optionPreserveInput, optionPreserveLabel.childNodes[0]);

        let optionVerifyInput: HTMLInputElement = document.createElement('input');
        optionVerifyInput.type = 'checkbox';
        optionVerifyInput.checked = true;
        optionVerifyInput.name = 'verify_checksum';

        let optionVerifyLabel: HTMLLabelElement = document.createElement('label');
        optionVerifyLabel.textContent = 'verify file integrity after transfer\n';
        optionVerifyLabel.insertBefore(optionVerifyInput, optionVerifyLabel.childNodes[0]);

        let optionEncryptInput: HTMLInputElement = document.createElement('input');
        optionEncryptInput.type = 'checkbox';
        optionEncryptInput.name = 'encrypt_data';

        let optionEncryptLabel: HTMLLabelElement = document.createElement('label');
        optionEncryptLabel.textContent = 'encrypt transfer';
        optionEncryptLabel.insertBefore(optionEncryptInput, optionEncryptLabel.childNodes[0]);

        let transferOptions = document.createElement('div');
        transferOptions.appendChild(optionSyncLabel);
        transferOptions.appendChild(optionDeleteLabel);
        transferOptions.appendChild(optionPreserveLabel);
        transferOptions.appendChild(optionVerifyLabel);
        transferOptions.appendChild(optionEncryptLabel);
        transferOptions.className = `${GLOBUS_BORDER} ${FILEMANAGER_TRANSFER_OPTIONS}`;
        transferOptions.style.display = 'none';

        let transferOptionsBtn = document.createElement('div');
        transferOptionsBtn.style.cursor = 'pointer';
        transferOptionsBtn.textContent = 'Transfer & Sync Options';
        transferOptionsBtn.className = `${GLOBUS_BUTTON} ${FILEMANAGER_TRANSFER_OPTIONS_BTN}`;
        transferOptionsBtn.addEventListener('click', this.toggleElementVisibility.bind(this, transferOptions));

        this.transferGroup = document.createElement('form');
        this.transferGroup.className = GLOBUS_PARENT_GROUP;
        this.transferGroup.appendChild(transferResult);
        this.transferGroup.appendChild(startTransferBtn);
        this.transferGroup.appendChild(transferOptionsBtn);
        this.transferGroup.appendChild(transferOptions);
        this.transferGroup.style.display = 'none';

        /* ------------- </transferGroup> ------------- */


        this.node.appendChild(this.originalGroup);
        this.node.appendChild(this.sourceGroup);
        this.node.appendChild(this.destinationGroup);
        this.node.appendChild(this.transferGroup);

        this.parentGroup$ = new BehaviorSubject(this.originalGroup);
        this.parentGroup$.subscribe(globusParentGroup => {
                let selectedItems = globusParentGroup.getElementsByClassName(GLOBUS_SELECTED);

                let menuSelect: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_MENU_SELECT);
                if (menuSelect) {
                    selectedItems.length === 0 ?  menuSelect.textContent = 'select all' : menuSelect.textContent = 'select none';
                }

                let infoDiv: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_SEARCH_INFO);
                if (infoDiv) {
                    let groupHeader: HTMLElement = getGlobusElement(globusParentGroup, GLOBUS_HEADER);
                    let endpointList: HTMLUListElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_LIST) as HTMLUListElement;
                    let endpointInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_ENDPOINT_INPUT) as HTMLInputElement;
                    let filePathInput: HTMLInputElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;

                    if (endpointList.style.display === 'none') {
                        infoDiv.textContent = `${endpointInput.value}: ${filePathInput.value}`;
                        if (groupHeader.textContent === 'Source') {
                            infoDiv.textContent += `\n${selectedItems.length} file(s) selected`;
                        }
                    }
                    else {
                        infoDiv.textContent = 'No endpoint selected'
                    }
                }

                let optionDelete: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_OPTION_DELETE);
                if (optionDelete) {
                    selectedItems.length === 0 ? optionDelete.classList.add(GLOBUS_DISABLED) : optionDelete.classList.remove(GLOBUS_DISABLED);
                }

                let optionRename: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_OPTION_RENAME);
                if (optionRename) {
                    selectedItems.length !== 1 ? optionRename.classList.add(GLOBUS_DISABLED) : optionRename.classList.remove(GLOBUS_DISABLED);
                }

                let optionNewFolder: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_OPTION_NEWFOLDER);
                if (optionNewFolder) {
                    let fileList: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_FILE_LIST);
                    fileList.firstChild && (fileList.firstChild as HTMLElement).classList.contains(GLOBUS_FETCH_ERROR) ?
                        optionNewFolder.classList.add(GLOBUS_DISABLED) :
                        optionNewFolder.classList.remove(GLOBUS_DISABLED);
                }

                // let optionShare: HTMLElement = getGlobusElement(globusParentGroup, FILEMANAGER_OPTION_SHARE); TODO uncomment when supported
                // if (optionShare) {
                //     switch (selectedItems.length) {
                //         case 0:
                //             optionShare.classList.remove(GLOBUS_DISABLED);
                //             break;
                //         case 1:
                //             (selectedItems.item(0) as HTMLLIElement).type === 'dir' ?
                //                 optionShare.classList.remove(GLOBUS_DISABLED) :
                //                 optionShare.classList.add(GLOBUS_DISABLED);
                //             break;
                //         default:
                //             optionShare.classList.add(GLOBUS_DISABLED);
                //             break;
                //     }
                // }
            },
            e => {
                console.log(e)
            },
            () => {
                console.log('Completed')
            });
    }

    transferFile(files: {endpointId: string, path: string, fileNames: string[]}) {
        removeChildren(this.node);
        this.createHTMLElements();
        let endpointInput: HTMLInputElement = getGlobusElement(this.originalGroup, FILEMANAGER_ENDPOINT_INPUT) as HTMLInputElement;
        let endpointList: HTMLUListElement = getGlobusElement(this.originalGroup, FILEMANAGER_ENDPOINT_LIST) as HTMLUListElement;
        let filePathInput: HTMLInputElement = getGlobusElement(this.originalGroup, FILEMANAGER_FILE_PATH_INPUT) as HTMLInputElement;
        let fileList: HTMLUListElement = getGlobusElement(this.originalGroup, FILEMANAGER_FILE_LIST) as HTMLUListElement;
        let optionTranfer: HTMLElement = getGlobusElement(this.originalGroup, FILEMANAGER_OPTION_TRANSFER);

        endpointInput.value = files.endpointId;
        filePathInput.value = files.path;

        this.retrieveEndpoints(endpointInput, endpointList).then(() => {
            this.endpointClicked({currentTarget: endpointList.firstChild}).then(() => {
                this.onClickMenuOptionHandler({target: optionTranfer});
                this.retrieveDirectoryContents(filePathInput, fileList).then(() => {
                    for (let i = 0; i < fileList.children.length; i++) {
                        if (files.fileNames.indexOf((fileList.children[i].firstChild as HTMLElement).title) > -1) {
                            fileList.children[i].classList.add(GLOBUS_SELECTED);
                        }
                    }
                    this.parentGroup$.next(this.sourceGroup);
                });
            });
        });
    }
}