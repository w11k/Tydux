import {TyduxStore} from "./store";

let globalStore: TyduxStore | undefined;

export function addGlobalStore(store: TyduxStore) {
    globalStore = store;
}

export function getGlobalStore(): TyduxStore | undefined {
    return globalStore;
}
