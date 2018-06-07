import {Widget, PanelLayout} from '@phosphor/widgets';

const GLOBUS_ACTIVITY = 'jp-Globus-activity';

export const ACTIVITY = 'globus-activity';

// TODO Lots of error handling: GCP not connected. GCP not found, etc.
// TODO iOS behaves differently. ProcessEnv, import node
export class GlobusActivity extends Widget {

    constructor() {
        super();
        this.id = ACTIVITY;
        this.layout = new PanelLayout();
        this.addClass(GLOBUS_ACTIVITY);

        this.title.label = 'Activity';
    }
}