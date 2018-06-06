import {Contents, ServerConnection} from '@jupyterlab/services';
import {Signal, ISignal} from '@phosphor/signaling';
import {URLExt, PathExt} from '@jupyterlab/coreutils';
import {JSONObject} from '@phosphor/coreutils';
import {PromiseDelegate} from '@phosphor/coreutils';

const FILES_URL = 'files';
const SERVICE_DRIVE_URL = 'api/contents';
export const GCP_DRIVE_NAME = 'GCPDrive';


/**
 * A default implementation for an `IDrive`, talking to the
 * server using the Jupyter REST API.
 */
export
class GCPDrive implements Contents.IDrive {

    private endpointFound = new PromiseDelegate<void>();

    /**
     * Construct a new contents manager object.
     *
     * @param options - The options used to initialize the object.
     */
    constructor(options: Drive.IOptions = {}) {
        this.name = options.name || GCP_DRIVE_NAME;
        this.serverSettings = options.serverSettings || ServerConnection.makeSettings();
        this.findGCPEndpoint(SERVICE_DRIVE_URL, options.apiEndpoint)
            .then(url => {
                this.gcpEndpoint = url; this.endpointFound.resolve(void 0)
            });
    }

    /**
     * The name of the drive, which is used at the leading
     * component of file paths.
     */
    readonly name: string;

    /**
     * A signal emitted when a file operation takes place.
     */
    get fileChanged(): ISignal<this, Contents.IChangedArgs> {
        return this._fileChanged;
    }

    /**
     * The server settings of the drive.
     */
    readonly serverSettings: ServerConnection.ISettings;

    /**
     * Test whether the manager has been disposed.
     */
    get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * Dispose of the resources held by the manager.
     */
    dispose(): void {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        Signal.clearData(this);
    }

    /**
     * Get a file or directory.
     *
     * @param localPath: The path to the file.
     *
     * @param options: The options used to fetch the file.
     *
     * @returns A promise which resolves with the file content.
     *
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
     */
    get(localPath: string, options?: Contents.IFetchOptions): Promise<Contents.IModel> {
        return new Promise<Contents.IModel>(resolve => {
            this.endpointFound.promise.then(async () => {
                let url = this._getUrl(localPath);
                if (this.gcpEndpoint.indexOf(localPath.split('/').shift()) > -1) {
                    url = this._getUrl(localPath.split('/').pop());
                }
                if (options) {
                    // The notebook type cannot take an format option.
                    if (options.type === 'notebook') {
                        delete options['format'];
                    }
                    let content = options.content ? '1' : '0';
                    let params: JSONObject = {...options, content};
                    url += URLExt.objectToQueryString(params);
                }

                let settings = this.serverSettings;
                resolve(await ServerConnection.makeRequest(url, {}, settings).then(response => {
                    if (response.status !== 200) {
                        throw new ServerConnection.ResponseError(response);
                    }
                    return response.json();
                }).then(data => {
                    Contents.validateContentsModel(data);
                    return data;
                }).catch(e => console.log(e)))
            });
        });
    }

    /**
     * Get an encoded download url given a file path.
     *
     * @param localPath - An absolute POSIX file path on the server.
     *
     * #### Notes
     * It is expected that the path contains no relative paths.
     */
    getDownloadUrl(localPath: string): Promise<string> {
        let baseUrl = this.serverSettings.baseUrl;
        return Promise.resolve(URLExt.join(baseUrl, FILES_URL,
            URLExt.encodeParts(localPath)));
    }

    /**
     * Create a new untitled file or directory in the specified directory path.
     *
     * @param options: The options used to create the file.
     *
     * @returns A promise which resolves with the created file content when the
     *    file is created.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
     */
    newUntitled(options: Contents.ICreateOptions = {}): Promise<Contents.IModel> {
        let body = '{}';
        if (options) {
            if (options.ext) {
                options.ext = Private.normalizeExtension(options.ext);
            }
            body = JSON.stringify(options);
        }

        let settings = this.serverSettings;
        let url = this._getUrl(options.path || '');
        let init = {
            method: 'POST',
            body
        };
        return ServerConnection.makeRequest(url, init, settings).then(response => {
            if (response.status !== 201) {
                throw new ServerConnection.ResponseError(response);
            }
            return response.json();
        }).then(data => {
            Contents.validateContentsModel(data);
            this._fileChanged.emit({
                type: 'new',
                oldValue: null,
                newValue: data
            });
            return data;
        });
    }

