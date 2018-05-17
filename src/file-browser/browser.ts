import {
    Widget
} from '@phosphor/widgets';


export class GlobusExplorerFileBrowser extends Widget {
    constructor() {
        super();

        this.id = 'globus-explorer-file-browser';
        this.title.iconClass = 'jp-Globus-tablogo';
        this.title.closable = true;
    }
}

