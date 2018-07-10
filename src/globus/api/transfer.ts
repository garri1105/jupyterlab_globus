import {
    GlobusDeleteTask,
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

export function activateEndpoint(endpointId: string): Promise<any> {
    // TODO Deal with failed activations
    return makeTransferRequest(
        `${GLOBUS_TRANSFER_API_URL}/endpoint/${endpointId}/autoactivate`,{
            method: 'POST',
            body: ''
        });
}

export function taskSearch(): Promise<GlobusTaskList> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/task_list?limit=1000&filter=type:TRANSFER,DELETE`) as Promise<GlobusTaskList>;
}

export function listDirectoryContents(endpointId: string, dirPath: string = '/~/'): Promise<GlobusFileList> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/operation/endpoint/${endpointId}/ls?path=${dirPath}`) as Promise<GlobusFileList>;
}

export function endpointSearch(query: string): Promise<GlobusEndpointList> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/endpoint_search?filter_fulltext=${query}`) as Promise<GlobusEndpointList>;
}

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

export function requestSubmissionId(): Promise<GlobusSubmissionId> {
    return makeTransferRequest(`${GLOBUS_TRANSFER_API_URL}/submission_id`) as Promise<GlobusSubmissionId>;
}

function makeTransferRequest(url: string, options?: any): Promise<GlobusResponse> {
    options = {method: 'GET', ...options};
    options.headers = {'Authorization': `Bearer ${tokens.transferToken}`, ...options.headers};

    return makeGlobusRequest(url, options);
}
