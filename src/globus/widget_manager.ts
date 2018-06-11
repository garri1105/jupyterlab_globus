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


/**
 * CSS classes
 */
const GLOBUS_MANAGER = 'jp-Globus-manager';
const GLOBUS_TOOLBAR = 'jp-Globus-toolbar';
const GLOBUS_TOOLBAR_BTN = 'jp-Globus-toolbarBtn';
const GLOBUS_CONNECT_PERSONAL_BTN = 'jp-Globus-connectPersonalBtn';
const GLOBUS_FILEMANAGER_BTN = 'jp-Globus-fileManagerBtn';
const GLOBUS_ACTIVITY_BTN = 'jp-Globus-activityBtn';
const GLOBUS_SIGNOUT_BTN = 'jp-Globus-signOutBtn';
const GLOBUS_WIDGET_HEADER = 'jp-Globus-widgetHeader';


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
        this.addClass(GLOBUS_MANAGER);
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
        this.header.className = GLOBUS_WIDGET_HEADER;
    }

    private createToolbarButton(widget: Widget, cssClass: string = '') {
        let toolbarButton = new ToolbarButton({
            onClick: () => {
                this.switchToWidget(widget.id);
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
        else {
            this.widgetMap[this.currentWidgetId].update();
        }
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
