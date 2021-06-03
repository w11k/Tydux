import {TyduxStore} from "./store";

let globalStore: TyduxStore | undefined;

export function setGlobalStore(store: TyduxStore) {
    if (globalStore !== undefined && store !== undefined) {
        console.warn("A global store is already defined! Call 'removeGlobalStore()' to remove the currently registered store.");
    }
    globalStore = store;
}

export function removeGlobalStore() {
    globalStore = undefined;
}

export function getGlobalStore(): TyduxStore {
    if (globalStore === undefined) {
        throw new Error("no global store registered");
    }
    return globalStore;
}
