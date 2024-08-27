const atob = require('atob');
const btoa = require('btoa');

class Base64Util {

    /**
     * Convert a base64 encoded string to a Uint8Array.
     * @param {string} base64 - a base64 encoded string.
     * @return {Uint8Array} - a decoded Uint8Array.
     */
    static base64ToUint8Array (base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            array[i] = binaryString.charCodeAt(i);
        }
        return array;
    }

    /**
     * Convert a Uint8Array to a base64 encoded string.
     * @param {Uint8Array|Array<number>} array - the array to convert.
     * @return {string} - the base64 encoded string.
     */
    static uint8ArrayToBase64 (array) {
        let binary = '';
        const len = array.length;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(array[i]);
        }
        return btoa(binary);
    }

    /**
    * Convert an array buffer to a base64 encoded string.
    * @param {array} buffer - an array buffer to convert.
    * @return {string} - the base64 encoded string.
    */
    static arrayBufferToBase64 (buffer) {
        return Base64Util.uint8ArrayToBase64(new Uint8Array(buffer));
    }

}

module.exports = Base64Util;
