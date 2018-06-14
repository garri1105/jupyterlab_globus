import {Widget} from '@phosphor/widgets';
import {
    displayError, getGlobusElement, GLOBUS_BORDER, GLOBUS_DISPLAY_FLEX, GLOBUS_GROUP, GLOBUS_LIST, GLOBUS_LIST_ITEM,
    GLOBUS_LIST_ITEM_TITLE, GLOBUS_MENU, GLOBUS_MENU_BTN, GLOBUS_SELECTED, LOADING_ICON, LOADING_LABEL,
    removeChildren
} from "../../utils";
import {taskSearch} from "../client";

const GLOBUS_ACTIVITY = 'jp-Globus-activity';
const GLOBUS_TASK_MENU = 'jp-Activity-taskMenu';
const GLOBUS_TASK_LIST = 'jp-Activity-taskList';
const GLOBUS_MENU_RECENT = 'jp-Activity-menuRecent';
const GLOBUS_MENU_HISTORY = 'jp-Activity-menuHistory';

export const ACTIVITY = 'globus-activity';

export class GlobusActivity extends Widget {
    private parentGroup: HTMLDivElement;

    constructor() {
        super();
        this.id = ACTIVITY;
        this.addClass(GLOBUS_ACTIVITY);

        this.title.label = 'Activity';

        this.createHTMLElements();
    }

    private fetchTasks(taskList: HTMLUListElement) {
        return new Promise<void>((resolve) => {
            taskSearch().then(data => {
                if (data.DATA.length > 0) {
                    this.displayTasks(data, taskList);
                }
                else {
                    displayError({customMessage: 'No tasks found'}, taskList);
                }
                resolve();
            });
        });
    }

    private displayTasks(data: any, taskList: HTMLUListElement) {
        for (let i = 0; i < data.DATA.length; i++) {
            let taskData = data.DATA[i];

            let task: HTMLLIElement = document.createElement('li');
            task.className = GLOBUS_LIST_ITEM;
            task.id = taskData.task_id;
            task.title = taskData.destination_endpoint_display_name;

            let title: HTMLDivElement = document.createElement('div');
            title.textContent = taskData.destination_endpoint_display_name;
            title.className = GLOBUS_LIST_ITEM_TITLE;

            let completionTime: HTMLDivElement = document.createElement('div');
            completionTime.textContent = taskData.completion_time;

            task.appendChild(title);
            task.appendChild(completionTime);

            task.addEventListener("click", this.taskClicked.bind(this));
            taskList.appendChild(task);
        }
    }

    private retrieveTasks(taskList: HTMLUListElement) {
        taskList.style.display = 'block';

        removeChildren(taskList);
        LOADING_LABEL.textContent = 'Loading Collections...';
        taskList.appendChild(LOADING_ICON);
        taskList.appendChild(LOADING_LABEL);
        this.fetchTasks(taskList).then(() => {
            taskList.removeChild(LOADING_ICON);
            taskList.removeChild(LOADING_LABEL);
        });
    }

    private taskClicked() {
        console.log('clicked')
    };

    private createHTMLElements() {
        /* ------------- <taskList> ------------- */
        let menuRecent: HTMLDivElement = document.createElement('div');
        menuRecent.className = `${GLOBUS_MENU_BTN} ${GLOBUS_MENU_RECENT}`;
        menuRecent.textContent = 'Recent';
        let menuHistory: HTMLDivElement = document.createElement('div');
        menuHistory.className = `${GLOBUS_MENU_BTN} ${GLOBUS_MENU_HISTORY}`;
        menuHistory.textContent = 'History';

        let taskMenu = document.createElement('div');
        taskMenu.className = `${GLOBUS_MENU} ${GLOBUS_TASK_MENU} ${GLOBUS_BORDER}`;
        taskMenu.appendChild(menuRecent);
        taskMenu.appendChild(menuHistory);

        let taskList: HTMLUListElement = document.createElement('ul');
        taskList.className = `${GLOBUS_LIST} ${GLOBUS_TASK_LIST} ${GLOBUS_BORDER}`;

        // Path Input container for adding extra elements
        let taskGroup = document.createElement('div');
        taskGroup.appendChild(taskMenu);
        taskGroup.appendChild(taskList);

        /* ------------- </taskList> ------------- */


        /* ------------- <parentGroup> ------------- */

        this.parentGroup = document.createElement('div');
        this.parentGroup.appendChild(taskGroup);
        this.parentGroup.className = `${GLOBUS_DISPLAY_FLEX} ${GLOBUS_GROUP}`;
        this.parentGroup.addEventListener('click', this.onClickMenuButtonHandler.bind(this));

        /* -------------</parentGroup>------------- */

        this.node.appendChild(this.parentGroup);
    }

    onUpdateRequest() {
        this.onClickMenuButtonHandler({target: getGlobusElement(this.parentGroup, GLOBUS_MENU_RECENT)});
    }

    private onClickMenuButtonHandler(e: any) {
        if (e.target.matches(`.${GLOBUS_MENU_BTN}`)) {
            let buttons = e.target.parentElement.children;
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains(GLOBUS_SELECTED)) {
                    buttons[i].classList.remove(GLOBUS_SELECTED);
                }
            }

            e.target.classList.add(GLOBUS_SELECTED);

            if (e.target.matches(`.${GLOBUS_MENU_RECENT}`)) {
                let taskList = getGlobusElement(this.parentGroup, GLOBUS_LIST);
                this.retrieveTasks(taskList as HTMLUListElement);
            }
            else if (e.target.matches(`.${GLOBUS_MENU_HISTORY}`)) {

            }
        }
    }

}