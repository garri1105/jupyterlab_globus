import {PromiseDelegate} from '@phosphor/coreutils';
import CryptoJS = require('crypto-js');
import {queryParams} from "../../utils";
import {
    GlobusDeleteTask,
    GlobusEndpointList,
    GlobusFileList,
    GlobusNewDirectoryOperation,
    GlobusOperationResponse,
    GlobusRenameOperation,
    GlobusResponse, GlobusSubmissionId, GlobusTaskList,
    GlobusTaskResponse, GlobusTransferTask
} from "./models";

const CLIENT_ID = 'a4b3ea61-d252-4fe2-9b49-9e7e69434367';
const REDIRECT_URI = window.location.href;
const SCOPES = 'openid email profile urn:globus:auth:scope:transfer.api.globus.org:all';

const GLOBUS_TRANSFER_API_URL = 'https://transfer.api.globusonline.org/v0.10';
const GLOBUS_AUTH_URL = 'https://auth.globus.org/v2/oauth2/authorize';
const GLOBUS_AUTH_TOKEN = 'https://auth.globus.org/v2/oauth2/token';

// TODO Symlink support
// TODO Share support
// TODO Create interface for errors
export const ERROR_CODES: any = {
    'ClientError.NotFound': 'Directory Not Found',
    'EndpointPermissionDenied': 'Endpoint Permission Denied',
    'ClientError.ActivationRequired': 'Endpoint Activation Required',
    'ExternalError.DirListingFailed.NotDirectory': 'Not a Directory',
    'ServiceUnavailable': 'Server Under Maintenance',
    'ExternalError.DirListingFailed.GCDisconnected': 'Globus Connect Not Running',
    'ExternalError.DirListingFailed': 'Directory Listing Failed',
    'ExternalError.DirListingFailed.PermissionDenied': 'Permission Denied',
    'ExternalError.DirListingFailed.ConnectFailed': 'Connection Failed'
};

export let globusAuthorized = new PromiseDelegate<void>();

let defaultOptions: any;

export function initializeGlobusClient(data: any) {
    Private.tokens.data = data;
    defaultOptions = {
        method: 'GET',
        headers: {'Authorization': `Bearer ${Private.tokens.transferToken}`}
    };
}

// TODO : Protect tokens, Cross-Site Request Forgery protection using "state" urlParam
/**
 * 0Auth2SignIn protocol. Retrieves a 0Auth2Token shown to the user in the popup window
 */
export function oauth2SignIn() {
    let verifier = generateVerifier();
    let challenge = generateCodeChallenge(verifier);

    // Globus's OAuth 2.0 endpoint for requesting an access token
    let oauth2Endpoint = GLOBUS_AUTH_URL;

    // Create <form> element to submit parameters to OAuth 2.0 endpoint.
    let form: HTMLFormElement = document.createElement('form');
    form.method = 'GET'; // Send as a GET request.
    form.action = oauth2Endpoint;
    form.target = 'popUp';

    let popup = window.open('', 'popUp', 'height=500,width=500,resizable,scrollbars');
    let timer = setInterval(async () => {
        try {
            let url = new URL(popup.location.href);
            popup.close();
            await exchangeOAuth2Token(url.searchParams.get('code'), verifier)
                .then(data => {
                    clearInterval(timer);
                    globusAuthorized.resolve(data);
                })
                .catch(e => console.log(e));
        }
        catch (e) {}
    }, 1000);

    // Parameters to pass to OAuth 2.0 endpoint.
    let params: any = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'scope': SCOPES,
        'state': '_default',
        'response_type': 'code',
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
        'access_type': 'offline'
    };

    // Add form parameters as hidden input values.
    for (let p in params) {
        let input: HTMLInputElement = document.createElement('input');
        input.type = 'hidden';
        input.name = p;
        input.value = params[p];
        form.appendChild(input);
    }

    // Add form to page and submit it to open the OAuth 2.0 endpoint.
    document.body.appendChild(form);
    form.submit();
}

/**
 * Exchanges a 0Auth2Token for Globus access tokens
 */
export async function exchangeOAuth2Token(token: string, verifier: string) {
    // Globus's OAuth 2.0 endpoint for requesting an access token
    let oauth2Endpoint = GLOBUS_AUTH_TOKEN;

    // Parameters to pass to OAuth 2.0 endpoint.
    let params: any = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code',
        'code': token,
        'code_verifier': verifier
    };

    let formData = queryParams(params);

    let fetchAccessToken: Promise<any> = new Promise<any>((resolve, reject) =>
        fetch(oauth2Endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(function(response) {
            if (response.status >= 400) {
                reject(response.status);
            }
            return response.json();
        }).then(function(data) {
            resolve(data);
        })
    );

    return await fetchAccessToken;
}

export function signOut() {
    // Invalidate the globusAuthorized promise and set up a new one.
    sessionStorage.removeItem('data');
    globusAuthorized = new PromiseDelegate<void>();
}

export function activateEndpoint(endpointId: string): Promise<any> {
    // TODO Deal with failed activations
    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/endpoint/${endpointId}/autoactivate`,{
            method: 'POST',
            body: ''
        });
}

export function taskSearch(): Promise<GlobusTaskList> {
    return makeGlobusRequest(`${GLOBUS_TRANSFER_API_URL}/task_list?limit=1000&filter=type:TRANSFER,DELETE`) as Promise<GlobusTaskList>;
}

export function listDirectoryContents(endpointId: string, dirPath: string = '/~/'): Promise<GlobusFileList> {
    return makeGlobusRequest(`${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/ls?path=${dirPath}`) as Promise<GlobusFileList>;
}

export function endpointSearch(query: string): Promise<GlobusEndpointList> {
    return makeGlobusRequest(`${GLOBUS_TRANSFER_API_URL}/endpoint_search?filter_fulltext=${query}`) as Promise<GlobusEndpointList>;
}

export function submitTask(task: GlobusTransferTask | GlobusDeleteTask): Promise<GlobusTaskResponse> {
    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/${task.DATA_TYPE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        }) as Promise<GlobusTaskResponse>;
}

export function submitOperation(endpointId: string, operation: GlobusRenameOperation | GlobusNewDirectoryOperation): Promise<GlobusOperationResponse> {
    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/${operation.DATA_TYPE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(operation)
        }) as Promise<GlobusOperationResponse>;
}

export function requestSubmissionId(): Promise<GlobusSubmissionId> {
    return makeGlobusRequest(`${GLOBUS_TRANSFER_API_URL}/submission_id`) as Promise<GlobusSubmissionId>;
}

function generateVerifier() {
    return CryptoJS.lib.WordArray.random(32).toString();
}

function generateCodeChallenge(verifier: string) {
    return CryptoJS.SHA256(verifier)
        .toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function makeGlobusRequest(url: string, options: any = defaultOptions): Promise<GlobusResponse> {
    options = {...defaultOptions, ...options};
    options.headers = {...defaultOptions.headers, ...options.headers};

    return new Promise<GlobusResponse>((resolve, reject) => {
        fetch(url, options).then(async response => {
            if (response.status >= 400) {
                reject(await response.json());
            }
            else {
                resolve(await response.json());
            }
        });
    })
}

namespace Private {
    export let tokens = new class {
        _data: any;
        transferToken: string;

        set data(data: any) {
            this._data = data;
            this.transferToken = data.other_tokens[0].access_token;
        }
    };
}