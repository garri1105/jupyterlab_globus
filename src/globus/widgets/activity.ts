import {Widget} from '@phosphor/widgets';
import {
    createDescriptionElement,
    displayError,
    getGlobusElement,
    GLOBUS_OPEN,
    GLOBUS_BORDER,
    GLOBUS_DISPLAY_FLEX,
    GLOBUS_PARENT_GROUP,
    GLOBUS_LIST,
    GLOBUS_LIST_ITEM,
    GLOBUS_LIST_ITEM_SUBTITLE,
    GLOBUS_LIST_ITEM_TITLE,
    GLOBUS_MENU,
    GLOBUS_MENU_BTN,
    GLOBUS_SELECTED,
    LOADING_ICON,
    LOADING_LABEL,
    removeChildren,
} from "../../utils";
import {taskSearch} from "../api/transfer";
import {GlobusTaskItem, GlobusTaskList} from "../api/models";
import * as moment from 'moment';
import * as $ from 'jquery';

/**
 * CSS Classes
 */
const GLOBUS_ACTIVITY = 'jp-Globus-activity';
const ACTIVITY_TASK_SUCCEEDED = 'jp-Activity-taskSuccess';
const ACTIVITY_TASK_FAILED = 'jp-Activity-taskFail';
const ACTIVITY_TASK_ACTIVE = 'jp-Activity-taskActive';
const ACTIVITY_TASK_INACTIVE = 'jp-Activity-taskInactive';
const ACTIVITY_TASK_MENU = 'jp-Activity-taskMenu';
const ACTIVITY_TASK_LIST = 'jp-Activity-taskList';
const ACTIVITY_TASK_GROUP = 'jp-Activity-taskGroup';
const ACTIVITY_OVERVIEW_MENU = 'jp-Activity-overviewMenu';
const ACTIVITY_OVERVIEW_LIST = 'jp-Activity-overviewList';
const ACTIVITY_OVERVIEW_GROUP = 'jp-Activity-overviewGroup';
const ACTIVITY_MENU_RECENT = 'jp-Activity-menuRecent';
const ACTIVITY_MENU_HISTORY = 'jp-Activity-menuHistory';
const ACTIVITY_MENU_BACK = 'jp-Activity-menuBack';
const ACTIVITY_MENU_OVERVIEW = 'jp-Activity-menuOverview';

/**
 * Activity Widget id
 */
export const ACTIVITY = 'globus-activity';

const TASK_STATUS: any = {
    'SUCCEEDED': ACTIVITY_TASK_SUCCEEDED,
    'FAILED': ACTIVITY_TASK_FAILED,
    'ACTIVE': ACTIVITY_TASK_ACTIVE,
    'INACTIVE': ACTIVITY_TASK_INACTIVE
};

/**
 * Activity widget
 */
export class GlobusActivity extends Widget {
    private parentGroup: HTMLDivElement;

    constructor() {
        super();
        this.id = ACTIVITY;
        this.addClass(GLOBUS_ACTIVITY);

        this.title.label = 'Activity';

        this.createHTMLElements();

        this.update();
    }

    /**
     * Executed when update() is called. Refreshes the widget, initializes it with the recent tab open.
     */
    onUpdateRequest() {
        this.onClickMenuButtonHandler({target: getGlobusElement(this.parentGroup, ACTIVITY_MENU_RECENT)});
    }

    /**
     * Makes an API call using taskSearch() and takes care of the response
     * @param {HTMLUListElement} taskList
     * @param {"recent" | "all"} options
     * @returns {Promise<void>}
     */
    private fetchTasks(taskList: HTMLUListElement, options: 'recent' | 'all') {
        return new Promise<void>((resolve) => {
            taskSearch().then(data => {
                if (data.DATA.length > 0) {
                    this.displayTasks(data, taskList, options);
                }
                else {
                    displayError({customMessage: 'No tasks found'}, taskList);
                }
                resolve();
            });
        });
    }

