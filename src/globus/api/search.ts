import {GlobusSearchResult} from "./models";
import {makeGlobusRequest} from "./client";
import {Private} from "./client";
import tokens = Private.tokens;

const GLOBUS_SEARCH_API_URL = 'https://search.api.globus.org/';

export function searchIndex(index: string, query: string): Promise<GlobusSearchResult> {
    return makeSearchRequest(`${GLOBUS_SEARCH_API_URL}/v1/index/${index}/search?q=${query}`);
}

export function searchIndexAdvanced(index: string, query: string): Promise<GlobusSearchResult> {
    return makeSearchRequest(`${GLOBUS_SEARCH_API_URL}/v1/index/${index}/search?q=${query}&advanced=true`);
}

function makeSearchRequest(url: string, options?: any): Promise<any> {
    options = {method: 'GET', ...options};
    options.headers = {'Authorization': `Bearer ${tokens.searchToken}`, ...options.headers};

    return makeGlobusRequest(url, options);
}
