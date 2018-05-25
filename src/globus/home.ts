import {Widget, PanelLayout} from '@phosphor/widgets';
import {oauth2SignIn, exchangeOAuth2Token, globusAuthorized} from "../client";
import {CHECKMARK_ICON, CROSS_ICON, LOADING_ICON} from "../utils";
import {GlobusWidgetManager} from "./widget_manager";


/**
 * CSS classes
 */
const GLOBUS_HOME = 'jp-Globus-home';
const GLOBUS_TAB_LOGO = 'jp-Globus-tablogo';
const GLOBUS_LOGIN_SCREEN = 'jp-Globus-loginScreen';
const GLOBUS_LOGO = 'jp-Globus-logo';
export const GLOBUS_BUTTON = 'jp-Globus-button';
const GLOBUS_AUTH_CODE_INPUT = 'jp-Globus-authCodeInput';

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
    private backButton: HTMLSpanElement;
    private authCodeInput: HTMLInputElement;

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

        this.authCodeInput = document.createElement('input');
        this.authCodeInput.title = 'Input your authorization code';
        this.authCodeInput.placeholder = 'Authorization code';
        this.authCodeInput.className = `jp-mod-styled ${GLOBUS_AUTH_CODE_INPUT}`;
        this.authCodeInput.style.display = 'none';

        this.backButton = document.createElement('span');
        this.backButton.className = 'backButton';
        this.backButton.style.display = 'none';
        this.backButton.onclick = () => {
            this.authCodeInput.style.display = 'none';
            this.backButton.style.display = 'none';
            this.signInButton.style.display = 'block';
        };

        this.node.appendChild(this.signInButton);
        this.node.appendChild(this.authCodeInput);
        this.node.appendChild(this.backButton);

    }

    private signIn(): void {
        oauth2SignIn();
        this.authCodeInput.style.display = 'block';
        this.backButton.style.display = 'block';
        this.signInButton.style.display = 'none';
        let that = this;
        this.authCodeInput.oninput = async function () {
            if (that.node.childElementCount > 4) {
                that.node.removeChild(that.node.lastChild);
            }

            that.node.appendChild(LOADING_ICON);

            if (that.authCodeInput.value.length === 30) {
                await exchangeOAuth2Token(that.authCodeInput.value)
                    .then((data) => {
                        that.node.appendChild(CHECKMARK_ICON);
                        globusAuthorized.resolve(data);

                    }).catch((e) => {
                        console.log(e);
                        that.node.appendChild(CROSS_ICON);
                    });
            }
            else if (that.authCodeInput.value.length !== 0){
                that.node.appendChild(CROSS_ICON);
            }

            that.node.removeChild(LOADING_ICON);
        };
    }
}