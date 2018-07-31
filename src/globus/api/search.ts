import {GlobusSearchResult} from "./models";
import {makeGlobusRequest} from "./client";
import {Private} from "./client";
import tokens = Private.tokens;

const GLOBUS_SEARCH_API_URL = 'https://search.api.globus.org/';

/**
 * Simple search
 * @param {string} index
 * @param {string} query
 * @returns {Promise<GlobusSearchResult>}
 */
export function searchIndex(index: string, query: string): Promise<GlobusSearchResult> {
    return makeSearchRequest(`${GLOBUS_SEARCH_API_URL}/v1/index/${index}/search?q=${query}`);
}

/**
 * Advanced search with advanced queries. Recommended in order to do filtering.
 * @param {string} index
 * @param {string} query
 * @returns {Promise<GlobusSearchResult>}
 */
export function searchIndexAdvanced(index: string, query: string): Promise<GlobusSearchResult> {
    return makeSearchRequest(`${GLOBUS_SEARCH_API_URL}/v1/index/${index}/search?q=${query}&advanced=true`);
}

/**
 * Calls makeGlobusRequest() with the appropriate url and options to use the Globus Search API
 * @param {string} url
 * @param options
 * @returns {Promise<any>}
 */
function makeSearchRequest(url: string, options?: any): Promise<any> {
    options = {method: 'GET', ...options};
    options.headers = {'Authorization': `Bearer ${tokens.searchToken}`, ...options.headers};

    return makeGlobusRequest(url, options);
}

/**
 * Takes in an object and encodes it in the form 'key1:value1 AND key2: value2'. Required for searchIndexAdvances()
 * @param params
 * @returns {string}
 */
export function searchQueryParams(params: any) {
    return Object.keys(params)
        .map(k => k + ':' + params[k])
        .join(' AND ');
}
