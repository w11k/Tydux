
let developmentMode = false;

export function enableTyduxDevelopmentMode(enable: boolean = true) {
    developmentMode = enable;
}

export function isTyduxDevelopmentModeEnabled() {
    return developmentMode;
}

let logMutatorDuration = true;

export function enableLogMutatorDuration(enable: boolean = true) {
    logMutatorDuration = enable;
}

export function isLogMutatorDurationEnabled() {
    return logMutatorDuration;
}