    /**
     * Delete a file.
     *
     * @param localPath - The path to the file.
     *
     * @returns A promise which resolves when the file is deleted.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
     */
    delete(localPath: string): Promise<void> {
        let url = this._getUrl(localPath);
        if (this.gcpEndpoint.indexOf(localPath.split('/').shift()) > -1) {
            url = this._getUrl(localPath.split('/').pop());
        }
        let settings = this.serverSettings;
        let init = { method: 'DELETE' };
        return ServerConnection.makeRequest(url, init, settings).then(response => {
            // Translate certain errors to more specific ones.
            // TODO: update IPEP27 to specify errors more precisely, so
            // that error types can be detected here with certainty.
            if (response.status === 400) {
                return response.json().then(data => {
                    throw new ServerConnection.ResponseError(response, data['message']);
                });
            }
            if (response.status !== 204) {
                throw new ServerConnection.ResponseError(response);
            }
            this._fileChanged.emit({
                type: 'delete',
                oldValue: { path: localPath },
                newValue: null
            });
        });
    }

    /**
     * Rename a file or directory.
     *
     * @param oldLocalPath - The original file path.
     *
     * @param newLocalPath - The new file path.
     *
     * @returns A promise which resolves with the new file contents model when
     *   the file is renamed.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
     */
    rename(oldLocalPath: string, newLocalPath: string): Promise<Contents.IModel> {
        let settings = this.serverSettings;
        let url = this._getUrl(oldLocalPath);
        if (this.gcpEndpoint.indexOf(oldLocalPath.split('/').shift()) > -1) {
            url = this._getUrl(oldLocalPath.split('/').pop());
        }

        let init = {
            method: 'PATCH',
            body: JSON.stringify({ path: newLocalPath })
        };
        return ServerConnection.makeRequest(url, init, settings).then(response => {
            if (response.status !== 200) {
                throw new ServerConnection.ResponseError(response);
            }
            return response.json();
        }).then(data => {
            Contents.validateContentsModel(data);
            this._fileChanged.emit({
                type: 'rename',
                oldValue: { path: oldLocalPath },
                newValue: data
            });
            return data;
        });
    }

    /**
     * Save a file.
     *
     * @param localPath - The desired file path.
     *
     * @param options - Optional overrides to the model.
     *
     * @returns A promise which resolves with the file content model when the
     *   file is saved.
     *
     * #### Notes
     * Ensure that `model.content` is populated for the file.
     *
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
     */
    save(localPath: string, options: Partial<Contents.IModel> = {}): Promise<Contents.IModel> {
        let settings = this.serverSettings;
        let url = this._getUrl(localPath);
        if (this.gcpEndpoint.indexOf(localPath.split('/').shift()) > -1) {
            url = this._getUrl(localPath.split('/').pop());
        }
        let init = {
            method: 'PUT',
            body: JSON.stringify(options)
        };
        return ServerConnection.makeRequest(url, init, settings).then(response => {
            // will return 200 for an existing file and 201 for a new file
            if (response.status !== 200 && response.status !== 201) {
                throw new ServerConnection.ResponseError(response);
            }
            return response.json();
        }).then(data => {
            Contents.validateContentsModel(data);
            this._fileChanged.emit({
                type: 'save',
                oldValue: null,
                newValue: data
            });
            return data;
        });
    }

    /**
     * Copy a file into a given directory.
     *
     * @param localPath - The original file path.
     *
     * @param toDir - The destination directory path.
     *
     * @returns A promise which resolves with the new contents model when the
     *  file is copied.
     *
     * #### Notes
     * The server will select the name of the copied file.
     *
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
     */
    copy(fromFile: string, toDir: string): Promise<Contents.IModel> {
        let settings = this.serverSettings;
        let url = this._getUrl(toDir);
        let init = {
            method: 'POST',
            body: JSON.stringify({ copy_from: fromFile })
        };
        return ServerConnection.makeRequest(url, init, settings).then(response => {
            if (response.status !== 201) {
                throw new ServerConnection.ResponseError(response);
            }
            return response.json();
        }).then(data => {
            Contents.validateContentsModel(data);
            this._fileChanged.emit({
                type: 'new',
                oldValue: null,
                newValue: data
            });
            return data;
        });
    }

    /**
     * Create a checkpoint for a file.
     *
     * @param localPath - The path of the file.
     *
     * @returns A promise which resolves with the new checkpoint model when the
     *   checkpoint is created.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
     */
    createCheckpoint(localPath: string): Promise<Contents.ICheckpointModel> {
        let url = this._getUrl(localPath, 'checkpoints');
        if (this.gcpEndpoint.indexOf(localPath.split('/').shift()) > -1) {
            url = this._getUrl(localPath.split('/').pop(), 'checkpoints');
        }
        let init = { method: 'POST' };
        return ServerConnection.makeRequest(url, init, this.serverSettings).then(response => {
            if (response.status !== 201) {
                throw new ServerConnection.ResponseError(response);
            }
            return response.json();
        }).then(data => {
            Contents.validateCheckpointModel(data);
            return data;
        });
    }

