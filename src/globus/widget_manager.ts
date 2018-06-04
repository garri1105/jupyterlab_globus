import {Widget, PanelLayout} from '@phosphor/widgets';
import {Toolbar, ToolbarButton} from "@jupyterlab/apputils";
import {signOut} from "../client";
import {GlobusHome} from "./home";
import {FILE_MANAGER, GlobusFileManager} from "./widgets/file_manager";

/**
 * CSS classes
 */
const GLOBUS_MANAGER = 'jp-Globus-manager';
const GLOBUS_TOOLBAR = 'jp-Globus-toolbar';
const GLOBUS_TOOLBAR_BTN = 'jp-Globus-toolbarBtn';
const GLOBUS_SIGNOUT_BTN = 'jp-Globus-signOutBtn';
const GLOBUS_FILEMANAGER_BTN = 'jp-Globus-fileManagerBtn';
const GLOBUS_WIDGET_HEADER = 'jp-Globus-widgetHeader';


interface WidgetMap {
    [id: string]: Widget
}

/**
 * Widget for hosting the Globus Home.
 */
export class GlobusWidgetManager extends Widget {

    private toolbar: Toolbar<Widget>;
    private logoutButton: ToolbarButton;
    private fileManagerButton: ToolbarButton;
    private fileManagerWidget: GlobusFileManager;

    private currentWidgetId: string;
    private header: HTMLElement;

    private widgetMap: WidgetMap = {};

    constructor() {
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
        this.fileManagerWidget = new GlobusFileManager();
        this.widgetMap[this.fileManagerWidget.id] = this.fileManagerWidget;
        /* Add additional widgets here:
        *
        *
        * */

        // Show file manager widget as default
        (this.layout as PanelLayout).addWidget(this.fileManagerWidget);

        this.header = document.createElement('header');
        this.header.textContent = this.fileManagerWidget.title.label;
        this.header.className = GLOBUS_WIDGET_HEADER;
        this.node.insertBefore(this.header, this.node.childNodes[1]);
    }

    private createToolbarButtons() {
        // File Manager button
        this.fileManagerButton = new ToolbarButton({
            onClick: () => {
                this.switchToWidget(FILE_MANAGER);
            },
            tooltip: `File Manager`
        });
        this.fileManagerButton.addClass(GLOBUS_FILEMANAGER_BTN);
        this.fileManagerButton.addClass(GLOBUS_TOOLBAR_BTN);
        this.toolbar.addItem('filemanager', this.fileManagerButton);

        // Logout button
        this.logoutButton = new ToolbarButton({
            onClick: () => {
                this.signOut();
            },
            tooltip: `Sign Out`
        });
        this.logoutButton.addClass(GLOBUS_SIGNOUT_BTN);
        this.logoutButton.addClass(GLOBUS_TOOLBAR_BTN);
        this.toolbar.addItem('logout', this.logoutButton);
    }

    private signOut(): void {
        // Do the actual sign-out.
        signOut().then(() => {
            (this.parent as GlobusHome).showLoginScreen();
            this.parent = null;
            this.dispose();
            this.logoutButton.dispose();
        });
    }

    switchToWidget(id: string) {
        if (id !== this.currentWidgetId) {
            this.widgetMap[this.currentWidgetId].parent = null;
            (this.layout as PanelLayout).addWidget(this.widgetMap[id]);
            this.header.textContent = this.widgetMap[id].title.label;
        }
        else {
            this.widgetMap[this.currentWidgetId].update();
        }
    }
}
