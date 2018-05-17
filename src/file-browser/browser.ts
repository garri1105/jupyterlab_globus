import {
    Widget, PanelLayout
} from '@phosphor/widgets';
import {GLOBUS_TRANSFER_API_URL} from "../index";


export class GlobusFileBrowser extends Widget {
    private myEndPoint: HTMLElement;
    private loginScreen: GlobusLogin;

    constructor() {
        super();
        this.addClass('jp-GlobusFileBrowser');
        this.layout = new PanelLayout();

        this.id = 'globus-file-browser';
        this.title.iconClass = 'jp-Globus-tablogo';
        this.title.closable = true;

        this.myEndPoint = document.createElement('p');
        this.getMyEndPoint();

        // Initialize with the Login screen.
        this.loginScreen = new GlobusLogin();
        (this.layout as PanelLayout).addWidget(this.loginScreen);

        this.node.appendChild(this.myEndPoint)
    }

    private getMyEndPoint() {
        fetch(`${GLOBUS_TRANSFER_API_URL}/endpoint_search?filter_scope=my-endpoints`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer Ag34bvav1Xg2OYOqm1JmanKmQzx9z59nWM8gpejW9w9yPYyX0qsVCVDEnQW3VEb5PpBjVNBJvbQ8n9fXqyPPqSdl0P'}
        }).then(response => {
            return response.json();
        }).then(data => {
            console.log(data);
            this.myEndPoint.innerText = data.DATA[0].display_name;
        });
    }
}

export class GlobusLogin extends Widget {
    private signInButton: HTMLElement;

    constructor() {
        super();
        this.addClass('jp-GlobusLoginScreen');

        // Add the logo.
        const logo = document.createElement('div');
        logo.className = 'jp-Globus-logo';
        this.node.appendChild(logo);

        // Add the login button.
        this.signInButton = document.createElement('button');
        this.signInButton.title = 'Log into your Globus account';
        this.signInButton.textContent = 'SIGN IN';
        this.signInButton.className = 'jp-Globus-signInButton jp-mod-styled jp-mod-accept';
        this.signInButton.addEventListener('click', () => this.signIn());
        this.node.appendChild(this.signInButton);
    }

    private signIn(): void {
        console.log('Signing in');
    }
}

