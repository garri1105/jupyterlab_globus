import {Widget} from '@phosphor/widgets';
import {searchIndexAdvanced, searchQueryParams} from "../api/search";
import {
    displayError,
    getGlobusElement,
    removeChildren,
    GLOBUS_BORDER,
    GLOBUS_DISPLAY_FLEX,
    GLOBUS_INPUT,
    GLOBUS_LIST,
    GLOBUS_PARENT_GROUP,
    LOADING_ICON,
    LOADING_LABEL,
    ENDPOINT_ID_REG_EXP,
    GLOBUS_LIST_ITEM_TITLE,
    GLOBUS_LIST_ITEM_SUBTITLE,
    GLOBUS_MENU,
    GLOBUS_MENU_BTN,
    GLOBUS_ACTIVE, GLOBUS_LIST_ITEM, hideChildren, GLOBUS_BUTTON, GLOBUS_OPEN,
} from "../../utils";
import * as $ from "jquery";
import {GlobusMetaResult, GlobusSearchResult} from "../api/models";
import {GlobusWidgetManager} from "../widget_manager";
import {FILE_MANAGER, GlobusFileManager} from "./file_manager";
import JSONFormatter from 'json-formatter-js'


// TODO Filtering needs to be done better. If a filter is a number like # of atoms, then it should add an input box instead of checkboxes
// TODO Filtering #2. Add numbers right next to the filters. How many elements of this type of filter are available.
// TODO Filtering #3. I'm only filtering the first 10 results. Filter the whole dataset
// TODO Paging for the whole dataset
// TODO Refactor this page beccause it was done in a rush. Badly written.
// TODO Config file
/**
 * CSS Classes
 */
const GLOBUS_SEARCH = 'jp-Globus-search';
const SEARCH_INDEX_GROUP = 'jp-Search-indexGroup';
const SEARCH_INDEX_SELECT = 'jp-Search-indexSelect';
const SEARCH_RESULT_INPUT = 'jp-Search-resultInput';
const SEARCH_RESULT_LIST = 'jp-Search-resultList';
const SEARCH_MENU_FILTER = 'jp-Search-menuFilter';
const SEARCH_FILTER_LIST = 'jp-Search-filterList';
const SEARCH_FILTER = 'jp-Search-filter';
const SEARCH_FILTER_CHECKBOX = 'jp-Search-filterCheckbox';
const SEARCH_MENU = 'jp-Search-menu';
const SEARCH_RESULT_GROUP = 'jp-Search-resultGroup';
const SEARCH_OVERVIEW_MENU = 'jp-Search-overviewMenu';
const SEARCH_OVERVIEW = 'jp-Search-overview';
const SEARCH_OVERVIEW_GROUP = 'jp-Search-overviewGroup';
const SEARCH_MENU_BACK = 'jp-Search-menuBack';
const SEARCH_MENU_OVERVIEW = 'jp-Search-menuOverview';

export const SEARCH = 'globus-search';

export class GlobusSearch extends Widget {

    private parentGroup: HTMLDivElement;

    constructor() {
        super();
        this.id = SEARCH;
        this.addClass(GLOBUS_SEARCH);

        this.title.label = 'Search';

        this.createHTMLElements();

        this.update();
    }

    onUpdateRequest() {

    }

    private searchIndex(e: any) {
        let resultInput: HTMLInputElement = getGlobusElement(this.parentGroup, SEARCH_RESULT_INPUT) as HTMLInputElement;
        let resultList: HTMLUListElement = getGlobusElement(this.parentGroup, SEARCH_RESULT_LIST) as HTMLUListElement;
        let resultGroup: HTMLDivElement = getGlobusElement(this.parentGroup, SEARCH_RESULT_GROUP) as HTMLDivElement;
        let indexSelect: HTMLSelectElement = getGlobusElement(this.parentGroup, SEARCH_INDEX_SELECT) as HTMLSelectElement;
        let filterList: HTMLUListElement = getGlobusElement(this.parentGroup, SEARCH_FILTER_LIST) as HTMLUListElement;
        let overviewGroup: HTMLElement = getGlobusElement(this.parentGroup, SEARCH_OVERVIEW_GROUP);

        removeChildren(filterList);
        let index = $.data(indexSelect.options[indexSelect.selectedIndex], 'value');
        let filterMap: {[p: string]: HTMLElement} = {};
        for (let key in index.filterObject) {
            let filter: HTMLElement = document.createElement('div');
            filter.className = SEARCH_FILTER;
            filter.title = key;
            filter.innerHTML = `<h4 style="margin: 10px">${key}</h4>`;
            filterList.appendChild(filter);
            filterMap[key] = filter.firstChild as HTMLElement;
        }

        $.data(filterList, 'map', filterMap);

        resultGroup.style.display = 'flex';
        overviewGroup.style.display = 'none';

        if (e.currentTarget.matches(`.${SEARCH_INDEX_SELECT}`)) {
            resultInput.value = '*';
        }

        this.retrieveResults(index, resultInput.value, resultList);
    }

