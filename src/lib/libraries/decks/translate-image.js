/**
 * @fileoverview
 * Utility functions for handling tutorial images in multiple languages
 */

const defaultImages = {};
let savedImages = {};
let savedLocale = '';

const translations = {

};

const loadImageData = locale => {
    if (Object.prototype.hasOwnProperty.call(translations, locale)) {
        translations[locale]()
            .then(newImages => {
                savedImages = newImages;
                savedLocale = locale;
            });
    }
};

/**
 * Return image data for tutorials based on locale (default: en)
 * @param {string} imageId key in the images object, or id string.
 * @param {string} locale requested locale
 * @return {string} image
 */
const translateImage = (imageId, locale) => {
    if (locale !== savedLocale || !Object.prototype.hasOwnProperty.call(savedImages, imageId)) {
        return defaultImages[imageId];
    }
    return savedImages[imageId];
};

export {
    loadImageData,
    translateImage
};
