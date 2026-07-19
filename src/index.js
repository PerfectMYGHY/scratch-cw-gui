import GUI from './containers/gui.jsx';
import AppStateHOC from './lib/app-state-hoc.jsx';
import GuiReducer, {guiInitialState, guiMiddleware, initEmbedded, initFullScreen, initPlayer} from './reducers/gui';
import LocalesReducer, {localesInitialState, initLocale} from './reducers/locales';
import {ScratchPaintReducer} from 'scratch-paint';
import {setFullScreen, setPlayer} from './reducers/mode';
import {remixProject} from './reducers/project-state';
import {setAppElement} from 'react-modal';
import AddonChannels from './addons/channels';
import SettingsStore from './addons/settings-store-singleton';
import AddonHooks from './addons/hooks';
import runAddons from './addons/entry';
import downloadBlob from './lib/download-blob.js';
import {detectLocale} from './lib/detect-locale';
import locales from 'scratch-l10n';

const onExportSettings = settings => {
    const blob = new Blob([JSON.stringify(settings)]);
    downloadBlob('turbowarp-addon-settings.json', blob);
};

const LoadSettings = () => {
    const Settings = require('./addons/settings/settings.jsx');
    return Settings;
};

const guiReducers = {
    locales: LocalesReducer,
    scratchGui: GuiReducer,
    scratchPaint: ScratchPaintReducer
};

const getInitializedLocales = () => {
    let initializedLocales = localesInitialState;
    const locale = detectLocale(Object.keys(locales));
    if (locale !== 'en') {
        initializedLocales = initLocale(initializedLocales, locale);
    }
    return initializedLocales;
};

export default GUI;

export {
    AppStateHOC,
    setAppElement,
    guiReducers,
    guiInitialState,
    guiMiddleware,
    initEmbedded,
    initPlayer,
    initFullScreen,
    initLocale,
    localesInitialState,
    remixProject,
    setFullScreen,
    setPlayer,
    AddonChannels,
    SettingsStore,
    AddonHooks,
    runAddons,
    LoadSettings,
    onExportSettings,
    getInitializedLocales
};
