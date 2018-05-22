import {
    Widget, PanelLayout
} from '@phosphor/widgets';
import {Toolbar, ToolbarButton} from "@jupyterlab/apputils";
import {signOut} from "./client";
import {GlobusHome} from "./home";
import {FILE_MANAGER, WidgetManager} from "./widget_manager";

/**
 * CSS classes
 */
const GLOBUS_MANAGER = 'jp-Globus-manager';
const GLOBUS_TOOLBAR = 'jp-Globus-toolbar';
const GLOBUS_TOOLBAR_BTN = 'jp-Globus-toolbarBtn';
const GLOBUS_SIGNOUT_BTN = 'jp-Globus-signOutBtn';
const GLOBUS_FILEMANAGER_BTN = 'jp-Globus-fileManagerBtn';

/**
 * Widget for hosting the Globus Home.
 */
export class GlobusToolbar extends Widget {

    private widgets: WidgetManager;
    private toolbar: Toolbar<Widget>;
    private logoutButton: ToolbarButton;
    private fileManagerButton: ToolbarButton;

    constructor() {
        super();
        this.id = 'globus-manager';
        this.addClass(GLOBUS_MANAGER);

        this.layout = new PanelLayout();
        this.widgets = new WidgetManager();
        this.toolbar = new Toolbar<Widget>();

        this.toolbar.addClass(GLOBUS_TOOLBAR);

        this.logoutButton = new ToolbarButton({
            onClick: () => {
                this.signOut();
            },
            tooltip: `Sign Out`
        });
        this.logoutButton.addClass(GLOBUS_SIGNOUT_BTN);
        this.logoutButton.addClass(GLOBUS_TOOLBAR_BTN);

        this.fileManagerButton = new ToolbarButton({
            onClick: () => {
                this.widgets.switchToWidget(FILE_MANAGER);
            },
            tooltip: `File Manager`
        });
        this.fileManagerButton.addClass(GLOBUS_FILEMANAGER_BTN);
        this.fileManagerButton.addClass(GLOBUS_TOOLBAR_BTN);

        this.toolbar.addItem('filemanager', this.fileManagerButton);
        this.toolbar.addItem('logout', this.logoutButton);

        (this.layout as PanelLayout).addWidget(this.toolbar);
        (this.layout as PanelLayout).addWidget(this.widgets);
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
}
