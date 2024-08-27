import JSZip from 'jszip';
import {base64ToArrayBuffer} from './tw-base64-utils';

const TYPE_AUTOMATIC = 0;
const TYPE_MANUAL = 1;

/**
 * @typedef {0|1} MetadataType
 */

/**
 * @typedef Metadata
 * @property {string} title
 * @property {number} created Unix seconds
 * @property {Type} type
 * @property {number} projectSize JSON size in bytes
 * @property {number} thumbnailSize Thumbnail size in bytes
 * @property {number} thumbnailWidth
 * @property {number} thumbnailHeight
 * @property {Record<string, number>} assets maps md5exts to size in bytes
 */

const DATABASE_NAME = 'TW_RestorePoints';
const DATABASE_VERSION = 2;
const METADATA_STORE = 'meta';
const PROJECT_STORE = 'projects';
const ASSET_STORE = 'assets';
const THUMBNAIL_STORE = 'thumbnails';
const ALL_STORES = [METADATA_STORE, PROJECT_STORE, ASSET_STORE, THUMBNAIL_STORE];

/** @type {IDBDatabase|null} */
let _cachedDB = null;

/**
 * @returns {Promise<IDBDatabase>} IDB database with all stores created.
 */
const openDB = () => {
    if (_cachedDB) {
        return Promise.resolve(_cachedDB);
    }

    if (typeof indexedDB === 'undefined') {
        return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore(METADATA_STORE, {
                autoIncrement: true
            });
            db.createObjectStore(PROJECT_STORE);
            db.createObjectStore(ASSET_STORE);
            db.createObjectStore(THUMBNAIL_STORE);
        };

        request.onsuccess = () => {
            _cachedDB = request.result;
            resolve(request.result);
        };

        request.onerror = () => {
            reject(new Error(`Could not open database: ${request.error}`));
        };
    });
};

/**
 * Converts a possibly unknown or corrupted object to a known-good metadata object.
 * @param {Partial<Metadata>} obj Unknown object
 * @returns {Metadata} Metadata object with ID
 */
const parseMetadata = obj => {
    // Must not throw -- always return the most salvageable object possible.
    if (!obj || typeof obj !== 'object') {
        obj = {};
    }

    obj.title = typeof obj.title === 'string' ? obj.title : '?';
    obj.created = typeof obj.created === 'number' ? obj.created : 0;
    obj.type = [TYPE_AUTOMATIC, TYPE_MANUAL].includes(obj.type) ? obj.type : TYPE_MANUAL;

    obj.thumbnailSize = typeof obj.thumbnailSize === 'number' ? obj.thumbnailSize : 0;
    obj.projectSize = typeof obj.projectSize === 'number' ? obj.projectSize : 0;

    obj.thumbnailWidth = typeof obj.thumbnailWidth === 'number' ? obj.thumbnailWidth : 480;
    obj.thumbnailHeight = typeof obj.thumbnailHeight === 'number' ? obj.thumbnailHeight : 360;

    obj.assets = (obj.assets && typeof obj.assets === 'object') ? obj.assets : {};
    for (const [asestId, size] of Object.entries(obj.assets)) {
        if (typeof size !== 'number') {
            delete obj.assets[asestId];
        }
    }

    return obj;
};

/**
 * @param {IDBObjectStore} objectStore IDB object store
 * @param {Set<IDBValidKey>} keysToKeep IDB keys that should continue to exist. Type sensitive.
 * @returns {Promise<void>} Resolves when unused items have been deleted
 */
const deleteUnknownKeys = (objectStore, keysToKeep) => new Promise(resolve => {
    const keysRequest = objectStore.getAllKeys();
    keysRequest.onsuccess = async () => {
        const allKeys = keysRequest.result;

        for (const key of allKeys) {
            if (!keysToKeep.has(key)) {
                await new Promise(innerResolve => {
                    const deleteRequest = objectStore.delete(key);
                    deleteRequest.onsuccess = () => {
                        innerResolve();
                    };
                });
            }
        }

        resolve();
    };
});

