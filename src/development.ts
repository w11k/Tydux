let developmentMode = false;

export function enableDevelopmentMode(enable: boolean = true) {
    developmentMode = enable;
}

export function isDevelopmentModeEnabled() {
    return developmentMode;
}
