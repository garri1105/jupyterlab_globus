import {IFileBrowserFactory} from "@jupyterlab/filebrowser";
import {Widget, PanelLayout} from '@phosphor/widgets';
import {ServerConnection} from '@jupyterlab/services';
import {} from 'node';
import {IDocumentManager} from '@jupyterlab/docmanager';
import {GCP_DRIVE_NAME, GCPDrive} from "../drive";

const LOCALAPPDATA = 'AppData/Local/';
const GCPCLIENTID = 'Globus Connect/log/globus_connect_personal.log';

const GLOBUS_CONNECT_PERSONAL = 'jp-Globus-connect-personal';

export const CONNECT_PERSONAL = 'globus-connectPersonal';


export class GlobusConnectPersonal extends Widget {
    private factory: IFileBrowserFactory;

    constructor(manager: IDocumentManager, factory: IFileBrowserFactory) {
        super();
        this.id = CONNECT_PERSONAL;
        this.layout = new PanelLayout();
        this.factory = factory;
        this.addClass(GLOBUS_CONNECT_PERSONAL);

        this.title.label = 'Globus Connect Personal';

        ServerConnection.makeRequest(
            `http://localhost:8888/api/contents/${LOCALAPPDATA}${GCPCLIENTID}`,
            {},
            ServerConnection.makeSettings())
            .then(response => {return response.json()})
            .then(data => {
                let path = '';
                for (let line of data.content.split('\n')) {
                    if (line.indexOf('homedir') > -1) {
                        path = line.slice(line.indexOf('homedir') + 9, -2);
                        break;
                    }
                }
                const drive = new GCPDrive({apiEndpoint: path});

                manager.services.contents.addDrive(drive);
                console.log(drive);
                this.createBrowser();
            });
    }

    private createBrowser(): void {
        let browser = this.factory.createFileBrowser('globus-connect-personal', {
            driveName: GCP_DRIVE_NAME
        });

        (this.layout as PanelLayout).addWidget(browser);
    }
}