    /**
     * Displays tasks inside of taskList based on the data.
     * @param {GlobusTaskList} data
     * @param {HTMLUListElement} taskList
     * @param {"recent" | "all"} options
     */
    private displayTasks(data: GlobusTaskList, taskList: HTMLUListElement, options: 'recent' | 'all') {
        for (let i = 0; i < data.DATA.length; i++) {
            let taskData = data.DATA[i];
            if (options === 'recent' && moment().diff( moment(taskData.completion_time), 'days') > 7) {
                break;
            }

            let task: HTMLLIElement = document.createElement('li');
            task.className = `${GLOBUS_LIST_ITEM} ${TASK_STATUS[taskData.status]}`;
            task.id = taskData.task_id;

            $.data<GlobusTaskItem>(task, 'data', taskData);

            let title: HTMLDivElement = document.createElement('div');
            title.className = GLOBUS_LIST_ITEM_TITLE;
            switch (taskData.type) {
                case 'TRANSFER':
                    title.textContent = title.title = `${taskData.source_endpoint_display_name} to\n${taskData.destination_endpoint_display_name}`;
                    break;
                case 'DELETE':
                    title.textContent = title.title = `delete from\n${taskData.source_endpoint_display_name}`;
                    break;
            }

            let completionTime: HTMLDivElement = document.createElement('div');
            completionTime.className = GLOBUS_LIST_ITEM_SUBTITLE;
            completionTime.textContent = `${taskData.type.toLowerCase()} completed ${moment(taskData.completion_time).fromNow()}`;

            task.appendChild(title);
            task.appendChild(completionTime);

            task.addEventListener("click", this.taskClicked.bind(this));
            taskList.appendChild(task);
        }
    }

    /**
     * Starts the retrieval of tasks. Clears the current taskList, adds loading icons and calls fetchTasks() for the API call
     * @param {HTMLUListElement} taskList
     * @param {"recent" | "all"} options
     */
    private retrieveTasks(taskList: HTMLUListElement, options: 'recent' | 'all') {
        taskList.style.display = 'block';

        removeChildren(taskList);
        LOADING_LABEL.textContent = 'Loading Collections...';
        taskList.appendChild(LOADING_ICON);
        taskList.appendChild(LOADING_LABEL);
        this.fetchTasks(taskList, options).then(() => {
            taskList.removeChild(LOADING_ICON);
            taskList.removeChild(LOADING_LABEL);
        });
    }

    // TODO Don't remove and create new description elements everytime. Very inefficient and memory wasting
    /**
     * When task is clicked, display all metadata
     */
    private taskClicked(e: any) {
        let taskData: GlobusTaskItem = $.data(e.currentTarget, 'data');

        let overviewList: HTMLDListElement = getGlobusElement(this.parentGroup, ACTIVITY_OVERVIEW_LIST) as HTMLDListElement;
        removeChildren(overviewList);
        let taskGroup = getGlobusElement(this.parentGroup, ACTIVITY_TASK_GROUP);

        let taskClone: HTMLElement = e.currentTarget.cloneNode(true) as HTMLElement;
        taskClone.classList.add(GLOBUS_OPEN);
        overviewList.appendChild(taskClone);
        overviewList.parentElement.style.display = 'flex';
        taskGroup.style.display = 'none';

        createDescriptionElement(overviewList, 'Task ID', taskData.task_id);
        createDescriptionElement(overviewList, 'Condition', taskData.status);
        createDescriptionElement(overviewList, 'Requested', moment(taskData.request_time).format('YYYY-MM-DD hh:mm a'));
        createDescriptionElement(overviewList, 'Completed', moment(taskData.completion_time).format('YYYY-MM-DD hh:mm a'));
        createDescriptionElement(overviewList, 'Files', taskData.files);
        createDescriptionElement(overviewList, 'Directories', taskData.directories);
        createDescriptionElement(overviewList, 'Bytes Transferred', `${taskData.bytes_transferred} B`);
        createDescriptionElement(overviewList, 'Effective Speed', `${taskData.effective_bytes_per_second} B/s`);
        createDescriptionElement(overviewList, 'Pending', taskData.subtasks_pending);
        createDescriptionElement(overviewList, 'Succeeded', taskData.subtasks_succeeded);
        createDescriptionElement(overviewList, 'Cancelled', taskData.subtasks_canceled);
        createDescriptionElement(overviewList, 'Expired', taskData.subtasks_expired);
        createDescriptionElement(overviewList, 'Failed', taskData.subtasks_failed);
        createDescriptionElement(overviewList, 'Retrying', taskData.subtasks_retrying);
        createDescriptionElement(overviewList, 'Skipped', taskData.files_skipped);
    };

