import {Widget} from '@phosphor/widgets';
import {searchIndex, searchIndexAdvanced} from "../api/search";
import {
    displayError,
    getGlobusElement,
    getGlobusParentGroup,
    removeChildren,
    GLOBUS_BORDER,
    GLOBUS_DISPLAY_FLEX,
    GLOBUS_INPUT,
    GLOBUS_LIST,
    GLOBUS_LIST_ITEM,
    GLOBUS_PARENT_GROUP,
    LOADING_ICON,
    LOADING_LABEL, ENDPOINT_ID_REG_EXP, GLOBUS_LIST_ITEM_TITLE, GLOBUS_LIST_ITEM_SUBTITLE,
} from "../../utils";
import * as $ from "jquery";
import {GlobusMetaContent, GlobusMetaResult, GlobusSearchResult} from "../api/models";
import moment = require("moment");

/**
 * CSS Classes
 */
const GLOBUS_SEARCH = 'jp-Globus-search';
const SEARCH_INDEX_GROUP = 'jp-Search-indexGroup';
const SEARCH_INDEX_SELECT = 'jp-Search-indexSelect';
const SEARCH_RESULT_INPUT = 'jp-Search-resultInput';
const SEARCH_RESULT_LIST = 'jp-Search-resultList';
const SEARCH_RESULT_GROUP = 'jp-Search-resultGroup';

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

    private indexSelected(e: any) {
        let globusParentGroup = getGlobusParentGroup(e.target);
        let resultInput: HTMLInputElement = getGlobusElement(globusParentGroup, SEARCH_RESULT_INPUT) as HTMLInputElement;
        let resultList: HTMLUListElement = getGlobusElement(globusParentGroup, SEARCH_RESULT_LIST) as HTMLUListElement;
        let resultGroup: HTMLDivElement = getGlobusElement(globusParentGroup, SEARCH_RESULT_GROUP) as HTMLDivElement;
        let indexSelect: HTMLSelectElement = getGlobusElement(globusParentGroup, SEARCH_INDEX_SELECT) as HTMLSelectElement;

        resultGroup.style.display = 'flex';
        this.retrieveResults($.data(indexSelect.options[indexSelect.selectedIndex], 'value'), resultInput, resultList);
    }

    private fetchResults(index: GlobusIndex, query: string, resultList: HTMLUListElement) {
        return new Promise<void>((resolve) => {
            index.search(query).then(data => {
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
        for (let i = 0; i < data.gmeta.length; i++) {
            let resultData = data.gmeta[i].content;

            let result: HTMLLIElement = index.visualize(resultData);
            result.className = GLOBUS_LIST_ITEM;

            $.data(result, 'data', resultData);

            result.addEventListener("click", this.resultClicked.bind(this));
            resultList.appendChild(result);
        }
    }

    private retrieveResults(index: GlobusIndex, resultInput: HTMLInputElement, resultList: HTMLUListElement) {
        if (resultInput.value.length == 0) {
            resultInput.value = '*';
        }

        removeChildren(resultList);

        LOADING_LABEL.textContent = 'Loading Results...';
        resultList.appendChild(LOADING_ICON);
        resultList.appendChild(LOADING_LABEL);
        this.fetchResults(index, resultInput.value, resultList).then(() => {
            resultList.removeChild(LOADING_ICON);
            resultList.removeChild(LOADING_LABEL);
        });
    }

    private resultClicked(e: any) {

    }


    private createHTMLElements() {
        /* ------------- <indexGroup> ------------- */

        let indexDefault = document.createElement('option');
        indexDefault.text = 'Select Index';
        indexDefault.disabled = true;
        indexDefault.selected = true;
        let indexRamses = document.createElement('option');
        indexRamses.text = 'Ramses Project';
        $.data<GlobusIndex>(indexRamses, 'value', SEARCH_INDEX['RAMSES']);
        let indexMDF = document.createElement('option');
        indexMDF.text = 'MDF';
        $.data<GlobusIndex>(indexMDF, 'value', SEARCH_INDEX['MDF']);

        let indexSelect = document.createElement('select');
        indexSelect.className = `${GLOBUS_DISPLAY_FLEX} ${SEARCH_INDEX_SELECT} ${GLOBUS_BORDER}`;
        indexSelect.appendChild(indexDefault);
        indexSelect.appendChild(indexRamses);
        indexSelect.appendChild(indexMDF);
        indexSelect.addEventListener('change', this.indexSelected.bind(this));

        let indexGroup = document.createElement('div');
        indexGroup.className = `${GLOBUS_DISPLAY_FLEX} ${SEARCH_INDEX_GROUP}`;
        indexGroup.appendChild(indexSelect);
        indexGroup.style.display = 'flex';

        /* ------------- </indexGroup> ------------- */


        /* ------------- <resultSearch> ------------- */

        let resultInput: HTMLInputElement = document.createElement('input');
        resultInput.className = `${GLOBUS_INPUT} ${GLOBUS_BORDER} ${SEARCH_RESULT_INPUT}`;
        resultInput.value = '*';

        let resultList: HTMLUListElement = document.createElement('ul');
        resultList.className = `${GLOBUS_LIST} ${GLOBUS_BORDER} ${SEARCH_RESULT_LIST}`;

        let resultGroup: HTMLDivElement = document.createElement('div');
        resultGroup.className = `${GLOBUS_DISPLAY_FLEX} ${SEARCH_RESULT_GROUP}`;
        resultGroup.appendChild(resultInput);
        resultGroup.appendChild(resultList);
        resultGroup.style.display = 'none';

        /* ------------- </resultSearch> ------------- */


        /* ------------- <parentGroup> ------------- */

        this.parentGroup = document.createElement('div');
        this.parentGroup.className = `${GLOBUS_DISPLAY_FLEX} ${GLOBUS_PARENT_GROUP}`;
        this.parentGroup.appendChild(indexGroup);
        this.parentGroup.appendChild(resultGroup);

        /* -------------</parentGroup>------------- */

        this.node.appendChild(this.parentGroup);
    }
}


interface GlobusIndex {
    searchIndex: string;
    retrieveEndpointId(metaResult: GlobusMetaResult): string;
    search(query: string): Promise<GlobusSearchResult>;
    visualize(content: GlobusMetaContent): HTMLLIElement;
}

class MDFIndex implements GlobusIndex {
    searchIndex: string = '1a57bbe5-5272-477f-9d31-343b8258b7a5';

    retrieveEndpointId(metaResult: GlobusMetaResult): string {
        return ENDPOINT_ID_REG_EXP.exec(metaResult.content[0].files[0].globus)[0];
    }

    search(query: string): Promise<GlobusSearchResult> {
        return searchIndexAdvanced(this.searchIndex, `files.globus:globus AND ${query}`);
    }

    visualize(content: GlobusMetaContent): HTMLLIElement {
        let result = document.createElement('li');

        let resultData = content[0];

        let name: HTMLDivElement = document.createElement('div');
        name.textContent = name.title = resultData.mdf.source_name;
        name.className = GLOBUS_LIST_ITEM_TITLE;

        let files: HTMLDivElement = document.createElement('div');
        files.className = GLOBUS_LIST_ITEM_SUBTITLE;
        files.innerHTML = `<strong>Files:</strong> ${resultData.files.length}\n`;

        result.appendChild(name);
        result.appendChild(files);

        return result;
    }
}

class RamsesIndex implements GlobusIndex {
    searchIndex: string = '5e83718e-add0-4f06-a00d-577dc78359bc';

    retrieveEndpointId(metaResult: GlobusMetaResult): string {
        return ENDPOINT_ID_REG_EXP.exec(metaResult.subject)[0];
    }

    search(query: string): Promise<GlobusSearchResult> {
        return searchIndex(this.searchIndex, query);
    }

    visualize(content: GlobusMetaContent): HTMLLIElement {
        let result = document.createElement('li');

        let resultData = content[0].perfdata;

        let name: HTMLDivElement = document.createElement('div');
        name.textContent = name.title = resultData.titles[0].value;
        name.className = GLOBUS_LIST_ITEM_TITLE;

        let description: HTMLDivElement = document.createElement('div');
        description.className = GLOBUS_LIST_ITEM_SUBTITLE;
        description.innerHTML = `<strong>Description:</strong> ${resultData.descriptions[0].value}\n`;

        let fileSystem: HTMLDivElement = document.createElement('div');
        fileSystem.className = GLOBUS_LIST_ITEM_SUBTITLE;
        fileSystem.innerHTML = `<strong>Filesystem:</strong> ${resultData.filesystem.value}\n`;

        let maxFileSize: HTMLDivElement = document.createElement('div');
        maxFileSize.className = GLOBUS_LIST_ITEM_SUBTITLE;
        maxFileSize.innerHTML = `<strong>Maximum File Size:</strong> ${resultData.maximum_file_size.value}\n`;

        let organization: HTMLDivElement = document.createElement('div');
        organization.className = GLOBUS_LIST_ITEM_SUBTITLE;
        organization.innerHTML = `<strong>Organization:</strong> ${resultData.organization.value}\n`;

        let date: HTMLDivElement = document.createElement('div');
        date.className = GLOBUS_LIST_ITEM_SUBTITLE;
        date.innerHTML = `<strong>Date:</strong> ${moment(resultData.dates[0].value).format('YYYY')}\n`;

        let contributors: HTMLDivElement = document.createElement('div');
        contributors.className = GLOBUS_LIST_ITEM_SUBTITLE;
        contributors.innerHTML = `<strong>Contributors:</strong> ${resultData.contributors[0].contributor_name}\n`;

        let formats: HTMLDivElement = document.createElement('div');
        formats.className = GLOBUS_LIST_ITEM_SUBTITLE;
        formats.innerHTML = `<strong>Formats:</strong> ${resultData.formats[0].value}\n`;

        result.appendChild(name);
        result.appendChild(description);
        result.appendChild(fileSystem);
        result.appendChild(maxFileSize);
        result.appendChild(organization);
        result.appendChild(date);
        result.appendChild(contributors);
        result.appendChild(formats);

        return result;
    }
}

const SEARCH_INDEX = {
    RAMSES: new RamsesIndex(),
    MDF: new MDFIndex()
};