/**
 * @param {IDBTransaction} transaction readwrite transaction with access to all stores
 * @returns {Promise<void>} Resolves when data has finished being removed.
 */
const removeExtraneousData = transaction => new Promise(resolve => {
    const metadataStore = transaction.objectStore(METADATA_STORE);
    const projectStore = transaction.objectStore(PROJECT_STORE);
    const assetStore = transaction.objectStore(ASSET_STORE);
    const thumbnailStore = transaction.objectStore(THUMBNAIL_STORE);

    const requiredProjects = new Set();
    const requiredAssetIDs = new Set();

    const request = metadataStore.openCursor();
    request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
            requiredProjects.add(cursor.key);
            const metadata = parseMetadata(cursor.value);
            for (const assetId of Object.keys(metadata.assets)) {
                requiredAssetIDs.add(assetId);
            }
            cursor.continue();
        } else {
            // errors will bubble to transaction onerror
            deleteUnknownKeys(projectStore, requiredProjects)
                .then(() => deleteUnknownKeys(assetStore, requiredAssetIDs))
                .then(() => deleteUnknownKeys(thumbnailStore, requiredProjects))
                .then(() => resolve());
        }
    };
});

/**
 * @returns {Promise<void>} Resolves when extraneous restore points have been removed.
 */
const removeExtraneousRestorePoints = () => openDB().then(db => new Promise((resolveTransaction, rejectTransaction) => {
    const transaction = db.transaction(ALL_STORES, 'readwrite');
    transaction.onerror = () => {
        rejectTransaction(new Error(`Transaction error: ${transaction.error}`));
    };

    // Figuring out which restore points to keep and which to remove is non-trivial.
    // We want to keep the most recent restore points for obvious reasons, but we also want to keep some old ones
    // around too in case the project got really screwed up recently, but the user didn't notice.
    // Additionally, if the user switches from editing one project to editing another for a while, we don't want
    // to delete all of the restore points for the old project.

    // Our approach is to put each restore point into a group based on project title, and then further divide into
    // subgroups based on when the restore point was created.

    /**
     * @typedef GroupMetadata
     * @property {number} total Number of non-deleted restore point from this group
     * @property {Map<number, SubgroupMetadata>} subgroups Restore points per subgroup
     */

    /**
     * @typedef SubgroupMetadata
     * @property {number} total Number of non-deleted restore point from this subgroup
     * @property {number} index Number of subgroups for this project that are newer than this one
     */

    /** @type {Map<string, GroupMetadata>} */
    const groups = new Map();
    let total = 0;

    const SUBGROUP_PERIOD_SECONDS = 60 * 60;
    const timeToSubgroup = unixSeconds => Math.floor(unixSeconds / SUBGROUP_PERIOD_SECONDS);

    // Each successive subgroup's limit is 1 less than the previous, but always at least 1
    const MAX_FOR_FIRST_SUBGROUP = 4;
    // n + (n - 1) + (n - 2) + ... + 1 = (n + 1) * n / 2
    // Add a bit more on top to help old restore points stay around
    const MAX_PER_GROUP = ((MAX_FOR_FIRST_SUBGROUP + 1) * MAX_FOR_FIRST_SUBGROUP / 2) + 2;
    const MAX_TOTAL = MAX_PER_GROUP * 2;

    /**
     * @param {Metadata} metadata Restore point metadata
     * @returns {boolean} True if the restore point should be deleted
     */
    const shouldDelete = metadata => {
        // Manual restore points are never automatically deleted and do not count against any limits
        if (metadata.type !== TYPE_AUTOMATIC) {
            return false;
        }

        if (total >= MAX_TOTAL) {
            return true;
        }

        if (!groups.has(metadata.title)) {
            groups.set(metadata.title, {
                total: 0,
                subgroups: new Map()
            });
        }
        const groupMetadata = groups.get(metadata.title);

        if (groupMetadata.total >= MAX_PER_GROUP) {
            return true;
        }

        const subgroup = timeToSubgroup(metadata.created);
        if (!groupMetadata.subgroups.has(subgroup)) {
            groupMetadata.subgroups.set(subgroup, {
                total: 0,
                index: groupMetadata.subgroups.size
            });
        }
        const subgroupMetadata = groupMetadata.subgroups.get(subgroup);

        const subgroupMax = Math.max(1, MAX_FOR_FIRST_SUBGROUP - subgroupMetadata.index);
        if (subgroupMetadata.total >= subgroupMax) {
            return true;
        }

        // If we get here, we're keeping the restore point.
        total++;
        groupMetadata.total++;
        subgroupMetadata.total++;
        return false;
    };

    const metadataStore = transaction.objectStore(METADATA_STORE);
    const getRequest = metadataStore.openCursor(null, 'prev');
    getRequest.onsuccess = () => {
        const cursor = getRequest.result;
        if (cursor) {
            const metadata = parseMetadata(cursor.value);
            if (shouldDelete(metadata)) {
                cursor.delete();
            }
            cursor.continue();
        } else {
            // errors will bubble to transaction onerror
            removeExtraneousData(transaction)
                .then(() => resolveTransaction());
        }
    };
}));

