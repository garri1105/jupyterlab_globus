import {Widget, PanelLayout} from '@phosphor/widgets';
import {oauth2SignIn, globusAuthorized} from "../client";
import {GlobusWidgetManager} from "./widget_manager";


/**
 * CSS classes
 */
const GLOBUS_HOME = 'jp-Globus-home';
const GLOBUS_TAB_LOGO = 'jp-Globus-tablogo';
const GLOBUS_LOGIN_SCREEN = 'jp-Globus-loginScreen';
const GLOBUS_LOGO = 'jp-Globus-logo';
export const GLOBUS_BUTTON = 'jp-Globus-button';

/**
 * Widget for hosting the Globus Home.
 */
export class GlobusHome extends Widget {
    private loginScreen: GlobusLogin;
    private widgetManager: GlobusWidgetManager;

    constructor(widgetManager: GlobusWidgetManager) {
        super();

        this.widgetManager = widgetManager;

        this.id = 'globus-home';
        this.addClass(GLOBUS_HOME);
        this.layout = new PanelLayout();

        // Add Tab logo
        this.title.iconClass = GLOBUS_TAB_LOGO;
        this.title.closable = true;

        this.showLoginScreen();
    }

    private switchToWidgetManager(): void {
        this.loginScreen.parent = null;
        (this.layout as PanelLayout).addWidget(this.widgetManager);
    }

    public showLoginScreen() {
        // Initialize Login screen.
        this.loginScreen = new GlobusLogin();
        (this.layout as PanelLayout).addWidget(this.loginScreen);

        // After authorization and we are ready to use the
        // globus, show the widget manager.
        globusAuthorized.promise.then(() => {
            this.switchToWidgetManager();
        });
    }
}


/**
 * Widget for hosting the Globus Login.
 */
export class GlobusLogin extends Widget {
    private signInButton: HTMLButtonElement;

    constructor() {
        super();
        this.addClass(GLOBUS_LOGIN_SCREEN);

        // Add the logo
        const logo = document.createElement('div');
        logo.className = GLOBUS_LOGO;
        this.node.appendChild(logo);

        // Add the login button.
        this.signInButton = document.createElement('button');
        this.signInButton.title = 'Log into your Globus account';
        this.signInButton.textContent = 'SIGN IN';
        this.signInButton.className = `jp-mod-styled jp-mod-accept ${GLOBUS_BUTTON}`;
        this.signInButton.addEventListener('click', () => this.signIn());

        this.node.appendChild(this.signInButton);
    }

    private signIn(): void {
        oauth2SignIn();
    }
}