    private fetchResults(index: GlobusIndex, query: string, resultList: HTMLUListElement) {
        let filterCheckboxes = this.parentGroup.getElementsByClassName(SEARCH_FILTER_CHECKBOX);
        let params: any = {};
        for (let i = 0; i < filterCheckboxes.length; i++) {
            if ((filterCheckboxes[i].firstChild as HTMLInputElement).checked) {
                params[$.data(filterCheckboxes[i], 'key')] = $.data(filterCheckboxes[i], 'value');
            }
        }

        return new Promise<void>((resolve) => {
            index.search(query, params).then(data => {
                console.log(data);
                if (data.gmeta.length > 0) {
                    this.displayResults(index, data, resultList);
                }
                else {
                    displayError({customMessage: 'No results'}, resultList);
                }
                resolve();
            });
        });
    }

    private displayResults(index: GlobusIndex, data: GlobusSearchResult, resultList: HTMLUListElement) {
        let filterList: HTMLUListElement = getGlobusElement(this.parentGroup, SEARCH_FILTER_LIST) as HTMLUListElement;
        let filterMap = $.data(filterList, 'map');
        for (let key in filterMap) {
            hideChildren(filterMap[key]);
        }

        for (let i = 0; i < data.gmeta.length; i++) {
            let resultData: GlobusMetaResult = data.gmeta[i];

            let result = document.createElement('li');
            result.className = GLOBUS_LIST_ITEM;
            $.data<GlobusMetaResult>(result, 'data', resultData);

            let previewObject: {[p: string]: string} = {};
            for (let key in index.previewObject) {
                let data: any = resultData.content[0];
                let keys = index.previewObject[key].split('.');
                for (let i = 0; i < keys.length; i++) {
                    if (data) {
                        data = data[keys[i]];
                    } else break;
                }
                previewObject[key] = data;
            }

            let name: HTMLDivElement = document.createElement('div');
            name.textContent = name.title = previewObject.title.split('/').pop();
            delete previewObject.title;
            name.className = GLOBUS_LIST_ITEM_TITLE;
            result.appendChild(name);

            for (let key in previewObject) {
                let property: HTMLDivElement = document.createElement('div');
                property.className = GLOBUS_LIST_ITEM_SUBTITLE;
                property.innerHTML = `<strong>${key}:</strong> ${previewObject[key]}\n`;

                result.appendChild(property)
            }

            for (let key in index.filterObject) {
                let data: any = resultData.content[0];
                let keys = index.filterObject[key].split('.');
                for (let i = 0; i < keys.length; i++) {
                    if (data) {
                        data = data[keys[i]];
                    } else break;
                }

                if (data) {
                    let i = 0;
                    for (i = 0; i < filterMap[key].children.length; i++) {
                        if (data.toString() === (filterMap[key].children[i] as HTMLElement).title) {
                            filterMap[key].children[i].style.display = 'block';
                            break;
                        }
                    }

                    if (i === filterMap[key].children.length) {
                        let checkbox = document.createElement('label');
                        checkbox.className = `${SEARCH_FILTER_CHECKBOX}`;
                        checkbox.title = data;
                        checkbox.style.display = 'block';
                        checkbox.innerHTML = `<input type="checkbox"> ${data}`;
                        $.data(checkbox, 'key', index.filterObject[key]);
                        $.data(checkbox, 'value', data);
                        filterMap[key].appendChild(checkbox);
                        checkbox.addEventListener('change', () => {
                            let resultInput: HTMLInputElement = getGlobusElement(this.parentGroup, SEARCH_RESULT_INPUT) as HTMLInputElement;
                            this.retrieveResults(index, `${resultInput.value}`, resultList)
                        });
                    }
                }
            }

            result.addEventListener("click", this.resultClicked.bind(this, index));
            resultList.appendChild(result);
        }
    }

    private retrieveResults(index: GlobusIndex, query: string = '*', resultList: HTMLUListElement) {
        removeChildren(resultList);

        LOADING_LABEL.textContent = 'Loading Results...';
        resultList.appendChild(LOADING_ICON);
        resultList.appendChild(LOADING_LABEL);
        this.fetchResults(index, query, resultList).then(() => {
            resultList.removeChild(LOADING_ICON);
            resultList.removeChild(LOADING_LABEL);
        });
    }

