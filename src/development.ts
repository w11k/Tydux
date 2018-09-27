let developmentMode = false;
declare const global: any;

export function enableTyduxDevelopmentMode(enable: boolean = true) {
    if (!developmentMode && enable && (typeof global === "undefined")) {
        console.log("enableTyduxDevelopmentMode() called. Tydux is running in the development mode.");
    }
    developmentMode = enable;
}

export function isTyduxDevelopmentModeEnabled() {
    return developmentMode;
}
