import {compose} from "redux";
import {EnhancerOptions} from "redux-devtools-extension";

const DEV_TOOLS_COMPOSE = "__REDUX_DEVTOOLS_EXTENSION_COMPOSE__";

let developmentMode = false;

export function enableTyduxDevelopmentMode(enable: boolean = true) {
    if (!developmentMode && enable && (typeof Window === "function")) {
        console.log("enableTyduxDevelopmentMode() called. Tydux is running in the development mode.");
    }
    developmentMode = enable;
}

export function isTyduxDevelopmentModeEnabled() {
    return developmentMode;
}

export function createDevToolsEnabledComposeFn(options: EnhancerOptions = {}) {
    return developmentMode && window.hasOwnProperty(DEV_TOOLS_COMPOSE)
        ? window[DEV_TOOLS_COMPOSE](options)
        : compose;
}
