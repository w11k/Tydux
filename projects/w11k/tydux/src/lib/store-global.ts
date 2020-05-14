import {TyduxStore} from "./store";

let globalStore: TyduxStore | undefined;

export function setGlobalStore(store: TyduxStore) {
    if (globalStore !== undefined && store !== undefined) {
        throw new Error("a global store is already defined");
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
