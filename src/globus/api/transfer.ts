import {
    GlobusDeleteTask, GlobusEndpointItem,
    GlobusEndpointList,
    GlobusFileList,
    GlobusNewDirectoryOperation,
    GlobusOperationResponse,
    GlobusRenameOperation, GlobusResponse,
    GlobusSubmissionId,
    GlobusTaskList,
    GlobusTaskResponse,
    GlobusTransferTask
} from "./models";
import {makeGlobusRequest, Private} from "./client";
import tokens = Private.tokens;

const GLOBUS_TRANSFER_API_URL = 'https://transfer.api.globusonline.org/v0.10';

/**
 * Autoactivates an endpoint by making an empty POST request
 * @param {string} endpointId
 * @returns {Promise<any>}
 */
export function activateEndpoint(endpointId: string): Promise<any> {
    // TODO Deal with failed activations
    return makeTransferRequest(
        `${GLOBUS_TRANSFER_API_URL}/endpoint/${endpointId}/autoactivate`,{
            method: 'POST',
            body: ''
        });
}

/**
 * Returns the latest 1000 tasks requested by the signed in user
 * @returns {Promise<GlobusTaskList>}
 */
export function taskSearch(): Promise<GlobusTaskList> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/task_list?limit=1000&filter=type:TRANSFER,DELETE`) as Promise<GlobusTaskList>;
}

/**
 * Returns the contents of a endpoint's folder
 * @param {string} endpointId
 * @param {string} dirPath
 * @returns {Promise<GlobusFileList>}
 */
export function listDirectoryContents(endpointId: string, dirPath: string = '/~/'): Promise<GlobusFileList> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/ls?path=${dirPath}`) as Promise<GlobusFileList>;
}

/**
 * Returns a list of endpoints based on the query
 * @param {string} query
 * @returns {Promise<GlobusEndpointList>}
 */
export function endpointSearch(query: string): Promise<GlobusEndpointList> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/endpoint_search?filter_fulltext=${query}`) as Promise<GlobusEndpointList>;
}

/**
 * Returns a specific endpoint based on endpointId
 * @param {string} endpointId
 * @returns {Promise<GlobusEndpointItem>}
 */
export function endpointSearchById(endpointId: string): Promise<GlobusEndpointItem> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/endpoint/${endpointId}`) as Promise<GlobusEndpointItem>;
}

/**
 * Takes in a task (transfer or delete) and returns the appropriate response
 * @param {GlobusTransferTask | GlobusDeleteTask} task
 * @returns {Promise<GlobusTaskResponse>}
 */
export function submitTask(task: GlobusTransferTask | GlobusDeleteTask): Promise<GlobusTaskResponse> {
    return makeTransferRequest(
        `${GLOBUS_TRANSFER_API_URL}/${task.DATA_TYPE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        }) as Promise<GlobusTaskResponse>;
}

/**
 * Takes in an operation (rename or newDir) and returns the appropriate response
 * @param {string} endpointId
 * @param {GlobusRenameOperation | GlobusNewDirectoryOperation} operation
 * @returns {Promise<GlobusOperationResponse>}
 */
export function submitOperation(endpointId: string, operation: GlobusRenameOperation | GlobusNewDirectoryOperation): Promise<GlobusOperationResponse> {
    return makeTransferRequest(
        `${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/${operation.DATA_TYPE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(operation)
        }) as Promise<GlobusOperationResponse>;
}

/**
 * Requests and returns a submission id required for GlobusTask
 * @returns {Promise<GlobusSubmissionId>}
 */
export function requestSubmissionId(): Promise<GlobusSubmissionId> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/submission_id`) as Promise<GlobusSubmissionId>;
}

/**
 * Calls makeGlobusRequest() with the appropriate url and options to use the Globus Transfer API
 * @param {string} url
 * @param options
 * @returns {Promise<GlobusResponse>}
 */
function makeTransferRequest(url: string, options?: any): Promise<GlobusResponse> {
    options = {method: 'GET', ...options};
    options.headers = {'Authorization': `Bearer ${tokens.transferToken}`, ...options.headers};

    return makeGlobusRequest(url, options);
}
