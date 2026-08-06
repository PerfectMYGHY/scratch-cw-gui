import React from 'react';
import runAddons from '../addons/entry';

/*
 * Higher Order Component to run TurboWarp Addons
 * @param {React.Component} WrappedComponent - component to run Addons
 * @returns {React.Component} component with auto run Addons
 */
const AddonsRunnerHOC = function (WrappedComponent) {
    class AddonsRunnerWrapper extends React.Component {
        constructor (props) {
            super(props);
            runAddons();
        }
        render () {
            return (
                <WrappedComponent
                    {...this.props}
                />
            );
        }
    }
    return AddonsRunnerWrapper;
};

export default AddonsRunnerHOC;
