import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Action, Store} from "./Store";

export class MutatorEvent {
    constructor(readonly storeName: string,
                readonly action: Action,
                readonly boundMutator: () => void,
                readonly duration?: number) {
    }
}

const stores: { [name: string]: Store<any, any> } = {};

let globalState: any = {};

const globalStateChangesSubject = new Subject<MutatorEvent>();

export const globalStateChanges$: Observable<MutatorEvent> = globalStateChangesSubject.asObservable();

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
        .subscribe((event: MutatorEvent) => {
            globalState[event.storeName] = store.state;
            globalStateChangesSubject.next(event);
        });
}

