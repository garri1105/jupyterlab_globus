import {FileBrowser, IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {Widget, PanelLayout} from '@phosphor/widgets';
import {Drive, ServerConnection} from '@jupyterlab/services';
import {} from 'node';
import {IDocumentManager} from '@jupyterlab/docmanager';
import {JupyterLab} from "@jupyterlab/application";
import {
    ERROR_IMAGE,
    GLOBUS_BUTTON,
    GLOBUS_DISPLAY_FLEX,
    GLOBUS_BORDER,
    LOADING_ICON,
    LOADING_LABEL
} from "../../utils";

const GLOBUS_CONNECT_PERSONAL = 'jp-Globus-connect-personal';
const GCP_ERROR_SCREEN = 'jp-GlobusConnectPersonal-errorScreen';

// TODO: These constants are Windows only
const LOCAL_APPDATA = 'AppData/Local/';
const GCP_CLIENT_ID = 'Globus Connect/client-id.txt';
const GCP_CLIENT_LOG = 'Globus Connect/log/globus_connect_personal.log';
const SERVICE_DRIVE_URL = 'api/contents/';

const GCP_DRIVE_NAME = 'GCPDrive';

export const CONNECT_PERSONAL = 'globus-connectPersonal';
export let GCP_ENDPOINT_ID = '';

// TODO Lots of error handling: GCP not found, etc.
// TODO iOS behaves differently. ProcessEnv, import node
// TODO Transfer with right click
export class GlobusConnectPersonal extends Widget {
    private factory: IFileBrowserFactory;
    private browser: FileBrowser;
    private serverSettings: ServerConnection.ISettings;
    private app: JupyterLab;
    private errorScreen: HTMLDivElement;

    constructor(app: JupyterLab, manager: IDocumentManager, factory: IFileBrowserFactory) {
        super();
        this.id = CONNECT_PERSONAL;
        this.layout = new PanelLayout();
        this.factory = factory;
        this.serverSettings = ServerConnection.makeSettings();
        this.app = app;
        this.addClass(GLOBUS_CONNECT_PERSONAL);

        this.title.label = 'Globus Connect Personal';

        this.setGCPEndpointId();

        const drive = new Drive({name: GCP_DRIVE_NAME});
        manager.services.contents.addDrive(drive);

        this.browser = this.factory.createFileBrowser('globus-connect-personal', {
            driveName: GCP_DRIVE_NAME
        });

        this.update();
    }

    onUpdateRequest() {
        this.navigateToGCPHomeDir();
    }

    private navigateToGCPHomeDir() {
        ServerConnection.makeRequest(
            `${this.serverSettings.baseUrl}${SERVICE_DRIVE_URL}${LOCAL_APPDATA}${GCP_CLIENT_LOG}`,
            {},
            this.serverSettings)
            .then(response => {
                if (response.status >= 400) {
                    throw response.json();
                }
                else {
                    return response.json();
                }
            }).then(async data => {
                let path = this.findGCPHomeDirPath(data.content);
                let gcpEndpoint = this.findGCPEndpoint(path);
                if (gcpEndpoint) {
                    await this.browser.model.cd();
                    await this.browser.model.cd(`/${gcpEndpoint}`);
                    (this.layout as PanelLayout).addWidget(this.browser);
                }
                else {
                    let newPath = this.findAlternatePath(path);
                    this.createErrorScreen(newPath);
                }
            }).catch(e => {
                console.log(e)
        });
    }

    private findGCPHomeDirPath(content: string) {
        let lines = content.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].indexOf('homedir') > -1) {
                return lines[i].slice(lines[i].indexOf('homedir') + 9, -2);
            }
            else if (lines[i].indexOf('home_dir') > -1) {
                return lines[i].slice(lines[i].indexOf('home_dir') + 11, -2);
            }
        }
    }

    private findGCPEndpoint(localPath: string | undefined) {
        if (localPath.indexOf(this.app.info.directories.serverRoot) === 0) {
            localPath = localPath.slice(this.app.info.directories.serverRoot.length);
            return localPath;
        }
        else {
            return null;
        }
    }

    private setGCPEndpointId() {
        ServerConnection.makeRequest(
            `${this.serverSettings.baseUrl}${SERVICE_DRIVE_URL}${LOCAL_APPDATA}${GCP_CLIENT_ID}`,
            {},
            this.serverSettings)
            .then(response => {return response.json()})
            .then(data => {
                GCP_ENDPOINT_ID = data.content;
            });
    }

    private restartJL(newPath: string) {
        LOADING_LABEL.textContent = 'Opening in a new window...';
        this.errorScreen.appendChild(LOADING_ICON);
        this.errorScreen.appendChild(LOADING_LABEL);
        this.app.serviceManager.terminals.startNew().then(session => {
            session.send({ type: 'stdin', content: [`jupyter lab --NotebookApp.notebook_dir="${newPath}"\r`]});
        });
    }

    private createErrorScreen(newPath: string) {
        let errorText = document.createElement('div');
        errorText.textContent = `Looks like your GCP home directory can\'t be accessed by your current JupyterLab 
                                 startup location. Would you like to restart JupyterLab in "${newPath}" to fix this issue?`;
        errorText.className = GLOBUS_BORDER;
        errorText.style.padding = '5px 10px';

        let restartJLButton = document.createElement('button');
        restartJLButton.title = 'Restart JupyterLab';
        restartJLButton.textContent = 'RESTART';
        restartJLButton.className = `jp-mod-styled jp-mod-accept ${GLOBUS_BUTTON}`;
        restartJLButton.addEventListener('click', () => this.restartJL(newPath));

        this.errorScreen = document.createElement('div');
        this.errorScreen.className = `${GLOBUS_DISPLAY_FLEX} ${GCP_ERROR_SCREEN}`;
        this.errorScreen.appendChild(ERROR_IMAGE);
        this.errorScreen.appendChild(errorText);
        this.errorScreen.appendChild(restartJLButton);

        this.node.appendChild(this.errorScreen);
    }

    private findAlternatePath(path: string) {
        let split1 = path.split('/');
        let split2 = this.app.info.directories.serverRoot.split('/');

        let i = 0;
        let newPath = '';
        while (i < split1.length && i < split2.length && split1[i] == split2[i]) {
            newPath += `${split1[i]}/`;
            i += 1;
        }

        return newPath ? newPath : `${split1[0]}/`;
    }
}