// eslint-disable-next-line valid-jsdoc
/**
 * @param {VirtualMachine} vm scratch-vm instance
 * @returns {Promise<{type: string; data: ArrayBuffer;}>} Thumbnail data
 */
const generateThumbnail = vm => new Promise(resolve => {
    // Piggyback off of the next draw if we can, otherwise just force it to render
    const drawTimeout = setTimeout(() => {
        vm.renderer.draw();
    }, 100);

    vm.renderer.requestSnapshot(dataURL => {
        clearTimeout(drawTimeout);

        const index = dataURL.indexOf(',');
        const base64 = dataURL.substring(index + 1);
        const arrayBuffer = base64ToArrayBuffer(base64);
        const type = 'image/png';
        resolve({
            type,
            data: arrayBuffer
        });
    });
});

/**
 * @param {VirtualMachine} vm scratch-vm instance
 * @param {string} title project title
 * @param {MetadataType} type restore point type
 * @returns {Promise<void>} resolves when the restore point is created
 */
const createRestorePoint = (
    vm,
    title,
    type
) => openDB().then(db => new Promise((resolveTransaction, rejectTransaction) => {
    /** @type {Record<string, Uint8Array>} */
    const projectFiles = vm.saveProjectSb3DontZip();
    const jsonData = projectFiles['project.json'];
    const projectAssetIDs = Object.keys(projectFiles).filter(i => i !== 'project.json');
    if (projectAssetIDs.length === 0) {
        throw new Error('There are no assets in this project');
    }

    generateThumbnail(vm).then(thumbnailData => {
        const transaction = db.transaction(ALL_STORES, 'readwrite');
        transaction.onerror = () => {
            rejectTransaction(new Error(`Transaction error: ${transaction.error}`));
        };

        // Will be generated by database
        /** @type {IDBValidKey} */
        let generatedId = null;

        const writeThumbnail = () => {
            const thumbnailStore = transaction.objectStore(THUMBNAIL_STORE);
            const request = thumbnailStore.add(thumbnailData, generatedId);
            request.onsuccess = () => {
                resolveTransaction();
            };
        };

        const writeMissingAssets = async missingAssets => {
            const assetStore = transaction.objectStore(ASSET_STORE);
            for (const assetId of missingAssets) {
                await new Promise(resolveAsset => {
                    // TODO: should we insert arraybuffer or uint8array?
                    const assetData = projectFiles[assetId];
                    const request = assetStore.add(assetData, assetId);
                    request.onsuccess = () => {
                        resolveAsset();
                    };
                });
            }

            writeThumbnail();
        };

        const checkMissingAssets = () => {
            const assetStore = transaction.objectStore(ASSET_STORE);
            const keyRequest = assetStore.getAllKeys();
            keyRequest.onsuccess = () => {
                const savedAssets = keyRequest.result;
                const missingAssets = projectAssetIDs.filter(assetId => !savedAssets.includes(assetId));
                writeMissingAssets(missingAssets);
            };
        };

        const writeProjectJSON = () => {
            const projectStore = transaction.objectStore(PROJECT_STORE);
            const request = projectStore.add(jsonData, generatedId);
            request.onsuccess = () => {
                checkMissingAssets();
            };
        };

        const writeMetadata = () => {
            const assetSizeData = {};
            for (const assetId of projectAssetIDs) {
                const assetData = projectFiles[assetId];
                assetSizeData[assetId] = assetData.byteLength;
            }

            /** @type {Metadata} */
            const metadata = {
                title,
                created: Math.round(Date.now() / 1000),
                type,
                projectSize: jsonData.byteLength,
                thumbnailSize: thumbnailData.data.byteLength,
                thumbnailWidth: vm.runtime.stageWidth,
                thumbnailHeight: vm.runtime.stageHeight,
                assets: assetSizeData
            };

            const metadataStore = transaction.objectStore(METADATA_STORE);
            const request = metadataStore.add(metadata);
            request.onsuccess = () => {
                generatedId = request.result;
                writeProjectJSON();
            };
        };

        writeMetadata();
    });
}));