    /**
     * List available checkpoints for a file.
     *
     * @param localPath - The path of the file.
     *
     * @returns A promise which resolves with a list of checkpoint models for
     *    the file.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
     */
    listCheckpoints(localPath: string): Promise<Contents.ICheckpointModel[]> {
        let url = this._getUrl(localPath, 'checkpoints');
        if (this.gcpEndpoint.indexOf(localPath.split('/').shift()) > -1) {
            url = this._getUrl(localPath.split('/').pop(), 'checkpoints');
        }
        return ServerConnection.makeRequest(url, {}, this.serverSettings).then(response => {
            if (response.status !== 200) {
                throw new ServerConnection.ResponseError(response);
            }
            return response.json();
        }).then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Invalid Checkpoint list');
            }
            for (let i = 0; i < data.length; i++) {
                Contents.validateCheckpointModel(data[i]);
            }
            return data;
        });
    }

    /**
     * Restore a file to a known checkpoint state.
     *
     * @param localPath - The path of the file.
     *
     * @param checkpointID - The id of the checkpoint to restore.
     *
     * @returns A promise which resolves when the checkpoint is restored.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
     */
    restoreCheckpoint(localPath: string, checkpointID: string): Promise<void> {
        let url = this._getUrl(localPath, 'checkpoints', checkpointID);
        if (this.gcpEndpoint.indexOf(localPath.split('/').shift()) > -1) {
            url = this._getUrl(localPath.split('/').pop(), 'checkpoints', checkpointID);
        }
        let init = { method: 'POST' };
        return ServerConnection.makeRequest(url, init, this.serverSettings).then(response => {
            if (response.status !== 204) {
                throw new ServerConnection.ResponseError(response);
            }
        });

    }

    /**
     * Delete a checkpoint for a file.
     *
     * @param localPath - The path of the file.
     *
     * @param checkpointID - The id of the checkpoint to delete.
     *
     * @returns A promise which resolves when the checkpoint is deleted.
     *
     * #### Notes
     * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
     */
    deleteCheckpoint(localPath: string, checkpointID: string): Promise<void> {
        let url = this._getUrl(localPath, 'checkpoints', checkpointID);
        if (this.gcpEndpoint.indexOf(localPath.split('/').shift()) > -1) {
            url = this._getUrl(localPath.split('/').pop(), 'checkpoints', checkpointID);
        }
        let init = { method: 'DELETE' };
        return ServerConnection.makeRequest(url, init, this.serverSettings).then(response => {
            if (response.status !== 204) {
                throw new ServerConnection.ResponseError(response);
            }
        });
    }

    /**
     * Get a REST url for a file given a path.
     */
    private _getUrl(...args: string[]): string {
        let parts = args.map(path => URLExt.encodeParts(path));
        if (parts[0] === '') {
            return this.gcpEndpoint;
        }
        else {
            return URLExt.join(this.gcpEndpoint, ...parts);
        }
    }

    private gcpEndpoint: string;
    private _isDisposed = false;
    private _fileChanged = new Signal<this, Contents.IChangedArgs>(this);

    private async findGCPEndpoint(apiEndpoint: string, localPath: string | undefined) {
        let baseUrl = this.serverSettings.baseUrl;
        let url = URLExt.join(baseUrl, apiEndpoint, localPath);
        console.log(url);

        let promise = new Promise<string>((resolve) => {
            ServerConnection.makeRequest(url, {}, this.serverSettings).then(response => {
                if (response.status !== 200) {
                    let parts = localPath.split('/');
                    parts.shift();
                    resolve(this.findGCPEndpoint(apiEndpoint, parts.join('/')));
                }
                else {
                    console.log('GOT ENDPOINT');
                    resolve(url);
                }
            });
        });

        return await promise;
    }
}

/**
 * A namespace for Drive statics.
 */
export
namespace Drive {
    /**
     * The options used to intialize a `Drive`.
     */
    export
    interface IOptions {
        /**
         * The name for the `Drive`, which is used in file
         * paths to disambiguate it from other drives.
         */
        name?: string;

        /**
         * The server settings for the server.
         */
        serverSettings?: ServerConnection.ISettings;

        /**
         * A REST endpoint for drive requests.
         * If not given, defaults to the Jupyter
         * REST API given by [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
         */
        apiEndpoint?: string;
    }
}

/**
 * A namespace for module private data.
 */
namespace Private {
    /**
     * Normalize a file extension to be of the type `'.foo'`.
     *
     * Adds a leading dot if not present and converts to lower case.
     */
    export
    function normalizeExtension(extension: string): string {
        if (extension.length > 0 && extension.indexOf('.') !== 0) {
            extension = `.${extension}`;
        }
        return extension;
    }

    /**
     * Normalize a global path. Reduces '..' and '.' parts, and removes
     * leading slashes from the local part of the path, while retaining
     * the drive name if it exists.
     */
    export
    function normalize(path: string): string {
        const parts = path.split(':');
        if (parts.length === 1) {
            return PathExt.normalize(path);
        }
        return `${parts[0]}:${PathExt.normalize(parts.slice(1).join(':'))}`;
    }
}
