import {FileBrowser, IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {Widget, PanelLayout} from '@phosphor/widgets';
import {Drive, ServerConnection} from '@jupyterlab/services';
import {} from 'node';
import {IDocumentManager} from '@jupyterlab/docmanager';
import {URLExt} from '@jupyterlab/coreutils';

const LOCALAPPDATA = 'AppData/Local/';
const GCPCLIENTID = 'Globus Connect/log/globus_connect_personal.log';

const GLOBUS_CONNECT_PERSONAL = 'jp-Globus-connect-personal';

export const CONNECT_PERSONAL = 'globus-connectPersonal';

const SERVICE_DRIVE_URL = 'api/contents/';
const GCP_DRIVE_NAME = 'GCPDrive';


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

        ServerConnection.makeRequest(
            `${this.serverSettings.baseUrl}${SERVICE_DRIVE_URL}${LOCALAPPDATA}${GCPCLIENTID}`,
            {},
            this.serverSettings)
            .then(response => {return response.json()})
            .then(data => {
                let path = '';
                for (let line of data.content.split('\n')) {
                    if (line.indexOf('homedir') > -1) {
                        path = line.slice(line.indexOf('homedir') + 9, -2);
                        break;
                    }
                }
                const drive = new Drive({name: GCP_DRIVE_NAME});

                manager.services.contents.addDrive(drive);
                console.log(drive);

                this.browser = this.factory.createFileBrowser('globus-connect-personal', {
                    driveName: GCP_DRIVE_NAME
                });

                console.log('FINDING ENDPOINT...');
                this.findGCPEndpoint(path)
                    .then(path => {
                        this.browser.model.cd(`/${path}`);
                    });

                (this.layout as PanelLayout).addWidget(this.browser);
            });
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
}
