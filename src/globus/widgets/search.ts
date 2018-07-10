import {Widget} from '@phosphor/widgets';

/**
 * CSS Classes
 */
const GLOBUS_SEARCH = 'jp-Globus-search';

export const SEARCH = 'globus-search';


export class GlobusSearch extends Widget {

    constructor() {
        super();
        this.id = SEARCH;
        this.addClass(GLOBUS_SEARCH);

        this.title.label = 'Search';

        this.update();
    }

    onUpdateRequest() {
    }
}