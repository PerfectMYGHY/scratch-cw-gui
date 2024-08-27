const {scratchFetch} = require('./scratchFetch');
const saferFetch = require('./safer-fetch');
const isNullResponse = require('./isNullResponse');

/**
 * @typedef {Request & {withCredentials: boolean}} ScratchSendRequest
 */

/**
 * Get and send assets with the fetch standard web api.
 */
class FetchTool {
    /**
     * Is get supported?
     * Always true for `FetchTool` because `scratchFetch` ponyfills `fetch` if necessary.
     * @returns {boolean} Is get supported?
     */
    get isGetSupported () {
        return true;
    }

    /**
     * Request data from a server with fetch.
     * @param {Request} reqConfig - Request configuration for data to get.
     * @returns {Promise.<Uint8Array?>} Resolve to Buffer of data from server.
     */
    get({ url, ...options }) {
        //console.log(url);
        return saferFetch(url, Object.assign({method: 'GET'}, options))
            .then(result => {
                if (result.ok) return result.arrayBuffer().then(b => new Uint8Array(b));
                if (isNullResponse(result)) return null;
                return Promise.reject(result.status); // TODO: we should throw a proper error
            });
    }

    /**
     * Is sending supported?
     * Always true for `FetchTool` because `scratchFetch` ponyfills `fetch` if necessary.
     * @returns {boolean} Is sending supported?
     */
    get isSendSupported () {
        return true;
    }

    /**
     * Send data to a server with fetch.
     * @param {ScratchSendRequest} reqConfig - Request configuration for data to send.
     * @returns {Promise.<string>} Server returned metadata.
     */
    send ({url, withCredentials = false, ...options}) {
        return scratchFetch(url, Object.assign({
            credentials: withCredentials ? 'include' : 'omit'
        }, options))
            .then(response => {
                if (response.ok) return response.text();
                return Promise.reject(response.status);
            });
    }
}

module.exports = FetchTool;
