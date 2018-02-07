import {enableDevTools} from "./dev-tools";

let developmentMode = false;

export function enableTyduxDevelopmentMode(enable: boolean = true) {
    developmentMode = enable;
    enableDevTools();
}

export function isTyduxDevelopmentModeEnabled() {
    return developmentMode;
}