    private transferClicked(e: any) {
        let result = getGlobusElement(this.parentGroup, GLOBUS_OPEN);
        let indexSelect: HTMLSelectElement = getGlobusElement(this.parentGroup, SEARCH_INDEX_SELECT) as HTMLSelectElement;
        let index = $.data(indexSelect.options[indexSelect.selectedIndex], 'value');

        (this.parent as GlobusWidgetManager).switchToWidget(FILE_MANAGER);
        let fileManager: GlobusFileManager = (this.parent as GlobusWidgetManager).getWidgetInstance(FILE_MANAGER) as GlobusFileManager;
        fileManager.transferFile(index.retrieveFiles($.data(result, 'data')));
    }

    private resultClicked(index: GlobusIndex, e: any) {
        let resultData = $.data(e.currentTarget, 'data');

        e.currentTarget.classList.toggle(GLOBUS_OPEN);

        let overview = getGlobusElement(this.parentGroup, SEARCH_OVERVIEW);
        overview.style.padding = '10px';
        removeChildren(overview);
        let resultGroup = getGlobusElement(this.parentGroup, SEARCH_RESULT_GROUP);

        overview.parentElement.style.display = 'block';
        resultGroup.style.display = 'none';

        let title: any = resultData.content[0];
        let keys = index.previewObject.title.split('.');
        for (let i = 0; i < keys.length; i++) {
            if (title) {
                title = title[keys[i]];
            } else break;
        }

        let name: HTMLDivElement = document.createElement('div');
        name.textContent = name.title = title.split('/').pop();
        name.className = GLOBUS_LIST_ITEM_TITLE;
        overview.appendChild(name);

        let formatter = new JSONFormatter(resultData.content[0]);
        formatter.openAtDepth(1);
        let json = formatter.render();
        json.style.fontSize = '12px';
        overview.appendChild(json);
    };

    private filterResults(e: any) {
        let filterList: HTMLUListElement = getGlobusElement(this.parentGroup, SEARCH_FILTER_LIST) as HTMLUListElement;
        e.target.classList.toggle(GLOBUS_ACTIVE);
        filterList.hidden = !filterList.hidden;
    }

