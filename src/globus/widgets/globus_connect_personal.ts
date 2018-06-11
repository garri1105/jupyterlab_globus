import {FileBrowser, IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {Widget, PanelLayout} from '@phosphor/widgets';
import {Drive, ServerConnection} from '@jupyterlab/services';
import {} from 'node';
import {IDocumentManager} from '@jupyterlab/docmanager';
import {JupyterLab} from "@jupyterlab/application";

const GLOBUS_CONNECT_PERSONAL = 'jp-Globus-connect-personal';

const LOCAL_APPDATA = 'AppData/Local/';
const GCP_CLIENT_ID = 'Globus Connect/client-id.txt';
const GCP_CLIENT_LOG = 'Globus Connect/log/globus_connect_personal.log';
const SERVICE_DRIVE_URL = 'api/contents/';
const GCP_DRIVE_NAME = 'GCPDrive';

export const CONNECT_PERSONAL = 'globus-connectPersonal';
export let GCP_ENDPOINT_ID = '';

// TODO Lots of error handling: GCP not connected. GCP not found, etc.
// TODO iOS behaves differently. ProcessEnv, import node
export class GlobusConnectPersonal extends Widget {
    private factory: IFileBrowserFactory;
    private browser: FileBrowser;
    private serverSettings: ServerConnection.ISettings;
    private app: JupyterLab;

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

        console.log('Calling navigatetoGCP');
        this.navigateToGCPHomeDir();
    }

    private navigateToGCPHomeDir() {
        ServerConnection.makeRequest(
            `${this.serverSettings.baseUrl}${SERVICE_DRIVE_URL}${LOCAL_APPDATA}${GCP_CLIENT_LOG}`,
            {},
            this.serverSettings)
            .then(response => {return response.json()})
            .then(data => {
                console.log('FINDING ENDPOINT...');
                let path = this.findGCPHomeDirPath(data.content);
                let gcpEndpoint = this.findGCPEndpoint(path);
                if (gcpEndpoint) {
                    this.browser.model.cd(`/${gcpEndpoint}`);
                    (this.layout as PanelLayout).addWidget(this.browser);
                }
                else {
                    console.log('Reset JL');
                }
            });
    }

    private findGCPHomeDirPath(content: string) {
        for (let line of content.split('\n')) {
            if (line.indexOf('homedir') > -1) {
                return line.slice(line.indexOf('homedir') + 9, -2);
            }
        }
    }

    private findGCPEndpoint(localPath: string | undefined) {
        localPath = 'C:/Users/Juan David Grrido/Documents/Programming/Anaconda';
        console.log(localPath);
        console.log(this.app.info.directories.serverRoot);
        if (localPath.indexOf(this.app.info.directories.serverRoot) === 0) {
            localPath = localPath.slice(this.app.info.directories.serverRoot.length,);
            console.log(localPath);
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
}
