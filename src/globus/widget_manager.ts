import {Widget, PanelLayout} from '@phosphor/widgets';
import {Toolbar, ToolbarButton} from "@jupyterlab/apputils";
import {signOut} from "./client";
import {GlobusHome} from "./home";
import {FILE_MANAGER, GlobusFileManager} from "./widgets/file_manager";
import {CONNECT_PERSONAL, GlobusConnectPersonal} from "./widgets/globus_connect_personal";
import {IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {IDocumentManager} from '@jupyterlab/docmanager';
import {ACTIVITY, GlobusActivity} from "./widgets/activity";


// TODO active toolbar button css
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

    constructor(manager: IDocumentManager, factory: IFileBrowserFactory) {
        super();
        this.id = 'globus-manager';
        this.addClass(GLOBUS_MANAGER);

        this.layout = new PanelLayout();

        // Create toolbar
        this.toolbar = new Toolbar<Widget>();
        this.toolbar.addClass(GLOBUS_TOOLBAR);
        this.createToolbarButtons();
        (this.layout as PanelLayout).addWidget(this.toolbar);

        // Initialize widgets
        let connectPersonalWidget = new GlobusConnectPersonal(manager, factory);
        this.widgetMap[connectPersonalWidget.id] = connectPersonalWidget;

        let fileManagerWidget = new GlobusFileManager();
        this.widgetMap[fileManagerWidget.id] = fileManagerWidget;

        let activityWidget = new GlobusActivity();
        this.widgetMap[activityWidget .id] = activityWidget;
        /* Add additional widgets here:
        *
        *
        * */


        // Show file manager widget as default
        this.currentWidgetId = connectPersonalWidget.id;
        (this.layout as PanelLayout).addWidget(connectPersonalWidget);

        this.header = document.createElement('header');
        this.header.textContent = connectPersonalWidget.title.label;
        this.header.className = GLOBUS_WIDGET_HEADER;
        this.node.insertBefore(this.header, this.node.childNodes[1]);
    }

    private createToolbarButtons() {
        // File Manager button
        let connectPersonalButton = new ToolbarButton({
            onClick: () => {
                this.switchToWidget(CONNECT_PERSONAL);
            },
            tooltip: `Globus Connect Personal`
        });
        connectPersonalButton.addClass(GLOBUS_CONNECT_PERSONAL_BTN);
        connectPersonalButton.addClass(GLOBUS_TOOLBAR_BTN);
        this.toolbar.addItem('connectpersonal', connectPersonalButton);

        // File Manager button
        let fileManagerButton = new ToolbarButton({
            onClick: () => {
                this.switchToWidget(FILE_MANAGER);
            },
            tooltip: `File Manager`
        });
        fileManagerButton.addClass(GLOBUS_FILEMANAGER_BTN);
        fileManagerButton.addClass(GLOBUS_TOOLBAR_BTN);
        this.toolbar.addItem('filemanager', fileManagerButton);

        // File Manager button
        let activityButton = new ToolbarButton({
            onClick: () => {
                this.switchToWidget(ACTIVITY);
            },
            tooltip: `File Manager`
        });
        fileManagerButton.addClass(GLOBUS_ACTIVITY_BTN);
        fileManagerButton.addClass(GLOBUS_TOOLBAR_BTN);
        this.toolbar.addItem('filemanager', activityButton);

        // Logout button
        let logoutButton = new ToolbarButton({
            onClick: () => {
                this.signOut();
            },
            tooltip: `Sign Out`
        });
        logoutButton.addClass(GLOBUS_SIGNOUT_BTN);
        logoutButton.addClass(GLOBUS_TOOLBAR_BTN);
        this.toolbar.addItem('logout', logoutButton);
    }

    private signOut(): void {
        // Do the actual sign-out.
        signOut();
        (this.parent as GlobusHome).showLoginScreen();
        this.parent = null;
        this.dispose();
    }

    switchToWidget(id: string) {
        console.log(id);
        if (id !== this.currentWidgetId) {
            console.log('switching widget');
            this.widgetMap[this.currentWidgetId].parent = null;
            (this.layout as PanelLayout).addWidget(this.widgetMap[id]);
            this.header.textContent = this.widgetMap[id].title.label;
            this.node.insertBefore(this.header, this.node.childNodes[1]);
            this.currentWidgetId = id;
        }
        else {
            this.widgetMap[this.currentWidgetId].update();
        }
    }
}