/**
 * @param {number} id the restore point's ID
 * @returns {Promise<void>} Resovles when the restore point has been deleted.
 */
const deleteRestorePoint = id => openDB().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction(ALL_STORES, 'readwrite');
    transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error}`));
    };

    const metadataStore = transaction.objectStore(METADATA_STORE);
    const request = metadataStore.delete(id);
    request.onsuccess = () => {
        removeExtraneousData(transaction)
            .then(() => resolve());
    };
}));

/**
 * @returns {Promise<void>} Resolves when all data in the database has been deleted.
 */
const deleteAllRestorePoints = () => openDB().then(db => new Promise((resolveTransaction, rejectTransaction) => {
    const transaction = db.transaction(ALL_STORES, 'readwrite');
    transaction.onerror = () => {
        rejectTransaction(new Error(`Transaction error: ${transaction.error}`));
    };

    const deleteEverything = async () => {
        for (const storeName of ALL_STORES) {
            await new Promise(resolve => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => {
                    resolve();
                };
            });
        }

        resolveTransaction();
    };

    deleteEverything();
}));

/**
 * @param {VirtualMachine} vm scratch-vm instance
 * @param {number} id the restore point's ID
 * @returns {Promise<ArrayBuffer>} Resolves with sb3 file
 */
const loadRestorePoint = (vm, id) => openDB().then(db => new Promise((resolveTransaction, rejectTransaction) => {
    const transaction = db.transaction([METADATA_STORE, PROJECT_STORE, ASSET_STORE], 'readonly');
    transaction.onerror = () => {
        rejectTransaction(new Error(`Transaction error: ${transaction.error}`));
    };

    const zip = new JSZip();
    /** @type {Metadata} */
    let metadata;

    // TODO: we should be able to use a custom scratch-storage helper to avoid putting the
    // zip in memory.

    const loadVM = () => {
        resolveTransaction(
            zip.generateAsync({
                // Don't bother compressing it since it will be immediately decompressed
                type: 'arraybuffer'
            })
                .then(sb3 => vm.loadProject(sb3))
                .then(() => {
                    setTimeout(() => {
                        vm.renderer.draw();
                    });
                })
        );
    };

    const loadAssets = async () => {
        const assetStore = transaction.objectStore(ASSET_STORE);
        for (const assetId of Object.keys(metadata.assets)) {
            await new Promise(resolve => {
                const request = assetStore.get(assetId);
                request.onsuccess = () => {
                    const data = request.result;
                    zip.file(assetId, data);
                    resolve();
                };
            });
        }

        loadVM();
    };

    const loadProjectJSON = () => {
        const projectStore = transaction.objectStore(PROJECT_STORE);
        const request = projectStore.get(id);
        request.onsuccess = () => {
            zip.file('project.json', request.result);
            loadAssets();
        };
    };

    const loadMetadata = () => {
        const metadataStore = transaction.objectStore(METADATA_STORE);
        const request = metadataStore.get(id);
        request.onsuccess = () => {
            metadata = parseMetadata(request.result);
            loadProjectJSON();
        };
    };

    vm.quit();

    loadMetadata();
}));

// eslint-disable-next-line valid-jsdoc
/**
 * @returns {Promise<{totalSize: number; restorePoints: Array<Manifest & {id: number}>}>} Restore point information.
 */
const getAllRestorePoints = () => openDB().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction([METADATA_STORE], 'readonly');
    transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error}`));
    };

    /** @type {Metadata[]} */
    const restorePoints = [];
    /** @type {Set<string>} */
    const countedAssets = new Set();
    let totalSize = 0;

    const metadataStore = transaction.objectStore(METADATA_STORE);
    const request = metadataStore.openCursor(null, 'prev');
    request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
            const parsed = parseMetadata(cursor.value);
            parsed.id = cursor.key;
            restorePoints.push(parsed);

            totalSize += parsed.projectSize;
            totalSize += parsed.thumbnailSize;
            for (const [assetId, assetSize] of Object.entries(parsed.assets)) {
                if (!countedAssets.has(assetId)) {
                    countedAssets.add(assetId);
                    totalSize += assetSize;
                }
            }

            cursor.continue();
        } else {
            resolve({
                totalSize,
                restorePoints
            });
        }
    };
}));

