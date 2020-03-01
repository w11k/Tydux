import {compose} from "redux";
import {EnhancerOptions} from "redux-devtools-extension";

const DEV_TOOLS_COMPOSE = "__REDUX_DEVTOOLS_EXTENSION_COMPOSE__";

let devModeConfig: TyduxDevModeConfig | undefined;

export type TyduxDevModeConfig = {
    autoUseDevToolsInDevelopmentMode?: boolean;
    devTools?: EnhancerOptions
};

const defaultTyduxDevModeConfig: TyduxDevModeConfig = {
    autoUseDevToolsInDevelopmentMode: true
};

export function enableTyduxDevelopmentMode(enableOrConfig: boolean | TyduxDevModeConfig = true) {
    if (devModeConfig === undefined && enableOrConfig && (typeof Window === "function")) {
        console.log("enableTyduxDevelopmentMode() called. Tydux is running in the development mode.");
    }

    if (enableOrConfig === true) {
        devModeConfig = defaultTyduxDevModeConfig;
    } else if (enableOrConfig === false) {
        devModeConfig = undefined;
    } else {
        devModeConfig = {
            ...defaultTyduxDevModeConfig,
            ...enableOrConfig
        };
    }
}

export function isTyduxDevelopmentModeEnabled() {
    return devModeConfig !== undefined;
}

export function checkDevModeAndCreateDevToolsEnabledComposeFn(options: Partial<EnhancerOptions> = {}) {
    if (isTyduxDevelopmentModeEnabled()
        && devModeConfig.autoUseDevToolsInDevelopmentMode
        && window.hasOwnProperty(DEV_TOOLS_COMPOSE)) {

        // let options =
        //     devModeConfig !== undefined
        //     && devModeConfig.devTools !== undefined
        //         ? devModeConfig.devTools
        //         : {};
        //
        // options = {
        //     ...options,
        //     ...options,
        // };

        return window[DEV_TOOLS_COMPOSE](options);
    }

    return compose;
}
