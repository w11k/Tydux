import {TyduxStore} from "./store";

let globalStore: TyduxStore | undefined;

export function setGlobalStore(store: TyduxStore) {
    if (globalStore !== undefined) {
        throw new Error("a global store is already defined");
    }
    globalStore = store;
}

export function getGlobalStore(): TyduxStore | undefined {
    return globalStore;
}
