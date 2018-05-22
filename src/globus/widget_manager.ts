import {GlobusFileManager} from "./widgets/file_manager";

import {
    Widget, PanelLayout
} from '@phosphor/widgets';

/**
 * Widget Ids
 */
export const FILE_MANAGER = 'globus-file-manager';

interface WidgetMap {
    [id: string]: Widget
}

export class WidgetManager extends Widget {

    private currentWidgetId: string;
    private fileManagerWidget: GlobusFileManager;

    private widgetMap: WidgetMap = {
        'globus-file-manager': this.fileManagerWidget
    };

    constructor() {
        super();
        this.layout = new PanelLayout();

        this.fileManagerWidget = new GlobusFileManager();

        (this.layout as PanelLayout).addWidget(this.fileManagerWidget);
    }

    switchToWidget(id: string) {
        if (id !== this.currentWidgetId) {
            this.widgetMap[this.currentWidgetId].parent = null;
            (this.layout as PanelLayout).addWidget(this.widgetMap[id]);
        }
    }
}