    private createHTMLElements() {
        /* ------------- <indexGroup> ------------- */

        let indexDefault = document.createElement('option');
        indexDefault.text = 'Select Index';
        indexDefault.disabled = true;
        indexDefault.selected = true;
        let indexRamses = document.createElement('option');
        indexRamses.text = 'Ramses';
        $.data<GlobusIndex>(indexRamses, 'value', SEARCH_INDEX['RAMSES']);
        let indexMDF = document.createElement('option');
        indexMDF.text = 'MDF';
        $.data<GlobusIndex>(indexMDF, 'value', SEARCH_INDEX['MDF']);
        let indexKasthuri = document.createElement('option');
        indexKasthuri.text = 'Kasthuri';
        $.data<GlobusIndex>(indexKasthuri, 'value', SEARCH_INDEX['KASTHURI']);

        let indexSelect = document.createElement('select');
        indexSelect.className = `${GLOBUS_DISPLAY_FLEX} ${SEARCH_INDEX_SELECT} ${GLOBUS_BORDER}`;
        indexSelect.appendChild(indexDefault);
        indexSelect.appendChild(indexRamses);
        indexSelect.appendChild(indexMDF);
        indexSelect.appendChild(indexKasthuri);
        indexSelect.addEventListener('change', this.searchIndex.bind(this));

        let indexGroup = document.createElement('div');
        indexGroup.className = `${GLOBUS_DISPLAY_FLEX} ${SEARCH_INDEX_GROUP}`;
        indexGroup.appendChild(indexSelect);
        indexGroup.style.display = 'flex';

        /* ------------- </indexGroup> ------------- */


        /* ------------- <resultSearch> ------------- */

        let resultInput: HTMLInputElement = document.createElement('input');
        resultInput.className = `${GLOBUS_INPUT} ${GLOBUS_BORDER} ${SEARCH_RESULT_INPUT}`;
        resultInput.value = '*';
        resultInput.addEventListener('change', this.searchIndex.bind(this));

        let menuFilter: HTMLDivElement = document.createElement('div');
        menuFilter.className = `${GLOBUS_MENU_BTN} ${SEARCH_MENU_FILTER}`;
        menuFilter.textContent = 'Filters';
        menuFilter.addEventListener('click', this.filterResults.bind(this));

        let filterList: HTMLDivElement = document.createElement('div');
        filterList.className = `${GLOBUS_LIST} ${GLOBUS_BORDER} ${SEARCH_FILTER_LIST}`;
        filterList.hidden = true;

        let resultMenu: HTMLDivElement = document.createElement('div');
        resultMenu.className = `${GLOBUS_MENU} ${GLOBUS_BORDER} ${SEARCH_MENU}`;
        resultMenu.appendChild(menuFilter);

        let resultList: HTMLUListElement = document.createElement('ul');
        resultList.className = `${GLOBUS_LIST} ${GLOBUS_BORDER} ${SEARCH_RESULT_LIST}`;

        let resultGroup: HTMLDivElement = document.createElement('div');
        resultGroup.className = `${GLOBUS_DISPLAY_FLEX} ${SEARCH_RESULT_GROUP}`;
        resultGroup.appendChild(resultInput);
        resultGroup.appendChild(resultMenu);
        resultGroup.appendChild(filterList);
        resultGroup.appendChild(resultList);
        resultGroup.style.display = 'none';

        /* ------------- </resultSearch> ------------- */


        /* ------------- <overviewGroup> ------------- */

        let menuBack: HTMLDivElement = document.createElement('div');
        menuBack.className = `${GLOBUS_MENU_BTN} ${SEARCH_MENU_BACK}`;
        menuBack.addEventListener('click', () => {
            let overviewGroup = getGlobusElement(this.parentGroup, SEARCH_OVERVIEW_GROUP);
            let resultGroup = getGlobusElement(this.parentGroup, SEARCH_RESULT_GROUP);
            overviewGroup.style.display = 'none';
            resultGroup.style.display = 'flex';
        });

        let menuOverview: HTMLDivElement = document.createElement('div');
        menuOverview.className = `${GLOBUS_MENU_BTN} ${SEARCH_MENU_OVERVIEW}`;
        menuOverview.textContent = 'Overview';

        let overviewMenu = document.createElement('div');
        overviewMenu.className = `${GLOBUS_MENU} ${SEARCH_OVERVIEW_MENU} ${GLOBUS_BORDER}`;
        overviewMenu.appendChild(menuBack);
        overviewMenu.appendChild(menuOverview);

        let overview = document.createElement('ul');
        overview.className = `${GLOBUS_LIST} ${SEARCH_OVERVIEW} ${GLOBUS_BORDER}`;

        let transferButton = document.createElement('div');
        transferButton.textContent = 'Transfer';
        transferButton.className = GLOBUS_BUTTON;
        transferButton.addEventListener('click', this.transferClicked.bind(this));

        let overviewGroup = document.createElement('div');
        overviewGroup.className = `${GLOBUS_DISPLAY_FLEX} ${SEARCH_OVERVIEW_GROUP}`;
        overviewGroup.appendChild(overviewMenu);
        overviewGroup.appendChild(overview);
        overviewGroup.appendChild(transferButton);
        overviewGroup.style.display = 'none';

        /* ------------- </overviewGroup> ------------- */


        /* ------------- <parentGroup> ------------- */

        this.parentGroup = document.createElement('div');
        this.parentGroup.className = `${GLOBUS_DISPLAY_FLEX} ${GLOBUS_PARENT_GROUP}`;
        this.parentGroup.appendChild(indexGroup);
        this.parentGroup.appendChild(resultGroup);
        this.parentGroup.appendChild(overviewGroup);

        /* -------------</parentGroup>------------- */

        this.node.appendChild(this.parentGroup);
    }
}

/**
 * Basic interface for a GlobusIndex
 */
interface GlobusIndex {
    searchIndex: string;
    previewObject: {title: string, [p: string]: string};
    filterObject: {[p: string]: string};

    retrieveFiles(metaResult: GlobusMetaResult): {endpointId: string, path: string, fileNames: string[]};
    search(query: string, params: any): Promise<GlobusSearchResult>;
}

/**
 * MDF Index class
 */
class MDFIndex implements GlobusIndex {
    searchIndex: string = '1a57bbe5-5272-477f-9d31-343b8258b7a5';

