import {Widget, PanelLayout} from '@phosphor/widgets';

const GLOBUS_ACTIVITY = 'jp-Globus-activity';

export const ACTIVITY = 'globus-activity';

export class GlobusActivity extends Widget {

    constructor() {
        super();
        this.id = ACTIVITY;
        this.layout = new PanelLayout();
        this.addClass(GLOBUS_ACTIVITY);

        this.title.label = 'Activity';
    }
}