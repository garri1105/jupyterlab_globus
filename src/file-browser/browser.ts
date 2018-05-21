import {
    Widget, PanelLayout
} from '@phosphor/widgets';

import {
    exchangeOAuth2Token,
    oauth2SignIn
} from "../globus-client/globus_client";
import {CHECKMARK_ICON, CROSS_ICON, LOADING_ICON} from "../index";

// import {GLOBUS_TRANSFER_API_URL} from "../index";


/**
 * CSS classes
 */
const GLOBUS_FILEBROWSER_CLASS = 'jp-Globus-fileBrowser';
const GLOBUS_TAB_LOGO = 'jp-Globus-tablogo';
const GLOBUS_LOGIN_SCREEN = 'jp-Globus-loginScreen';
const GLOBUS_LOGO = 'jp-Globus-logo';
const GLOBUS_SIGNIN_BUTTON = 'jp-Globus-signInButton';
const GLOBUS_AUTH_CODE_INPUT = 'jp-Globus-authCodeInput';


/**
 * Widget for hosting the Globus File Browser.
 */
export class GlobusFileBrowser extends Widget {
    private myEndPoint: HTMLElement;
    private loginScreen: GlobusLogin;

    constructor() {
        super();
        this.id = 'globus-file-browser';
        this.addClass(GLOBUS_FILEBROWSER_CLASS);
        this.layout = new PanelLayout();

        // Add Tab logo
        this.title.iconClass = GLOBUS_TAB_LOGO;
        this.title.closable = true;

        // Initialize with the Login screen.
        this.loginScreen = new GlobusLogin();
        (this.layout as PanelLayout).addWidget(this.loginScreen);

        this.myEndPoint = document.createElement('p');
        // this.getMyEndPoint();
        this.node.appendChild(this.myEndPoint)
    }

    // private getMyEndPoint() {
    //     fetch(`${GLOBUS_TRANSFER_API_URL}/endpoint_search?filter_scope=my-endpoints`, {
    //         method: 'GET',
    //         headers: {'Authorization': 'Bearer Ag34bvav1Xg2OYOqm1JmanKmQzx9z59nWM8gpejW9w9yPYyX0qsVCVDEnQW3VEb5PpBjVNBJvbQ8n9fXqyPPqSdl0P'}
    //     }).then(response => {
    //         return response.json();
    //     }).then(data => {
    //         this.myEndPoint.innerText = data.DATA[0].display_name;
    //     });
    // }
}


/**
 * Widget for hosting the Globus Login.
 */
export class GlobusLogin extends Widget {
    private signInButton: HTMLButtonElement;
    private inputDiv: HTMLSpanElement;
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
        this.signInButton.className = `jp-mod-styled jp-mod-accept ${GLOBUS_SIGNIN_BUTTON}`;
        this.signInButton.addEventListener('click', () => this.signIn());

        this.authCodeInput = document.createElement('input');
        this.authCodeInput.title = 'Input your authorization code';
        this.authCodeInput.placeholder = 'Authorization code';
        this.authCodeInput.className = `jp-mod-styled ${GLOBUS_AUTH_CODE_INPUT}`;

        this.inputDiv = document.createElement('span');
        this.inputDiv.onclick = (event) => {
            console.log(event.target);
            // this.inputDiv.style.display = 'none';
            // this.signInButton.style.display = 'block';
        };
        this.inputDiv.className = 'backButton';
        this.inputDiv.style.display = 'none';
        this.inputDiv.appendChild(this.authCodeInput);

        this.node.appendChild(this.signInButton);
        this.node.appendChild(this.inputDiv);
    }

    private signIn(): void {
        oauth2SignIn();
        this.signInButton.style.display = 'none';
        this.inputDiv.style.display = 'block';

        let that = this;
        this.authCodeInput.oninput = async function () {
            if (that.node.childElementCount > 3) {
                that.node.removeChild(that.node.lastChild);
            }

            that.node.appendChild(LOADING_ICON);

            if (that.authCodeInput.value.length === 30) {

                await exchangeOAuth2Token(that.authCodeInput.value)
                    .then((data) => {
                        console.log(data);
                        that.node.appendChild(CHECKMARK_ICON);
                    }).catch(() => {
                        that.node.appendChild(CROSS_ICON);
                    });
            }
            else {
                that.node.appendChild(CROSS_ICON);
            }

            that.node.removeChild(LOADING_ICON);
        };
    }
}

