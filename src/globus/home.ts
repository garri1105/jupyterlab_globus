import {Widget, PanelLayout} from '@phosphor/widgets';
import {oauth2SignIn, globusAuthorized, Private} from "./client";
import {GlobusWidgetManager} from "./widget_manager";
import tokens = Private.tokens;
import {IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {IDocumentManager} from '@jupyterlab/docmanager';

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
    private globusLogin: GlobusLogin;
    private factory: IFileBrowserFactory;
    private manager: IDocumentManager;

    constructor(manager: IDocumentManager, factory: IFileBrowserFactory) {
        super();

        this.id = 'globus-home';
        this.addClass(GLOBUS_HOME);

        this.layout = new PanelLayout();
        this.globusLogin = new GlobusLogin();
        this.factory = factory;
        this.manager = manager;

        // Add Tab logo
        this.title.iconClass = GLOBUS_TAB_LOGO;
        this.title.closable = true;

        this.showLoginScreen();
        this.globusLogin.attemptSignIn();
    }

    public showLoginScreen() {
        // Initialize Login screen.
        (this.layout as PanelLayout).addWidget(this.globusLogin);

        // After authorization and we are ready to use the
        // globus, show the widget manager.
        globusAuthorized.promise.then((data: any) => {
            sessionStorage.setItem('data', JSON.stringify(data));
            tokens.data = data;
            this.globusLogin.parent = null;
            (this.layout as PanelLayout).addWidget(new GlobusWidgetManager(this.manager, this.factory));
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

    attemptSignIn() {
        let data = sessionStorage.getItem('data');
        if (data) {
            globusAuthorized.resolve(JSON.parse(data));
        }
    }
}