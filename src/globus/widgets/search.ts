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

        // simpleGet('5e83718e-add0-4f06-a00d-577dc78359bc').then(r => console.log(r)).catch(e => console.log(e));
    }

    onUpdateRequest() {
    }
}