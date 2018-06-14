import {Widget, PanelLayout} from '@phosphor/widgets';
import {Toolbar, ToolbarButton} from "@jupyterlab/apputils";
import {signOut} from "./client";
import {GlobusHome, SIGN_OUT} from "./home";
import {GlobusFileManager} from "./widgets/file_manager";
import {CONNECT_PERSONAL, GlobusConnectPersonal} from "./widgets/globus_connect_personal";
import {IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {IDocumentManager} from '@jupyterlab/docmanager';
import {GlobusActivity} from "./widgets/activity";
import {JupyterLab} from "@jupyterlab/application";
import {GLOBUS_HEADER} from "../utils";


/**
 * CSS classes
 */
const GLOBUS_WIDGET_MANAGER = 'jp-Globus-widgetManager';
const GLOBUS_TOOLBAR = 'jp-WidgetManager-toolbar';
const GLOBUS_TOOLBAR_BTN = 'jp-WidgetManager-toolbarBtn';
const GLOBUS_CONNECT_PERSONAL_BTN = 'jp-WidgetManager-connectPersonalBtn';
const GLOBUS_FILEMANAGER_BTN = 'jp-WidgetManager-fileManagerBtn';
const GLOBUS_ACTIVITY_BTN = 'jp-WidgetManager-activityBtn';
const GLOBUS_SIGNOUT_BTN = 'jp-WidgetManager-signOutBtn';
const GLOBUS_WIDGET_HEADER = 'jp-WidgetManager-header';


interface WidgetMap {
    [id: string]: Widget
}

/**
 * Widget for hosting the Globus Home.
 */
export class GlobusWidgetManager extends Widget {

    private toolbar: Toolbar<Widget>;
    private currentWidgetId: string;
    private header: HTMLElement;
    private widgetMap: WidgetMap = {};
    private factory: IFileBrowserFactory;
    private manager: IDocumentManager;
    private app: JupyterLab;

    constructor(app: JupyterLab, manager: IDocumentManager, factory: IFileBrowserFactory) {
        super();
        this.id = 'globus-manager';
        this.addClass(GLOBUS_WIDGET_MANAGER);
        this.factory = factory;
        this.manager = manager;
        this.app = app;

        this.layout = new PanelLayout();

        this.toolbar = new Toolbar<Widget>();
        this.toolbar.addClass(GLOBUS_TOOLBAR);
        (this.layout as PanelLayout).addWidget(this.toolbar);

        this.createWidgets();

        // Logout button
        let signOutButton = new ToolbarButton({
            onClick: () => {
                this.signOut();
            },
            tooltip: `Sign Out`
        });
        signOutButton.addClass(GLOBUS_SIGNOUT_BTN);
        signOutButton.addClass(GLOBUS_TOOLBAR_BTN);
        this.toolbar.addItem(SIGN_OUT, signOutButton);

        this.header = document.createElement('header');
        this.header.className = `${GLOBUS_WIDGET_HEADER} ${GLOBUS_HEADER}`;
    }

    private createToolbarButton(widget: Widget, cssClass: string = '') {
        let that = this;
        let toolbarButton = new ToolbarButton({
            onClick: () => {
                // let buttons = this.parentElement.children;
                // for (let i = 0; i < buttons.length; i++) {
                //     if (buttons[i].classList.contains(GLOBUS_SELECTED)) {
                //         buttons[i].classList.remove(GLOBUS_SELECTED);
                //     }
                // }
                that.switchToWidget(widget.id);
            },
            tooltip: widget.title.label
        });
        toolbarButton.addClass(cssClass);
        toolbarButton.addClass(GLOBUS_TOOLBAR_BTN);
        this.toolbar.addItem(widget.id, toolbarButton);
    }

    onUpdateRequest() {
        this.switchToWidget(CONNECT_PERSONAL);
    }

    private signOut(): void {
        signOut();
        (this.parent as GlobusHome).showLoginScreen();
        this.parent = null;
    }

    private switchToWidget(id: string) {
        if (id !== this.currentWidgetId) {
            if (this.widgetMap[this.currentWidgetId]) {
                this.widgetMap[this.currentWidgetId].parent = null;
            }
            this.currentWidgetId = id;
            (this.layout as PanelLayout).addWidget(this.widgetMap[id]);
            this.header.textContent = this.widgetMap[id].title.label;
            this.node.insertBefore(this.header, this.node.childNodes[1]);
        }

        this.widgetMap[this.currentWidgetId].update();
    }

    private createWidgets() {
        // Initialize widgets
        let connectPersonalWidget = new GlobusConnectPersonal(this.app, this.manager, this.factory);
        this.widgetMap[connectPersonalWidget.id] = connectPersonalWidget;
        this.createToolbarButton(connectPersonalWidget, GLOBUS_CONNECT_PERSONAL_BTN);

        let fileManagerWidget = new GlobusFileManager();
        this.widgetMap[fileManagerWidget.id] = fileManagerWidget;
        this.createToolbarButton(fileManagerWidget, GLOBUS_FILEMANAGER_BTN);

        let activityWidget = new GlobusActivity();
        this.widgetMap[activityWidget .id] = activityWidget;
        this.createToolbarButton(activityWidget, GLOBUS_ACTIVITY_BTN);
        /* Add additional widgets here:
        *
        *
        * */
    }
}