/**
 * @param {number} id restore point's ID
 * @returns {Promise<string>} The URL to load
 */
const getThumbnail = id => openDB().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction([THUMBNAIL_STORE], 'readonly');
    transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error}`));
    };

    const thumbnailStore = transaction.objectStore(THUMBNAIL_STORE);
    const request = thumbnailStore.get(id);
    request.onsuccess = () => {
        const thumbnail = request.result;
        if (!thumbnail) {
            reject(new Error('No thumbnail found'));
            return;
        }

        const blob = new Blob([thumbnail.data], {
            type: thumbnail.type
        });
        const url = URL.createObjectURL(blob);
        resolve(url);
    };
}));

const deleteLegacyRestorePoint = () => {
    const LEGACY_DATABASE_NAME = 'TW_AutoSave';
    try {
        if (typeof indexedDB !== 'undefined') {
            const _request = indexedDB.deleteDatabase(LEGACY_DATABASE_NAME);
            // don't really care what happens to the request at this point
        }
    } catch (e) {
        // ignore
    }
};

const DEFAULT_INTERVAL = 1000 * 60 * 5;
const INTERVAL_STORAGE_KEY = 'tw:restore-point-interval';

const readInterval = () => {
    try {
        const stored = localStorage.getItem(INTERVAL_STORAGE_KEY);
        if (stored) {
            const number = +stored;
            if (Number.isFinite(number)) {
                return number;
            }
        }

        // TODO: this is temporary, remove it after enough has passed for people that care to have migrated
        const addonSettings = localStorage.getItem('tw:addons');
        if (addonSettings) {
            const parsedAddonSettings = JSON.parse(addonSettings);
            const addonObject = parsedAddonSettings['tw-disable-restore-points'];
            if (addonObject && addonObject.enabled) {
                return -1;
            }
        }
    } catch (e) {
        // ignore
    }
    return DEFAULT_INTERVAL;
};

const setInterval = interval => {
    try {
        localStorage.setItem(INTERVAL_STORAGE_KEY, interval);
    } catch (err) {
        // ignore
    }
};

export default {
    TYPE_AUTOMATIC,
    TYPE_MANUAL,
    getAllRestorePoints,
    createRestorePoint,
    removeExtraneousRestorePoints,
    deleteRestorePoint,
    deleteAllRestorePoints,
    getThumbnail,
    loadRestorePoint,
    deleteLegacyRestorePoint,
    readInterval,
    setInterval
};
