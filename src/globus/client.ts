import {PromiseDelegate} from '@phosphor/coreutils';
import CryptoJS = require('crypto-js');
import {queryParams} from "../utils";

const CLIENT_ID = 'a4b3ea61-d252-4fe2-9b49-9e7e69434367';
const REDIRECT_URI = window.location.href;
const SCOPES = 'openid email profile urn:globus:auth:scope:transfer.api.globus.org:all';

const GLOBUS_TRANSFER_API_URL = 'https://transfer.api.globusonline.org/v0.10';
const GLOBUS_AUTH_URL = 'https://auth.globus.org/v2/oauth2/authorize';
const GLOBUS_AUTH_TOKEN = 'https://auth.globus.org/v2/oauth2/token';

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

export function activateEndpoint(endpointId: string): Promise<void> {
    // TODO Deal with failed activations
    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/endpoint/${endpointId}/autoactivate`,{
            method: 'POST',
            body: ''
        });
}

export function taskSearch() {
    return makeGlobusRequest(`${GLOBUS_TRANSFER_API_URL}/task_list?limit=1000&filter=type:TRANSFER,DELETE`);
}

export function listDirectoryContents(endpointId: string, dirPath: string = '/~/') {
    return makeGlobusRequest(`${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/ls?path=${dirPath}`);
}

export function endpointSearch(query: string) {
    return makeGlobusRequest(`${GLOBUS_TRANSFER_API_URL}/endpoint_search?filter_fulltext=${query}`);
}

export async function transferFile(items: any, sourceId: string, destinationId: string) {
    let submissionId = await getSubmissionId();

    let transferJSON: any = {
        'DATA_TYPE': 'transfer',
        'submission_id': submissionId.value,
        'source_endpoint': sourceId,
        'destination_endpoint': destinationId,
        'DATA': items,
        'notify_on_succeeded': false,
        'notify_on_failed': false
    };

    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transferJSON)
        });
}

export async function deleteFile(items: any, endpointId: string, recursive: boolean) {
    console.log(items);
    let submissionId = await getSubmissionId();

    let deleteJSON: any = {
        'DATA_TYPE': 'delete',
        'submission_id': submissionId.value,
        'endpoint': endpointId,
        'recursive': recursive,
        'DATA': items,
        'notify_on_succeeded': false,
        'notify_on_failed': false
    };

    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deleteJSON)
        });
}

export function newFolder(endpointId: string, path: boolean) {
    let mkdirJSON: any = {
        'DATA_TYPE': 'mkdir',
        'path': path
    };

    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/mkdir`, {
            method: 'POST',
            body: JSON.stringify(mkdirJSON)
        });
}

export function renameFile(endpointId: string, oldPath: string, newPath: string) {
    let renameJSON: any = {
        'DATA_TYPE': 'rename',
        'old_path': oldPath,
        'new_path': newPath
    };

    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/rename`, {
            method: 'POST',
            body: JSON.stringify(renameJSON)
        });
}

function getSubmissionId() {
    return makeGlobusRequest(`${GLOBUS_TRANSFER_API_URL}/submission_id`);
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

function makeGlobusRequest(url: string, options: any = defaultOptions) {
    // TODO Build an options constructor
    options = {...defaultOptions, ...options};
    options.headers = {...defaultOptions.headers, ...options.headers};

    return new Promise<any>((resolve, reject) => {
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

export namespace Private {
    export let tokens = new class {
        _data: any;
        transferToken: string;

        set data(data: any) {
            this._data = data;
            this.transferToken = data.other_tokens[0].access_token;
        }
    };
}
