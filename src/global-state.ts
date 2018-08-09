import * as _ from "lodash";
import {Observable, Subject} from "rxjs";
import {MutatorEvent, Store} from "./Store";

const storeSetStateMap: { [name: string]: (state: any) => void } = {};

let globalState: any = {};

const globalStateChangesSubject = new Subject<MutatorEvent<any>>();

export const globalStateChanges$: Observable<MutatorEvent<any>> = globalStateChangesSubject.asObservable();

export function resetTydux() {
    globalState = {};
    _.forEach(storeSetStateMap, (val, key) => delete storeSetStateMap[key]);
}

export function getGlobalTyduxState() {
    return globalState;
}

export function registerStore<S>(store: Store<any, S>, setStateFn: (state: S) => void) {
    if (_.has(storeSetStateMap, store.storeId)) {
        throw new Error(`store ID '${store.storeId}' is not unique`);
    }

    storeSetStateMap[store.storeId] = setStateFn;
    store.mutatorEvents$
        .subscribe((event: MutatorEvent<any>) => {
            globalState[event.storeId] = event.state;
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
    _.forEach(storeSetStateMap, (val, key) => {
        // console.log("key", key);
        // console.log("val", val);
        val({});
    });
}

export function setStoreState(storeId: string, state: any) {
    let store = storeSetStateMap[storeId];
    store(state);
}
