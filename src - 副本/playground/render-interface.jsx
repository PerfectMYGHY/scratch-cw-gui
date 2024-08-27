/**
 * Copyright (C) 2021 Thomas Weber
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import {getIsLoading} from '../reducers/project-state.js';
import DOMElementRenderer from '../containers/dom-element-renderer.jsx';
import AppStateHOC from '../lib/app-state-hoc.jsx';
import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import TWProjectMetaFetcherHOC from '../lib/tw-project-meta-fetcher-hoc.jsx';
import TWStateManagerHOC from '../lib/tw-state-manager-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import TWPackagerIntegrationHOC from '../lib/tw-packager-integration-hoc.jsx';
import SettingsStore from '../addons/settings-store-singleton';
import '../lib/tw-fix-history-api';
import GUI, { runAddons } from './render-gui.jsx';
import MenuBar from '../components/menu-bar/menu-bar.jsx';
import ProjectInput from '../components/tw-project-input/project-input.jsx';
import FeaturedProjects from '../components/tw-featured-projects/featured-projects.jsx';
import Description from '../components/tw-description/description.jsx';
import BrowserModal from '../components/browser-modal/browser-modal.jsx';
import CloudVariableBadge from '../containers/tw-cloud-variable-badge.jsx';
import {isBrowserSupported} from '../lib/tw-environment-support-prober';
import AddonChannels from '../addons/channels';
import {loadServiceWorker} from './load-service-worker';
//import runAddons from '../addons/entry';
import {APP_NAME} from '../lib/brand.js';

import styles from './interface.css';

if (window.parent !== window) {
    // eslint-disable-next-line no-alert
    alert(`This page contains an invalid ${APP_NAME} embed. Please read https://docs.turbowarp.org/embedding for instructions to create a working embed.`);
    throw new Error('Invalid embed');
}

let announcement = null;
if (process.env.ANNOUNCEMENT) {
    announcement = document.createElement('p');
    // This is safe because process.env.ANNOUNCEMENT is set at build time.
    announcement.innerHTML = process.env.ANNOUNCEMENT;
}

const handleClickAddonSettings = addonId => {
    // addonId might be a string of the addon to focus on, undefined, or an event (treat like undefined)
    const path = process.env.ROUTING_STYLE === 'wildcard' ? 'addons' : 'addons.html';
    const url = `${process.env.ROOT}${path}${typeof addonId === 'string' ? `#${addonId}` : ''}`;
    window.open(url);
};

const messages = defineMessages({
    defaultTitle: {
        defaultMessage: 'Run Scratch projects faster',
        description: 'Title of homepage',
        id: 'tw.guiDefaultTitle'
    }
});

const WrappedMenuBar = compose(
    SBFileUploaderHOC,
    TWPackagerIntegrationHOC
)(MenuBar);

//if (AddonChannels.reloadChannel) {
//    AddonChannels.reloadChannel.addEventListener('message', () => {
//        location.reload();
//    });
//}

//if (AddonChannels.changeChannel) {
//    AddonChannels.changeChannel.addEventListener('message', e => {
//        SettingsStore.setStoreWithVersionCheck(e.data);
//    });
//}

runAddons();

const Footer = () => (
    <footer className={styles.footer}>
        <div className={styles.footerContent}>
            <div className={styles.footerText}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="TurboWarp is not affiliated with Scratch, the Scratch Team, or the Scratch Foundation."
                    description="Disclaimer that TurboWarp is not connected to Scratch"
                    id="tw.footer.disclaimer"
                />
            </div>
            <div className={styles.footerColumns}>
                <div className={styles.footerSection}>
                    <a href="credits.html">
                        <FormattedMessage
                            defaultMessage="Credits"
                            description="Credits link in footer"
                            id="tw.footer.credits"
                        />
                    </a>
                    <a href="https://github.com/sponsors/GarboMuffin">
                        <FormattedMessage
                            defaultMessage="Donate"
                            description="Donation link in footer"
                            id="tw.footer.donate"
                        />
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <a href="https://desktop.turbowarp.org/">
                        {/* Do not translate */}
                        {'TurboWarp Desktop'}
                    </a>
                    <a href="https://packager.turbowarp.org/">
                        {/* Do not translate */}
                        {'TurboWarp Packager'}
                    </a>
                    <a href="https://docs.turbowarp.org/embedding">
                        <FormattedMessage
                            defaultMessage="Embedding"
                            description="Link in footer to embedding documentation for embedding link"
                            id="tw.footer.embed"
                        />
                    </a>
                    <a href="https://docs.turbowarp.org/url-parameters">
                        <FormattedMessage
                            defaultMessage="URL Parameters"
                            description="Link in footer to URL parameters documentation"
                            id="tw.footer.parameters"
                        />
                    </a>
                    <a href="https://docs.turbowarp.org/">
                        <FormattedMessage
                            defaultMessage="Documentation"
                            description="Link in footer to additional documentation"
                            id="tw.footer.documentation"
                        />
                    </a>
                </div>
                <div className={styles.footerSection}>
                    <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">
                        <FormattedMessage
                            defaultMessage="Feedback & Bugs"
                            description="Link to feedback/bugs page"
                            id="tw.feedback"
                        />
                    </a>
                    <a href="https://github.com/TurboWarp/">
                        <FormattedMessage
                            defaultMessage="Source Code"
                            description="Link to source code"
                            id="tw.code"
                        />
                    </a>
                    <a href="privacy.html">
                        <FormattedMessage
                            defaultMessage="Privacy Policy"
                            description="Link to privacy policy"
                            id="tw.privacy"
                        />
                    </a>
                </div>
            </div>
        </div>
    </footer>
);

