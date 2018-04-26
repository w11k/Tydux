import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {MutatorEvent, Store} from "./Store";

const stores: { [name: string]: Store<any, any> } = {};

let globalState: any = {};

const globalStateChangesSubject = new Subject<MutatorEvent<any>>();

export const globalStateChanges$: Observable<MutatorEvent<any>> = globalStateChangesSubject.asObservable();

export function resetTydux() {
    globalState = {};
    _.forEach(stores, (val, key) => delete stores[key]);
}

export function getGlobalTyduxState() {
    return globalState;
}

export function addStoreToGlobalState(store: Store<any, any>) {
    if (_.has(stores, store.storeId)) {
        throw new Error(`store ID '${store.storeId}' is not unique`);
    }

    stores[store.storeId] = store;
    store.mutatorEvents$
        .subscribe((event: MutatorEvent<any>) => {
            globalState[event.storeId] = event.state;
            globalStateChangesSubject.next(event);
        });
}

