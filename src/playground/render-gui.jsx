import React from 'react';
import GUI from '../containers/gui.jsx';

const searchParams = new URLSearchParams(location.search);
const cloudHost = searchParams.get('cloud_host') || 'wss://cloud.scratch-cw.top';

const RenderGUI = props => (
    <GUI
        cloudHost={cloudHost}
        canUseCloud
        hasCloudPermission
        canSave={false}
        basePath={process.env.ROOT}
        canEditTitle
        enableCommunity
        {...props}
    />
);

export default RenderGUI;