class Interface extends React.Component {
    constructor (props) {
        super(props);
        this.handleUpdateProjectTitle = this.handleUpdateProjectTitle.bind(this);
    }
    componentDidUpdate (prevProps) {
        if (prevProps.isLoading && !this.props.isLoading) {
            loadServiceWorker();
        }
    }
    handleUpdateProjectTitle (title, isDefault) {
        if (isDefault || !title) {
            document.title = `${APP_NAME} - ${this.props.intl.formatMessage(messages.defaultTitle)}`;
        } else {
            document.title = `${title} - ${APP_NAME}`;
        }
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            intl,
            hasCloudVariables,
            description,
            isFullScreen,
            isLoading,
            isPlayerOnly,
            isRtl,
            projectId,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        const isHomepage = isPlayerOnly && !isFullScreen;
        const isEditor = !isPlayerOnly;
        return (
            <div
                className={classNames(styles.container, {
                    [styles.playerOnly]: isHomepage,
                    [styles.editor]: isEditor
                })}
            >
                {isHomepage ? (
                    <div className={styles.menu}>
                            {/*onClickAddonSettings={handleClickAddonSettings}*/}
                        <WrappedMenuBar
                            canChangeLanguage
                            canManageFiles
                            canChangeTheme
                            enableSeeInside
                            onClickLogo={() => {
                                window.location = '/';
                            }}
                        />
                    </div>
                ) : null}
                <div
                    className={styles.center}
                    style={isPlayerOnly ? ({
                        // + 2 accounts for 1px border on each side of the stage
                        width: `${Math.max(480, props.customStageSize.width) + 2}px`
                    }) : null}
                >
                    {isHomepage && announcement ? <DOMElementRenderer domElement={announcement} /> : null}
                    <GUI
                        onClickAddonSettings={handleClickAddonSettings}
                        onUpdateProjectTitle={this.handleUpdateProjectTitle}
                        backpackVisible
                        backpackHost="_local_"
                        {...props}
                    />
                    {isHomepage ? (
                        <React.Fragment>
                            {isBrowserSupported() ? null : (
                                <BrowserModal isRtl={isRtl} />
                            )}
                            <div className={styles.section}>
                                <ProjectInput />
                            </div>
                            {(
                                // eslint-disable-next-line max-len
                                description.instructions === 'unshared' || description.credits === 'unshared'
                            ) && (
                                <div className={classNames(styles.infobox, styles.unsharedUpdate)}>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="Unshared projects are no longer visible."
                                            description="Appears on unshared projects"
                                            id="tw.unshared2.1"
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="For more information, visit: {link}"
                                            description="Appears on unshared projects"
                                            id="tw.unshared.2"
                                            values={{
                                                link: (
                                                    <a
                                                        href="https://docs.turbowarp.org/unshared-projects"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {'https://docs.turbowarp.org/unshared-projects'}
                                                    </a>
                                                )
                                            }}
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            // eslint-disable-next-line max-len
                                            defaultMessage="If the project was shared recently, this message may appear incorrectly for a few minutes."
                                            description="Appears on unshared projects"
                                            id="tw.unshared.cache"
                                        />
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            // eslint-disable-next-line max-len
                                            defaultMessage="If this project is actually shared, please report a bug."
                                            description="Appears on unshared projects"
                                            id="tw.unshared.bug"
                                        />
                                    </p>
                                </div>
                            )}
                            {hasCloudVariables && projectId !== '0' && (
                                <div className={styles.section}>
                                    <CloudVariableBadge />
                                </div>
                            )}
                            {description.instructions || description.credits ? (
                                <div className={styles.section}>
                                    <Description
                                        instructions={description.instructions}
                                        credits={description.credits}
                                        projectId={projectId}
                                    />
                                </div>
                            ) : null}
                            <div className={styles.section}>
                                <p>
                                    <FormattedMessage
                                        // eslint-disable-next-line max-len
                                        defaultMessage="{APP_NAME} is a Scratch mod that compiles projects to JavaScript to make them run really fast. Try it out by inputting a project ID or URL above or choosing a featured project below."
                                        description="Description of TurboWarp on the homepage"
                                        id="tw.home.description"
                                        values={{
                                            APP_NAME
                                        }}
                                    />
                                </p>
                            </div>
                            <div className={styles.section}>
                                <FeaturedProjects studio="27205657" />
                            </div>
                        </React.Fragment>
                    ) : null}
                </div>
                {isHomepage && <Footer />}
            </div>
        );
    }
}

Interface.propTypes = {
    intl: intlShape,
    hasCloudVariables: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    description: PropTypes.shape({
        credits: PropTypes.string,
        instructions: PropTypes.string
    }),
    isFullScreen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    projectId: PropTypes.string
};

const mapStateToProps = state => ({
    hasCloudVariables: state.scratchGui.tw.hasCloudVariables,
    customStageSize: state.scratchGui.customStageSize,
    description: state.scratchGui.tw.description,
    isFullScreen: state.scratchGui.mode.isFullScreen,
    isLoading: getIsLoading(state.scratchGui.projectState.loadingState),
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    isRtl: state.locales.isRtl,
    projectId: state.scratchGui.projectState.projectId
});

const mapDispatchToProps = () => ({});

const ConnectedInterface = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Interface));

const WrappedInterface = compose(
    AppStateHOC,
    ErrorBoundaryHOC('TW Interface'),
    TWProjectMetaFetcherHOC,
    TWStateManagerHOC,
    TWPackagerIntegrationHOC
)(ConnectedInterface);

export default WrappedInterface;
