import {PromiseDelegate} from '@phosphor/coreutils';
import CryptoJS = require('crypto-js');
import {queryParams} from "../utils";

const CLIENT_ID = 'a4b3ea61-d252-4fe2-9b49-9e7e69434367';
const REDIRECT_URI = window.location.href;
const SCOPES = 'openid email profile urn:globus:auth:scope:transfer.api.globus.org:all';

const GLOBUS_TRANSFER_API_URL = 'https://transfer.api.globusonline.org/v0.10';
const GLOBUS_AUTH_URL = 'https://auth.globus.org/v2/oauth2/authorize';
const GLOBUS_AUTH_TOKEN = 'https://auth.globus.org/v2/oauth2/token';

// TODO Symlink support

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

export function submitOperation(endpointId: string, operation: GlobusRenameOperation | GlobusNewFolderOperation): Promise<GlobusOperationResponse> {
    return makeGlobusRequest(
        `${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/${operation.DATA_TYPE}`, {
            method: 'POST',
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

export interface GlobusObject {
    DATA_TYPE: string;
}

export interface GlobusItem extends GlobusObject {
    DATA_TYPE: 'file' | 'task' | 'endpoint' | 'transfer_item' | 'delete_item';
}

export interface GlobusResponse extends GlobusObject {
    DATA_TYPE: 'submission_id' | 'result' | 'mkdir_result' | 'transfer_result' | 'delete_result' | 'task_list' | 'endpoint_list' | 'file_list';
}

export interface GlobusOperation extends GlobusObject {
    DATA_TYPE: 'rename' | 'mkdir' | 'transfer' | 'delete';
}

export interface GlobusItemList extends GlobusResponse {
    DATA: GlobusItem[];
}

export interface GlobusTaskList extends GlobusItemList {
    DATA_TYPE: 'task_list';
    length: number;
    limit: number;
    offset: number;
    total: number;
    DATA: GlobusTaskItem[];
}

export interface GlobusEndpointList extends GlobusItemList {
    DATA_TYPE: 'task_list';
    length: number;
    limit: number;
    offset: number;
    total: number;
    DATA: GlobusEndpointItem[];
}

export interface GlobusFileList extends GlobusItemList {
    DATA_TYPE: 'task_list';
    path: string;
    endpoint: string;
    rename_supported: boolean;
    symling_supported: boolean,
    DATA: GlobusFileItem[];
}

export interface GlobusFileItem {
    DATA_TYPE: 'file';
    name: string;
    type: 'dir' | 'file' | 'invalid_symlink' | 'chr' | 'blk' | 'pipe' | 'other';
    link_target: string | null;
    permissions: string;
    size: number;
    user: string;
    group: string;
    last_modified: string;
}

export interface GlobusEndpointItem extends GlobusItem {
    DATA_TYPE: 'endpoint';
    id: string;
    display_name: string;
    organization?: string;
    department?: string;
    keywords?: string;
    name: string;
    canonical_name?: string;
    username?: string;
    owner_id: string;
    owner_string: string;
    description: string;
    contact_email?: string;
    contact_info?: string;
    info_link?: string;
    public: boolean;
    subscription_id: string | null;
    default_directory: string;
    force_encryption: boolean;
    disable_verify: boolean;
    expire_time: string | null;
    expires_in: number;
    activated: boolean;
    myproxy_server: string | null;
    myproxy_dn: string | null;
    oauth_server?: string;
    is_globus_connect: boolean;
    globus_connect_setup_key: string | null;
    host_endpoint?: string | null;
    host_endpoint_id: string | null;
    host_endpoint_display_name: string | null;
    host_path: string | null;
    s3_url: string;
    s3_owner_activated: boolean;
    acl_available: boolean;
    acl_editable?: boolean;
    in_use: boolean;
    my_effective_roles: string[]
    gcp_connected: boolean | null;
    gcp_paused: boolean | null;
    network_use: 'normal' | 'minimal' | 'aggressive' | 'custom' | null;
    location: string | null;
    min_concurrency: number | null;
    preferred_concurrency: number | null;
    min_parallelism: number | null;
    preferred_parallelism: number | null;
    local_user_info_available: boolean;
    https_server: string | null;
}

export interface GlobusTaskItem extends GlobusItem {
    DATA_TYPE: 'task';
    task_id: string;
    type: 'TRANSFER' | 'DELETE';
    status: 'ACTIVE' | 'INACTIVE' | 'SUCCEDED' | 'FAILED';
    fatal_error: any | null;
    label: string | null;
    username?: string;
    owner_id: string;
    request_time: string;
    completion_time: string | null;
    deadline?: string;
    source_endpoint: string;
    source_endpoint_id: string;
    source_endpoint_display_name: string;
    destination_endpoint: string | null;
    destination_endpoint_id: string | null;
    destination_endpoint_display_name: string | null;
    sync_level: number | null;
    encrypt_data: boolean;
    verify_checksum: boolean;
    delete_destination_extra: boolean;
    recursive_symlinks: string | null;
    preserve_timestamp: boolean;
    command: string;
    history_deleted: boolean;
    faults: number;
    files: number;
    directories: number;
    symlinks: number;
    files_skipped: number;
    files_transferred?: number;
    subtasks_total: number;
    subtasks_pending: number;
    subtasks_retrying?: number;
    subtasks_succeeded: number;
    subtasks_expired: number;
    subtasks_canceled: number;
    subtasks_failed: number;
    bytes_transferred: number;
    bytes_checksummed: number;
    effective_bytes_per_second: number;
    nice_status: string | null;
    nice_status_details: string | null;
    nice_status_short_description: string | null;
    nice_status_expires_in: string | null;
    canceled_by_admin: 'SOURCE' | 'DESTINATION' | 'BOTH' | null;
    canceled_by_admin_message: string | null;
    is_paused: boolean;
}

export interface GlobusDeleteItem extends GlobusItem {
    DATA_TYPE: 'delete_item';
    path: string;
}

export interface GlobusTransferItem extends GlobusItem {
    DATA_TYPE: 'transfer_item';
    source_path: string;
    destination_path: string;
    recursive: boolean;
}

export interface GlobusRenameOperation extends GlobusOperation {
    DATA_TYPE: 'rename';
    old_path: string;
    new_path: string;
}

export interface GlobusNewFolderOperation extends GlobusOperation {
    DATA_TYPE: 'mkdir';
    path: string;
}

export interface GlobusTaskOperation extends GlobusOperation {
    DATA_TYPE: 'transfer' | 'delete';
    submission_id: string;
    label?: string;
    notify_on_succeeded?: boolean;
    notify_on_failed?: boolean;
    notify_on_inactive?: boolean;
    skip_activation_check?: boolean;
    deadline?: string;
}

export interface GlobusTransferTask extends GlobusTaskOperation {
    DATA_TYPE: 'transfer';
    source_endpoint: string;
    destination_endpoint: string;
    DATA: GlobusTransferItem[];
    encrypt_data?: boolean;
    sync_level?: 0 | 1 | 2 | 3;
    verify_checksum?: boolean;
    preserve_timestamp?: boolean;
    delete_destination_extra?: boolean;
    recursive_symlinks?: 'ignore' | 'keep' | 'copy';
}

export interface GlobusDeleteTask extends GlobusTaskOperation {
    DATA_TYPE: 'delete';
    endpoint: string;
    DATA: GlobusDeleteItem[];
    recursive: boolean;
    ignore_missing?: boolean;
    interpret_globs?: boolean;
}

export interface GlobusSubmissionId extends GlobusResponse {
    DATA_TYPE: 'submission_id';
    value: string;
}

export interface GlobusOperationResponse extends GlobusResponse {
    DATA_TYPE: 'result' | 'mkdir_result' | 'transfer_result' | 'delete_result';
    code: string;
    message: string;
    resource: string;
    request_id: string;
}

export interface GlobusTaskResponse extends GlobusOperationResponse {
    DATA_TYPE: 'transfer_result' | 'delete_result';
    task_id: string;
    submission_id: string;
}
