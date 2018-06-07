import {FileBrowser, IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {Widget, PanelLayout} from '@phosphor/widgets';
import {Drive, ServerConnection} from '@jupyterlab/services';
import {} from 'node';
import {IDocumentManager} from '@jupyterlab/docmanager';
import {URLExt} from '@jupyterlab/coreutils';

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


    constructor(manager: IDocumentManager, factory: IFileBrowserFactory) {
        super();
        this.id = CONNECT_PERSONAL;
        this.layout = new PanelLayout();
        this.factory = factory;
        this.serverSettings = ServerConnection.makeSettings();
        this.addClass(GLOBUS_CONNECT_PERSONAL);

        this.title.label = 'Globus Connect Personal';

        this.setGCPEndpointId();

        const drive = new Drive({name: GCP_DRIVE_NAME});
        manager.services.contents.addDrive(drive);

        this.browser = this.factory.createFileBrowser('globus-connect-personal', {
            driveName: GCP_DRIVE_NAME
        });

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
                this.findGCPEndpoint(path)
                    .then(path => {
                        this.browser.model.cd(`/${path}`);
                    });

                (this.layout as PanelLayout).addWidget(this.browser);
            });
    }

    private findGCPHomeDirPath(content: string) {
        for (let line of content.split('\n')) {
            if (line.indexOf('homedir') > -1) {
                return line.slice(line.indexOf('homedir') + 9, -2);
            }
        }
    }

    private async findGCPEndpoint(localPath: string | undefined) {
        let baseUrl = this.serverSettings.baseUrl;
        let url = URLExt.join(baseUrl, SERVICE_DRIVE_URL, localPath);

        let promise = new Promise<string>((resolve) => {
            ServerConnection.makeRequest(url, {}, this.serverSettings).then(response => {
                if (response.status !== 200) {
                    let parts = localPath.split('/');
                    parts.shift();
                    resolve(this.findGCPEndpoint(parts.join('/')));
                }
                else {
                    console.log('GOT ENDPOINT: ' + localPath);
                    resolve(localPath);
                }
            });
        });

        return await promise;
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
