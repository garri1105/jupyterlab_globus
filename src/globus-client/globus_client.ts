import {GLOBUS_AUTH_TOKEN, GLOBUS_AUTH_URL} from "../index";

import CryptoJS = require('crypto-js');

const CLIENT_ID = 'a4b3ea61-d252-4fe2-9b49-9e7e69434367';
const REDIRECT_URI = 'https://auth.globus.org/v2/web/auth-code';
const SCOPES = 'openid email profile urn:globus:auth:scope:transfer.api.globus.org:all';

let verifier = CryptoJS.lib.WordArray.random(32).toString();
let challenge = CryptoJS.SHA256(verifier)
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

interface UrlParams {
    [key: string]: string;
}

// TODO : Protect tokens, Cross-Site Request Forgery protection using "state" urlParam
export function oauth2SignIn() {
    // Globus's OAuth 2.0 endpoint for requesting an access token
    let oauth2Endpoint = GLOBUS_AUTH_URL;

    // Create <form> element to submit parameters to OAuth 2.0 endpoint.
    let form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);
    form.setAttribute('target', 'popUp');

    // Ready auth pop up
    window.open('', 'popUp', 'height=500,width=500,resizable,scrollbars');

    // Parameters to pass to OAuth 2.0 endpoint.
    let params: UrlParams = {
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
        let input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', p);
        input.setAttribute('value', params[p]);
        form.appendChild(input);
    }

    // Add form to page and submit it to open the OAuth 2.0 endpoint.
    document.body.appendChild(form);
    form.submit();
}

export async function exchangeOAuth2Token(token: string) {
    // Globus's OAuth 2.0 endpoint for requesting an access token
    let oauth2Endpoint = GLOBUS_AUTH_TOKEN;

    // Parameters to pass to OAuth 2.0 endpoint.
    let params: UrlParams = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code',
        'code': token,
        'code_verifier': verifier
    };

    let formData: string = '';

    // Manually encode formData
    for (let p in params) {
        formData = formData.concat(p + '=' + params[p] + '&');
    }

    formData = formData.slice(0, -1);

    let fetchAccessToken: Promise<any> = new Promise<any>((resolve, reject) =>
        fetch(oauth2Endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(function(response) {
            if (response.status >= 400) {
                console.log(response);
                reject(response.status);
            }
            return response.json();
        }).then(function(data) {
            resolve(data);
        })
    );

    return await fetchAccessToken;
}

