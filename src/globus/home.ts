import {Widget, PanelLayout} from '@phosphor/widgets';
import {oauth2SignIn, globusAuthorized, initializeGlobusClient} from "./api/client";
import {GlobusWidgetManager} from "./widget_manager";
import {GLOBUS_BUTTON} from "../utils";

/**
 * CSS classes
 */
const GLOBUS_HOME = 'jp-Globus-home';
const GLOBUS_TAB_LOGO = 'jp-Globus-tablogo';
const GLOBUS_LOGIN_SCREEN = 'jp-Globus-loginScreen';
const GLOBUS_LOGO = 'jp-Globus-logo';

export const SIGN_OUT = 'globus-signOut';

/**
 * Widget for hosting the Globus Home.
 */
export class GlobusHome extends Widget {
    readonly globusLogin: GlobusLogin;
    readonly widgetManager: GlobusWidgetManager;

    constructor(widgetManager: GlobusWidgetManager) {
        super();

        this.id = 'globus-home';
        this.addClass(GLOBUS_HOME);

        this.layout = new PanelLayout();
        this.globusLogin = new GlobusLogin();
        this.widgetManager = widgetManager;

        this.title.iconClass = GLOBUS_TAB_LOGO;
        this.title.closable = true;

        this.showLoginScreen();
        this.globusLogin.attemptSignIn();
    }

    /**
     * Displays login screen and waits for authorization
     */
    public showLoginScreen() {
        (this.layout as PanelLayout).addWidget(this.globusLogin);

        // After globus authorization, show the widget manager.
        globusAuthorized.promise.then((data: any) => {
            // Store login data in the session
            sessionStorage.setItem('data', JSON.stringify(data));
            initializeGlobusClient(data);

            // Hide login screen
            this.globusLogin.parent = null;

            // Initialize widgetManager and add it to layout
            this.widgetManager.update();
            (this.layout as PanelLayout).addWidget(this.widgetManager);
        });
    }
}

/**
 * Widget for hosting the Globus Login.
 */
export class GlobusLogin extends Widget {
    constructor() {
        super();
        this.addClass(GLOBUS_LOGIN_SCREEN);

        // Add the logo
        const logo = document.createElement('div');
        logo.className = GLOBUS_LOGO;
        this.node.appendChild(logo);

        // Add the login button.
        let signInButton = document.createElement('button');
        signInButton.title = 'Log into your Globus account';
        signInButton.textContent = 'SIGN IN';
        signInButton.className = `${GLOBUS_BUTTON}`;
        signInButton.addEventListener('click', () => this.signIn());

        this.node.appendChild(signInButton);
    }

    private signIn(): void {
        oauth2SignIn();
    }

    /*
    * If there is data stored in the session then we assume that the user is authorized by globus.
    * This is safe because even if they are able to access the extension without an authorization by globus, they'll
    * be unable to use the app because the access tokens would be invalid
    */
    attemptSignIn() {
        let data = sessionStorage.getItem('data');
        if (data) {
            globusAuthorized.resolve(JSON.parse(data));
        }
    }
}