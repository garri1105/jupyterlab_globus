/**
 * Collection of interfaces that outline what the Globus Responses will look like
 */

export interface GlobusObject {
    DATA_TYPE: string;
}

export interface GlobusItem extends GlobusObject {
    DATA_TYPE: 'file' | 'task' | 'endpoint' | 'transfer_item' | 'delete_item';
}

export interface GlobusResponse extends GlobusObject {
    DATA_TYPE: 'submission_id' | 'result' | 'mkdir_result' | 'transfer_result' | 'delete_result' | 'endpoint' | 'task_list' | 'endpoint_list' | 'file_list';
}

export interface GlobusOperation extends GlobusObject {
    DATA_TYPE: 'rename' | 'mkdir' | 'transfer' | 'delete';
}

export interface GlobusItemList extends GlobusResponse {
    DATA_TYPE: 'task_list' | 'endpoint_list' | 'file_list';
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
    DATA_TYPE: 'endpoint_list';
    has_next_page: boolean;
    limit: number;
    offset: number;
    DATA: GlobusEndpointItem[];
}

export interface GlobusFileList extends GlobusItemList {
    DATA_TYPE: 'file_list';
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

export interface GlobusEndpointItem extends GlobusItem, GlobusResponse {
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

export interface GlobusNewDirectoryOperation extends GlobusOperation {
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

export interface GlobusSearchResult {
    '@datatype'?: 'GSearchResult';
    '@version'?: '2017-09-01';
    count: number;
    offset: number;
    total: number;
    gmeta: GlobusMetaResult[];
}

export interface GlobusMetaResult {
    '@datatype'?: 'GMetaResult';
    '@version'?: '2017-09-01';
    subject: string;
    content: GlobusMetaContent[];
}

export interface GlobusMetaContent {
    '@context'?: string;
    [x: string]: any;
}