    private createHTMLElements() {
        /* ------------- <taskGroup> ------------- */

        let menuRecent: HTMLDivElement = document.createElement('div');
        menuRecent.className = `${GLOBUS_MENU_BTN} ${ACTIVITY_MENU_RECENT}`;
        menuRecent.textContent = 'Recent';
        let menuHistory: HTMLDivElement = document.createElement('div');
        menuHistory.className = `${GLOBUS_MENU_BTN} ${ACTIVITY_MENU_HISTORY}`;
        menuHistory.textContent = 'History';

        let taskMenu = document.createElement('div');
        taskMenu.className = `${GLOBUS_MENU} ${ACTIVITY_TASK_MENU} ${GLOBUS_BORDER}`;
        taskMenu.appendChild(menuRecent);
        taskMenu.appendChild(menuHistory);

        let taskList: HTMLUListElement = document.createElement('ul');
        taskList.className = `${GLOBUS_LIST} ${ACTIVITY_TASK_LIST} ${GLOBUS_BORDER}`;

        // Path Input container for adding extra elements
        let taskGroup = document.createElement('div');
        taskGroup.className = `${GLOBUS_DISPLAY_FLEX} ${ACTIVITY_TASK_GROUP}`;
        taskGroup.appendChild(taskMenu);
        taskGroup.appendChild(taskList);
        taskGroup.style.display = 'flex';

        /* ------------- </taskGroup> ------------- */


        /* ------------- <overviewGroup> ------------- */

        let menuBack: HTMLDivElement = document.createElement('div');
        menuBack.className = `${GLOBUS_MENU_BTN} ${ACTIVITY_MENU_BACK}`;

        let menuOverview: HTMLDivElement = document.createElement('div');
        menuOverview.className = `${GLOBUS_MENU_BTN} ${ACTIVITY_MENU_OVERVIEW}`;
        menuOverview.textContent = 'Overview';

        let overviewMenu = document.createElement('div');
        overviewMenu.className = `${GLOBUS_MENU} ${ACTIVITY_OVERVIEW_MENU} ${GLOBUS_BORDER}`;
        overviewMenu.appendChild(menuBack);
        overviewMenu.appendChild(menuOverview);

        let overviewList: HTMLDListElement = document.createElement('dl');
        overviewList.className = `${GLOBUS_LIST} ${ACTIVITY_OVERVIEW_LIST} ${GLOBUS_BORDER}`;

        let overviewGroup = document.createElement('div');
        overviewGroup.className = `${GLOBUS_DISPLAY_FLEX} ${ACTIVITY_OVERVIEW_GROUP}`;
        overviewGroup.appendChild(overviewMenu);
        overviewGroup.appendChild(overviewList);
        overviewGroup.style.display = 'none';

        /* ------------- </overviewGroup> ------------- */


        /* ------------- <parentGroup> ------------- */

        this.parentGroup = document.createElement('div');
        this.parentGroup.appendChild(taskGroup);
        this.parentGroup.appendChild(overviewGroup);
        this.parentGroup.className = `${GLOBUS_DISPLAY_FLEX} ${GLOBUS_PARENT_GROUP}`;
        this.parentGroup.addEventListener('click', this.onClickMenuButtonHandler.bind(this));

        /* -------------</parentGroup>------------- */

        this.node.appendChild(this.parentGroup);
    }

    /**
     * Handles clicks to the Recent, History and Back menu buttons
     */
    private onClickMenuButtonHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_MENU_BTN}`)) {
            let buttons = e.target.parentElement.children;
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains(GLOBUS_SELECTED)) {
                    buttons[i].classList.remove(GLOBUS_SELECTED);
                }
            }

            e.target.classList.add(GLOBUS_SELECTED);

            let taskList = getGlobusElement(this.parentGroup, GLOBUS_LIST);
            if (e.target.matches(`.${ACTIVITY_MENU_RECENT}`)) {
                this.retrieveTasks(taskList as HTMLUListElement, 'recent');
            }
            else if (e.target.matches(`.${ACTIVITY_MENU_HISTORY}`)) {
                this.retrieveTasks(taskList as HTMLUListElement, 'all');
            }
            else if (e.target.matches(`.${ACTIVITY_MENU_BACK}`)) {
                let overviewGroup = getGlobusElement(this.parentGroup, ACTIVITY_OVERVIEW_GROUP);
                let taskGroup = getGlobusElement(this.parentGroup, ACTIVITY_TASK_GROUP);
                overviewGroup.style.display = 'none';
                taskGroup.style.display = 'flex';
            }
        }
    }

}