    retrieveFiles(metaResult: GlobusMetaResult): { endpointId: string, path: string, fileNames: string[] } {
        let files = metaResult.content[0].files;
        let regExpResult = ENDPOINT_ID_REG_EXP.exec(files[0].globus);
        let endpointId = regExpResult[0];
        let temp = files[0].globus.slice(files[0].globus.indexOf(endpointId) + endpointId.length).split('/');
        temp.pop();
        let path = `${temp.join('/')}/`;
        let fileNames = [];
        for (let i = 0; i < files.length; i++) {
            fileNames.push(files[i].globus.slice(files[i].globus.indexOf(path) + path.length));
        }

        return {endpointId, path, fileNames};
    }

    search(query: string, params: any): Promise<GlobusSearchResult> {
        let searchQuery = 'files.globus:globus AND ';
        if ($.isEmptyObject(params)) {
            searchQuery += query;
        }
        else {
            searchQuery += `${searchQueryParams(params)} AND ${query}`;
        }

        return searchIndexAdvanced(this.searchIndex, searchQuery);
    }

    filterObject: {[p: string]: string} = {
        'Number of atoms': 'crystal_structure.number_of_atoms',
        'Composition': 'material.composition',
        'DFT Converged': 'dft.converged'
    };
    previewObject: {title: string, [p: string]: string} = {
        'title': 'mdf.source_name',
        'Material': 'material.composition',
        'Elements': 'material.elements',
        'Files': 'files.length',
    };
}

/**
 * Kasthuri Index class
 */
class KasthuriIndex implements GlobusIndex {
    searchIndex: string = '7dba248c-f41e-4bed-89f9-0043353da169';

    retrieveFiles(metaResult: GlobusMetaResult): {endpointId: string, path: string, fileNames: string[]} {
        let file = metaResult.content[0].remote_file_manifest[0].url;
        let regExpResult = ENDPOINT_ID_REG_EXP.exec(file);
        let endpointId = regExpResult[0];
        let temp = file.slice(file.indexOf(endpointId) + endpointId.length + 1).split('/');
        temp.pop();
        let path = `${temp.join('/')}/`;
        let fileNames = [file.slice(file.indexOf(path) + path.length)];

        return {endpointId, path, fileNames};
    }

    search(query: string, params: any): Promise<GlobusSearchResult> {
        let searchQuery = '';
        if ($.isEmptyObject(params)) {
            searchQuery = query;
        }
        else {
            searchQuery = `${searchQueryParams(params)} AND ${query}`;
        }

        return searchIndexAdvanced(this.searchIndex, searchQuery);
    }

    filterObject: {[p: string]: string} = {};

    previewObject: {title: string, [p: string]: string} = {
        'title': 'remote_file_manifest.0.filename',
        'Category': 'beamline.category.value',
        'Recon_type': 'beamline.recon_type.value',
        'Sample': 'beamline.sample.value',
        'Experiment': 'beamline.experiment.value'
    };
}

/**
 * Ramses Index class
 */
class RamsesIndex implements GlobusIndex {
    searchIndex: string = '5e83718e-add0-4f06-a00d-577dc78359bc';

    retrieveFiles(metaResult: GlobusMetaResult): {endpointId: string, path: string, fileNames: string[]} {
        let file = metaResult.subject;
        let regExpResult = ENDPOINT_ID_REG_EXP.exec(file);
        let endpointId = regExpResult[0];
        let temp = file.slice(file.indexOf(endpointId) + endpointId.length + 1).split('/');
        temp.pop();
        let path = `${temp.join('/')}/`;
        let fileNames = [file.slice(file.indexOf(path) + path.length)];

        return {endpointId, path, fileNames};
    }

    search(query: string, params: any): Promise<GlobusSearchResult> {
        let searchQuery = '';
        if ($.isEmptyObject(params)) {
            searchQuery = query;
        }
        else {
            searchQuery = `${searchQueryParams(params)} AND ${query}`;
        }

        return searchIndexAdvanced(this.searchIndex, searchQuery);
    }

    filterObject: {[p: string]: string} = {
        'Contributor': 'perfdata.contributors.0.contributor_name',
        'Category': 'perfdata.category.value',
        'Publication Year': 'perfdata.publication_year.value',
        'Organization': 'perfdata.organization.value',
        'Maximum File Size': 'perfdata.maximum_file_size.value'
    };

    previewObject: {title: string, [p: string]: string} = {
        'title': 'perfdata.titles.0.value',
        'Description': 'perfdata.descriptions.0.value',
        'Organization': 'perfdata.organization.value',
        'Date': 'perfdata.dates.0.value',
        'Contributors': 'perfdata.contributors.0.contributor_name'
    };
}

const SEARCH_INDEX = {
    RAMSES: new RamsesIndex(),
    MDF: new MDFIndex(),
    KASTHURI: new KasthuriIndex()
};

