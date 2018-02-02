let developmentMode = false;

export function enableTyduxDevelopmentMode(enable: boolean = true) {
    developmentMode = enable;
}

export function isTyduxDevelopmentModeEnabled() {
    return developmentMode;
}
