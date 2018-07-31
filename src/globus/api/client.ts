import {PromiseDelegate} from '@phosphor/coreutils';
import CryptoJS = require('crypto-js');
import {queryParams} from "../../utils";
import {GlobusResponse} from "./models";

const CLIENT_ID = 'a4b3ea61-d252-4fe2-9b49-9e7e69434367';
const REDIRECT_URI = window.location.href;
const SCOPES = 'openid email profile urn:globus:auth:scope:transfer.api.globus.org:all urn:globus:auth:scope:search.api.globus.org:all';

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

export function initializeGlobusClient(data: any) {
    Private.tokens.data = data;
}

// TODO : Protect tokens, Cross-Site Request Forgery protection using "state" urlParam
/**
 * 0Auth2SignIn protocol. Retrieves a 0Auth2Token shown to the user in the popup window
 */
export function oauth2SignIn() {
    // Generates verifier and challenge to follow 0Auth2 protocol
    let verifier = generateVerifier();
    let challenge = generateCodeChallenge(verifier);

    // Globus's OAuth 2.0 endpoint for requesting an access token
    let oauth2Endpoint = GLOBUS_AUTH_URL;

    // Create <form> element to submit parameters to OAuth 2.0 endpoint.
    let form: HTMLFormElement = document.createElement('form');
    form.method = 'GET'; // Send as a GET request.
    form.action = oauth2Endpoint;
    form.target = 'popUp';

    // Shows the authorization flow in a popup window
    let popup = window.open('', 'popUp', 'height=800,width=500,resizable,scrollbars');

    // Checks every second for the authorization to be completed
    let timer = setInterval(async () => {
        try {
            // If this line succeeds, it means that we are back in our domain and we have a valid AuthToken
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
                reject(response.statusText);
            }
            return response.json();
        }).then(function(data) {
            resolve(data);
        })
    );

    // Wait for fetch to be done and then return
    return await fetchAccessToken;
}

export function signOut() {
    // Invalidate the globusAuthorized promise and set up a new one.
    sessionStorage.removeItem('data');
    globusAuthorized = new PromiseDelegate<void>();
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

/**
 * Makes a basic Globus Request and returns the response as a json
 * @param {string} url
 * @param options
 * @returns {Promise<GlobusResponse>}
 */
export function makeGlobusRequest(url: string, options: any): Promise<GlobusResponse> {
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

/**
 * Contains the tokens required by the extension.
 */
export namespace Private {
    export let tokens = new class {
        _data: any;
        searchToken: string;
        transferToken: string;

        set data(data: any) {
            this._data = data;
            this.searchToken = data.other_tokens[0].access_token;
            this.transferToken = data.other_tokens[1].access_token;
        }
    };
}