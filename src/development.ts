let developmentMode = false;

export function enableTyduxDevelopmentMode(enable: boolean = true) {
    if (!developmentMode && enable) {
        console.log("enableTyduxDevelopmentMode() called. Tydux is running in the development mode.");
    }
    developmentMode = enable;
}

export function isTyduxDevelopmentModeEnabled() {
    return developmentMode;
}
