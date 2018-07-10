import {GlobusResponse} from "./models";
import {makeGlobusRequest} from "./client";
import {Private} from "./client";
import tokens = Private.tokens;

const GLOBUS_SEARCH_API_URL = 'https://search.api.globus.org/';

export function simpleGet(index: string) {
    return makeSearchRequest(`${GLOBUS_SEARCH_API_URL}/v1/index/${index}/search?q=*`);
}

function makeSearchRequest(url: string, options?: any): Promise<GlobusResponse> {
    options = {method: 'GET', ...options};
    options.headers = {'Authorization': `Bearer ${tokens.searchToken}`, ...options.headers};

    return makeGlobusRequest(url, options);
}
