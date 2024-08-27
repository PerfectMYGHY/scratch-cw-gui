/**
 * @fileOverview Sanitize the content of an SVG aggressively, to make it as safe
 * as possible
 */
const fixupSvgString = require('./fixup-svg-string');
const {generate, parse, walk} = require('css-tree');
const DOMPurify = require('dompurify');

const sanitizeSvg = {};

// addHook() is undefined when running in an unsupported environment (eg. Node)
if (DOMPurify.isSupported) {
    DOMPurify.addHook(
        'beforeSanitizeAttributes',
        currentNode => {
    
            if (currentNode && currentNode.href && currentNode.href.baseVal) {
                const href = currentNode.href.baseVal.replace(/\s/g, '');
                // "data:" and "#" are valid hrefs
                if ((href.slice(0, 5) !== 'data:') && (href.slice(0, 1) !== '#')) {
    
                    if (currentNode.attributes.getNamedItem('xlink:href')) {
                        currentNode.attributes.removeNamedItem('xlink:href');
                        delete currentNode['xlink:href'];
                    }
                    if (currentNode.attributes.getNamedItem('href')) {
                        currentNode.attributes.removeNamedItem('href');
                        delete currentNode.href;
                    }
                }
            }
            return currentNode;
        }
    );

    DOMPurify.addHook(
        'uponSanitizeElement',
        (node, data) => {
            if (data.tagName === 'style') {
                const ast = parse(node.textContent);
                let isModified = false;
                // Remove any @import rules as it could leak HTTP requests
                walk(ast, (astNode, item, list) => {
                    if (astNode.type === 'Atrule' && astNode.name === 'import') {
                        list.remove(item);
                        isModified = true;
                    }
                });
                if (isModified) {
                    node.textContent = generate(ast);
                }
            }
        }
    );
}

// Use JS implemented TextDecoder and TextEncoder if it is not provided by the
// browser.
let _TextDecoder;
let _TextEncoder;
if (typeof TextDecoder === 'undefined' || typeof TextEncoder === 'undefined') {
    // Wait to require the text encoding polyfill until we know it's needed.
    // eslint-disable-next-line global-require
    const encoding = require('fastestsmallesttextencoderdecoder');
    _TextDecoder = encoding.TextDecoder;
    _TextEncoder = encoding.TextEncoder;
} else {
    _TextDecoder = TextDecoder;
    _TextEncoder = TextEncoder;
}

/**
 * Load an SVG Uint8Array of bytes and "sanitize" it
 * @param {!Uint8Array} rawData unsanitized SVG daata
 * @return {Uint8Array} sanitized SVG data
 */
sanitizeSvg.sanitizeByteStream = function (rawData) {
    const decoder = new _TextDecoder();
    const encoder = new _TextEncoder();
    const sanitizedText = sanitizeSvg.sanitizeSvgText(decoder.decode(rawData));
    return encoder.encode(sanitizedText);
};

// TW: Don't remove extra metadata tag: <!--rotationCenter:10,10-->
// Using literal HTML comments tokens will cause this script to be very hard to inline in
// a <script> element, so we'll instead do this terrible hack which the minifier probably
// won't be able to optimize away.
const HTML_COMMENT_START = `<!${'-'.repeat(2)}`;
const HTML_COMMENT_END = `${'-'.repeat(2)}>`;
const extraMetadataRegex = new RegExp(
    `${HTML_COMMENT_START}rotationCenter:(-?[\\d\\.]+):(-?[\\d\\.]+)${HTML_COMMENT_END}$`
);

/**
 * Load an SVG string and "sanitize" it. This is more aggressive than the handling in
 * fixup-svg-string.js, and thus more risky; there are known examples of SVGs that
 * it will clobber. We use DOMPurify's svg profile, which restricts many types of tag.
 * @param {!string} rawSvgText unsanitized SVG string
 * @return {string} sanitized SVG text
 */
sanitizeSvg.sanitizeSvgText = function (rawSvgText) {
    let sanitizedText = DOMPurify.sanitize(rawSvgText, {
        USE_PROFILES: {svg: true}
    });

    // Remove partial XML comment that is sometimes left in the HTML
    const badTag = sanitizedText.indexOf(']&gt;');
    if (badTag >= 0) {
        sanitizedText = sanitizedText.substring(5, sanitizedText.length);
    }

    // also use our custom fixup rules
    sanitizedText = fixupSvgString(sanitizedText);

    // TW: don't remove extra metadata comment
    const extraMetadataMatch = rawSvgText.match(extraMetadataRegex);
    if (extraMetadataMatch) {
        sanitizedText += extraMetadataMatch[0];
    }

    return sanitizedText;
};

module.exports = sanitizeSvg;
