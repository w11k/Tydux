import * as _ from "lodash";
import {Observable, Subject} from "rxjs";
import {ProcessedAction, Store} from "./Store";


class StoreWithSetStateFn {
    constructor(readonly store: Store<any, any>, readonly setStateFn: (state: any) => void) {
    }
}

const storeMap: { [name: string]: StoreWithSetStateFn } = {};

let globalState: any = {};

const globalStateChangesSubject = new Subject<ProcessedAction<any>>();

export const globalStateChanges$: Observable<ProcessedAction<any>> = globalStateChangesSubject.asObservable();

export function resetTydux() {
    globalState = {};
    _.forEach(storeMap, (val, key) => delete storeMap[key]);
}

export function getGlobalTyduxState() {
    return globalState;
}

export function registerStoreInGlobalState<S>(storeId: string,
                                              checkUnique: boolean,
                                              store: Store<any, S>,
                                              setStateFn: (state: S) => void) {

    if (checkUnique && _.has(storeMap, storeId)) {
        throw new Error(`store ID '${storeId}' is not unique`);
    }

    storeMap[storeId] = new StoreWithSetStateFn(store, setStateFn);
    store.processedActions$
        .subscribe((event: ProcessedAction<any>) => {
            globalState[storeId] = event.state;
            globalStateChangesSubject.next(event);
        });
}

export function setStateForAllStores(globalState: any) {
    let storeIds = Object.keys(globalState);
    if (storeIds.length === 0) {
        clearAllStores();
    } else {
        storeIds.forEach(key => {
            const storeState = globalState[key];
            setStoreState(key, storeState);
        });
    }
}

export function clearAllStores() {
    _.forEach(storeMap, (storeWithSetStateFn) => {
        storeWithSetStateFn.setStateFn(storeWithSetStateFn.store.initialState);
    });
}

export function setStoreState(storeId: string, state: any) {
    let entry = storeMap[storeId];
    entry.setStateFn(state);
}
